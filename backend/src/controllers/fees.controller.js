import { z } from 'zod';
import { FeeStructure, StudentFee, Payment } from '../models/Fees.js';
import { Course } from '../models/Course.js';
import Student from '../models/Student.js';
import { Batch } from '../models/Course.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, paginate, escapeRegex } from '../utils/http.js';
import { reqText, objectId, dateStr, money, text } from '../validators/common.js';
import { todayStr } from '../utils/dates.js';
import { generateFees, recordPayment, feeDashboard, markOverdueFees } from '../services/fee.service.js';
import { getReceiptUrl } from '../services/receipt.service.js';
import { audit } from '../services/audit.service.js';

const installment = z.object({ label: reqText(60), amount: money, dueOffsetDays: z.coerce.number().int().min(0).max(3650).default(0) });
export const schemas = {
  structure: z.object({ name: reqText(120), course: objectId, installments: z.array(installment).min(1).max(24), isActive: z.boolean().optional() }),
  generate: z.object({
    studentId: objectId.optional(), batchId: objectId.optional(), courseId: objectId.optional(), startDate: dateStr.optional(),
    totalFee: money.optional(), installmentCount: z.coerce.number().int().min(1).max(24).optional(),
    frequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  })
    .refine((v) => !!v.studentId !== !!v.batchId, 'Provide exactly one of studentId or batchId')
    .refine((v) => !v.totalFee || !!v.studentId, 'A custom total fee applies to one student'),
  payment: z.object({ amount: z.coerce.number().positive().max(10_000_000), mode: z.enum(['CASH', 'UPI', 'CARD', 'BANK', 'CHEQUE']), reference: text(80).optional(), paidOn: dateStr.optional() }),
};

export const listStructures = asyncHandler(async (req, res) => {
  await paginate(res, FeeStructure, req.query.course ? { course: req.query.course } : {}, req.query, { populate: { path: 'course', select: 'name code' } });
});

export const createStructure = asyncHandler(async (req, res) => {
  if (!(await Course.exists({ _id: req.body.course }))) throw ApiError.badRequest('Course not found');
  const totalAmount = req.body.installments.reduce((a, i) => a + i.amount, 0);
  const fs = await FeeStructure.create({ ...req.body, totalAmount });
  // Keep the course's default installments aligned so "generate" works for whole batches
  await Course.updateOne({ _id: req.body.course }, { installments: req.body.installments, totalFee: totalAmount });
  await audit(req, { action: 'CREATE_FEE_STRUCTURE', entity: 'FeeStructure', entityId: fs._id, after: fs });
  created(res, fs);
});

export const generate = asyncHandler(async (req, res) => {
  if (req.body.batchId && !(await Batch.exists({ _id: req.body.batchId }))) throw ApiError.notFound('Batch not found');
  ok(res, await generateFees(req, req.body));
});

// Builds the shared fee filter; staffStudentIds scopes the result for read-only staff access
export async function feeFilter(query, staffStudentIds) {
  const f = {};
  if (query.status) f.status = query.status;
  if (query.course) f.course = query.course;
  if (query.student) f.student = query.student;
  if (query.from || query.to) f.dueDate = { ...(query.from && { $gte: query.from }), ...(query.to && { $lte: query.to }) };
  let ids = staffStudentIds;
  if (query.batch) {
    const inBatch = (await Student.find({ batch: query.batch }).select('_id').lean()).map((s) => String(s._id));
    ids = ids ? ids.filter((i) => inBatch.includes(String(i))) : inBatch;
  }
  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    const hit = (await Student.find({ $or: [{ name: rx }, { admissionNo: rx }] }).select('_id').lean()).map((s) => String(s._id));
    ids = ids ? ids.filter((i) => hit.includes(String(i))) : hit;
  }
  if (ids) f.student = { $in: ids };
  return f;
}

export const listFees = asyncHandler(async (req, res) => {
  await markOverdueFees();
  const f = await feeFilter(req.query);
  await paginate(res, StudentFee, f, req.query, {
    sort: { dueDate: 1 },
    populate: [{ path: 'student', select: 'name admissionNo parentName' }, { path: 'course', select: 'name code' }],
    map: (x) => ({ ...x, balance: Math.round((x.amountDue - x.amountPaid) * 100) / 100 }),
  });
});

export const getFee = asyncHandler(async (req, res) => {
  const fee = await StudentFee.findById(req.params.id).populate('student', 'name admissionNo email parentName parentEmail').populate('course', 'name code').lean();
  if (!fee) throw ApiError.notFound('Fee not found');
  const payments = await Payment.find({ studentFee: fee._id }).sort({ createdAt: -1 }).populate('receivedBy', 'name').lean();
  ok(res, { ...fee, balance: Math.round((fee.amountDue - fee.amountPaid) * 100) / 100, payments });
});

export const addPayment = asyncHandler(async (req, res) => created(res, await recordPayment(req, req.params.id, req.body)));

export const listPayments = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.mode) f.mode = req.query.mode;
  if (req.query.student) f.student = req.query.student;
  if (req.query.from || req.query.to) f.paidOn = { ...(req.query.from && { $gte: req.query.from }), ...(req.query.to && { $lte: req.query.to }) };
  await paginate(res, Payment, f, req.query, {
    sort: { createdAt: -1 },
    populate: [{ path: 'student', select: 'name admissionNo' }, { path: 'receivedBy', select: 'name' }, { path: 'studentFee', select: 'installmentLabel' }],
  });
});

export const receipt = asyncHandler(async (req, res) => ok(res, await getReceiptUrl(req.params.id)));
export const dashboard = asyncHandler(async (req, res) => { await markOverdueFees(); ok(res, await feeDashboard(todayStr())); });
