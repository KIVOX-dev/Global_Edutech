import { z } from 'zod';
import Student from '../models/Student.js';
import { StudentAttendance } from '../models/Attendance.js';
import { StudentFee, Payment } from '../models/Fees.js';
import { asyncHandler, ok } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';
import { monthStr } from '../validators/common.js';
import { todayStr, addDays, diffDays, monthRange } from '../utils/dates.js';
import { calcAttendance, loadCalendar } from '../services/attendance.service.js';

export const schemas = { month: z.object({ month: monthStr.optional() }).passthrough() };

const round2 = (n) => Math.round(n * 100) / 100;
const POP = [
  ['course', 'name code durationMonths startDate endDate classDays'],
  ['batch', 'name timings startDate endDate'],
];
const withRefs = (q) => POP.reduce((acc, [path, select]) => acc.populate(path, select), q);

// A parent sees only the students whose parent email is their own login email
const childrenOf = (user) => withRefs(Student.find({ parentEmail: user.email, status: 'ACTIVE' }).sort({ name: 1 }));

async function loadChild(user, id) {
  const s = await withRefs(Student.findOne({ _id: id, parentEmail: user.email }));
  if (!s) throw ApiError.notFound('Student not found');
  return s;
}

// Course window: the batch dates win, then the course dates, then admission date + course duration
export function courseWindow(s, today = todayStr()) {
  const start = s.batch?.startDate || s.course?.startDate || s.createdAt.toISOString().slice(0, 10);
  let end = s.batch?.endDate || s.course?.endDate || null;
  if (!end && s.course?.durationMonths) {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + s.course.durationMonths);
    end = d.toISOString().slice(0, 10);
  }
  if (!end) return { start, end: null, totalDays: null, daysDone: null, daysRemaining: null, progress: null, status: 'NO_END_DATE' };
  const totalDays = Math.max(1, diffDays(end, start));
  const daysDone = Math.min(totalDays, Math.max(0, diffDays(today, start)));
  const daysRemaining = Math.max(0, diffDays(end, today));
  const status = today < start ? 'NOT_STARTED' : today > end ? 'COMPLETED' : 'RUNNING';
  return { start, end, totalDays, daysDone, daysRemaining, progress: Math.round((daysDone / totalDays) * 100), status };
}

async function feeSummary(studentId, today) {
  const fees = await StudentFee.find({ student: studentId }).sort({ dueDate: 1 }).lean();
  const rows = fees.map((f) => {
    const balance = round2(f.amountDue - f.amountPaid);
    const status = balance <= 0 ? 'PAID' : f.dueDate < today ? 'OVERDUE' : f.amountPaid > 0 ? 'PARTIAL' : 'PENDING';
    return { id: f._id, label: f.installmentLabel, amountDue: f.amountDue, amountPaid: f.amountPaid, balance: Math.max(0, balance), dueDate: f.dueDate, status, daysToDue: diffDays(f.dueDate, today) };
  });
  const open = rows.filter((r) => r.balance > 0);
  const next = open.find((r) => r.dueDate >= today) || null;
  const overdue = open.filter((r) => r.status === 'OVERDUE');
  return {
    totalFee: round2(rows.reduce((a, r) => a + r.amountDue, 0)),
    totalPaid: round2(rows.reduce((a, r) => a + r.amountPaid, 0)),
    totalDue: round2(open.reduce((a, r) => a + r.balance, 0)),
    overdueAmount: round2(overdue.reduce((a, r) => a + r.balance, 0)),
    overdueCount: overdue.length,
    next: next ? { label: next.label, amount: next.balance, dueDate: next.dueDate, daysToDue: next.daysToDue } : null,
    installments: rows,
  };
}

const shapeChild = (s) => ({
  id: s._id, name: s.name, admissionNo: s.admissionNo,
  course: s.course ? { name: s.course.name, code: s.course.code, classDays: s.course.classDays || [] } : null,
  batch: s.batch ? { name: s.batch.name, timings: s.batch.timings } : null,
});

export const children = asyncHandler(async (req, res) => {
  const list = await childrenOf(req.user);
  const today = todayStr();
  const from = addDays(today, -29);
  const { isWorkingDay } = await loadCalendar(from, today);
  const out = [];
  for (const s of list) {
    const [recs, fee, todayRec] = await Promise.all([
      StudentAttendance.find({ student: s._id, date: { $gte: from, $lte: today } }).select('date status').lean(),
      feeSummary(s._id, today),
      StudentAttendance.findOne({ student: s._id, date: today }).select('status').lean(),
    ]);
    out.push({
      ...shapeChild(s), window: courseWindow(s, today), attendance30: calcAttendance(recs, isWorkingDay), today: todayRec?.status || null,
      fees: { totalFee: fee.totalFee, totalPaid: fee.totalPaid, totalDue: fee.totalDue, overdueAmount: fee.overdueAmount, next: fee.next },
    });
  }
  ok(res, { today, children: out });
});

export const attendance = asyncHandler(async (req, res) => {
  const s = await loadChild(req.user, req.params.id);
  const ym = req.query.month || todayStr().slice(0, 7);
  const { from, to } = monthRange(ym);
  const [records, cal, allRecs] = await Promise.all([
    StudentAttendance.find({ student: s._id, date: { $gte: from, $lte: to } }).sort({ date: 1 }).select('date status note').lean(),
    loadCalendar(from, to),
    StudentAttendance.find({ student: s._id }).select('date status').lean(),
  ]);
  const first = allRecs.reduce((m, r) => (r.date < m ? r.date : m), todayStr());
  const overall = calcAttendance(allRecs, (await loadCalendar(first, todayStr())).isWorkingDay);
  ok(res, { child: shapeChild(s), month: ym, from, to, records, summary: calcAttendance(records, cal.isWorkingDay), overall, holidays: [...cal.holidayMap.values()] });
});

export const course = asyncHandler(async (req, res) => {
  const s = await loadChild(req.user, req.params.id);
  ok(res, { child: shapeChild(s), window: courseWindow(s), durationMonths: s.course?.durationMonths || null, classDays: s.course?.classDays || [] });
});

export const fees = asyncHandler(async (req, res) => {
  const s = await loadChild(req.user, req.params.id);
  const [summary, payments] = await Promise.all([
    feeSummary(s._id, todayStr()),
    Payment.find({ student: s._id }).sort({ paidOn: -1 }).limit(20).select('amount paidOn mode receiptNo').lean(),
  ]);
  ok(res, { child: shapeChild(s), ...summary, payments });
});
