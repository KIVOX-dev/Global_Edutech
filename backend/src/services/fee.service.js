import { StudentFee, Payment } from '../models/Fees.js';
import { Course } from '../models/Course.js';
import Student from '../models/Student.js';
import { ApiError } from '../utils/ApiError.js';
import { round2 } from '../utils/money.js';
import { todayStr, addDays } from '../utils/dates.js';
import { audit } from './audit.service.js';

// ---------- pure helpers (unit tested) ----------

/** PAID when fully paid; OVERDUE when past due and unpaid/partly paid; PARTIAL when some paid; else PENDING. */
export function computeFeeStatus({ amountDue, amountPaid, dueDate }, today = todayStr()) {
  if (round2(amountPaid) >= round2(amountDue)) return 'PAID';
  if (dueDate < today) return 'OVERDUE';
  return amountPaid > 0 ? 'PARTIAL' : 'PENDING';
}

export const balanceOf = (fee) => round2(fee.amountDue - fee.amountPaid);

// ---------- fee generation ----------

export async function generateFees(req, { studentId, batchId, courseId, startDate }) {
  const students = studentId
    ? await Student.find({ _id: studentId })
    : await Student.find({ batch: batchId, status: 'ACTIVE' });
  if (!students.length) throw ApiError.notFound('No students found for this request');

  const base = startDate || todayStr();
  const courses = new Map();
  let created = 0;
  let skipped = 0;
  const problems = [];

  for (const s of students) {
    const cid = String(courseId || s.course || '');
    if (!cid) { problems.push({ student: s.name, error: 'Student has no course' }); continue; }
    if (!courses.has(cid)) courses.set(cid, await Course.findById(cid).lean());
    const course = courses.get(cid);
    if (!course?.installments?.length) { problems.push({ student: s.name, error: 'Course has no installments' }); continue; }

    const have = new Set((await StudentFee.find({ student: s._id, course: course._id }).select('installmentLabel').lean()).map((f) => f.installmentLabel));
    const docs = course.installments.filter((i) => !have.has(i.label)).map((i) => {
      const dueDate = addDays(base, i.dueOffsetDays || 0);
      const fee = { student: s._id, course: course._id, installmentLabel: i.label, amountDue: i.amount, amountPaid: 0, dueDate };
      return { ...fee, status: computeFeeStatus(fee) };
    });
    skipped += course.installments.length - docs.length;
    // The unique (student, course, installmentLabel) index still protects against concurrent runs
    const res = docs.length ? await StudentFee.insertMany(docs, { ordered: false }).catch((e) => { if (e.code === 11000) return []; throw e; }) : [];
    created += res.length;
  }
  await audit(req, { action: 'GENERATE_FEES', entity: 'StudentFee', entityId: studentId || batchId, after: { created, skipped } });
  return { created, skipped, problems };
}

// ---------- payments ----------

let receiptSeq = 0;
const receiptNumber = () => `RC-${todayStr().replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}${(receiptSeq++ % 36).toString(36).toUpperCase()}`;

/**
 * Records a full or partial payment. The guarded $inc only matches while amountPaid + amount <= amountDue,
 * so two concurrent requests can never overpay (atomic, no transaction required).
 */
export async function recordPayment(req, feeId, { amount, mode, reference, paidOn }) {
  const amt = round2(amount);
  const fee = await StudentFee.findById(feeId);
  if (!fee) throw ApiError.notFound('Fee not found');
  if (fee.status === 'PAID') throw ApiError.conflict('This fee is already fully paid');
  const balance = balanceOf(fee);
  if (amt > balance) throw ApiError.badRequest(`Amount exceeds the outstanding balance of ${balance}`);

  const updated = await StudentFee.findOneAndUpdate(
    { _id: feeId, $expr: { $lte: [{ $add: ['$amountPaid', amt] }, { $add: ['$amountDue', 0.001] }] } },
    { $inc: { amountPaid: amt } },
    { returnDocument: 'after' },
  );
  if (!updated) throw ApiError.badRequest('Amount exceeds the outstanding balance (it may have just changed)');

  updated.amountPaid = round2(updated.amountPaid);
  const status = computeFeeStatus(updated);
  await StudentFee.updateOne({ _id: feeId }, { amountPaid: updated.amountPaid, status });
  updated.status = status;

  let payment;
  try {
    payment = await Payment.create({
      studentFee: fee._id, student: fee.student, amount: amt, mode, reference, paidOn: paidOn || todayStr(),
      receiptNo: receiptNumber(), receivedBy: req.user._id,
    });
  } catch (err) {
    await StudentFee.updateOne({ _id: feeId }, { $inc: { amountPaid: -amt }, status: computeFeeStatus({ ...fee.toObject() }) });
    throw err;
  }
  await audit(req, {
    action: 'RECORD_PAYMENT', entity: 'Payment', entityId: payment._id,
    before: { amountPaid: fee.amountPaid, status: fee.status }, after: { amount: amt, mode, reference, amountPaid: updated.amountPaid, status },
  });
  return { payment, fee: updated };
}

// Flips pending/partial fees whose due date has passed to OVERDUE
export async function markOverdueFees(today = todayStr()) {
  const res = await StudentFee.updateMany({ status: { $in: ['PENDING', 'PARTIAL'] }, dueDate: { $lt: today } }, { $set: { status: 'OVERDUE' } });
  return res.modifiedCount;
}

export async function feeDashboard(today = todayStr()) {
  const monthStart = `${today.slice(0, 7)}-01`;
  const [collected, month, open, dueToday] = await Promise.all([
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { paidOn: { $gte: monthStart, $lte: today } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    StudentFee.aggregate([
      { $match: { status: { $ne: 'PAID' } } },
      { $group: { _id: { $cond: [{ $lt: ['$dueDate', today] }, 'overdue', 'pending'] }, total: { $sum: { $subtract: ['$amountDue', '$amountPaid'] } }, count: { $sum: 1 } } },
    ]),
    StudentFee.aggregate([
      { $match: { status: { $ne: 'PAID' }, dueDate: today } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amountDue', '$amountPaid'] } }, count: { $sum: 1 } } },
    ]),
  ]);
  const pick = (k) => open.find((o) => o._id === k) || { total: 0, count: 0 };
  return {
    collectedTotal: round2(collected[0]?.total || 0),
    collectedThisMonth: round2(month[0]?.total || 0),
    pending: { amount: round2(pick('pending').total), count: pick('pending').count },
    overdue: { amount: round2(pick('overdue').total), count: pick('overdue').count },
    dueToday: { amount: round2(dueToday[0]?.total || 0), count: dueToday[0]?.count || 0 },
  };
}
