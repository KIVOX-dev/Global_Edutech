import { z } from 'zod';
import User from '../models/User.js';
import StaffProfile from '../models/StaffProfile.js';
import Student from '../models/Student.js';
import { Batch } from '../models/Course.js';
import { StudentAttendance, StaffAttendance, LeaveRequest } from '../models/Attendance.js';
import { StudentFee } from '../models/Fees.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, paginate } from '../utils/http.js';
import { reqText, optPhone, dateStr, monthStr, text } from '../validators/common.js';
import { todayStr } from '../utils/dates.js';
import { dayStatus, loadBatchFor } from '../services/attendance.service.js';
import * as staffAtt from '../services/staffAttendance.service.js';
import { getSettings } from '../services/settings.service.js';
import { audit } from '../services/audit.service.js';
import { feeFilter } from './fees.controller.js';

export const schemas = {
  profile: z.object({ name: reqText(120).optional(), phone: optPhone }),
  month: z.object({ month: monthStr.optional() }).passthrough(),
  leave: z.object({ type: z.enum(['CASUAL', 'SICK', 'UNPAID']), fromDate: dateStr, toDate: dateStr, reason: text(500).optional() }),
};

const myBatchIds = async (userId) => (await Batch.find({ staff: userId }).select('_id').lean()).map((b) => b._id);

export const dashboard = asyncHandler(async (req, res) => {
  const today = todayStr();
  const [batches, profile, todayRec, status, pendingLeaves] = await Promise.all([
    Batch.find({ staff: req.user._id, isActive: true }).populate('course', 'name').lean(),
    StaffProfile.findOne({ user: req.user._id }).lean(),
    StaffAttendance.findOne({ staff: req.user._id, date: today }).lean(),
    dayStatus(today),
    LeaveRequest.countDocuments({ staff: req.user._id, status: 'PENDING' }),
  ]);
  const ids = batches.map((b) => b._id);
  const [marked, studentCount] = await Promise.all([
    StudentAttendance.aggregate([{ $match: { batch: { $in: ids }, date: today } }, { $group: { _id: '$batch', n: { $sum: 1 } } }]),
    Student.countDocuments({ batch: { $in: ids }, status: 'ACTIVE' }),
  ]);
  const markedSet = new Set(marked.map((m) => String(m._id)));
  ok(res, {
    date: today,
    isWorkingDay: status.isWorkingDay,
    reason: status.reason,
    batchCount: batches.length,
    studentCount,
    pendingAttendance: status.isWorkingDay ? batches.filter((b) => !markedSet.has(String(b._id))).map((b) => ({ id: b._id, name: b.name })) : [],
    todayAttendance: todayRec || null,
    leaveBalance: profile?.leaveBalance,
    shift: profile ? { start: profile.shiftStart, end: profile.shiftEnd } : null,
    pendingLeaves,
  });
});

export const myBatches = asyncHandler(async (req, res) => {
  const batches = await Batch.find({ staff: req.user._id }).populate('course', 'name code').sort({ name: 1 }).lean();
  const counts = await Student.aggregate([{ $match: { batch: { $in: batches.map((b) => b._id) }, status: 'ACTIVE' } }, { $group: { _id: '$batch', n: { $sum: 1 } } }]);
  const by = new Map(counts.map((c) => [String(c._id), c.n]));
  ok(res, batches.map((b) => ({ ...b, students: undefined, staff: undefined, studentCount: by.get(String(b._id)) || 0 })));
});

export const batchStudents = asyncHandler(async (req, res) => {
  const batch = await loadBatchFor(req.user, req.params.id);
  const students = await Student.find({ batch: batch._id, status: 'ACTIVE' }).select('name admissionNo phone parentName parentPhone photoKey').sort({ name: 1 }).lean();
  ok(res, { batch: { id: batch._id, name: batch.name }, students });
});

export const getProfile = asyncHandler(async (req, res) => {
  const [user, profile] = await Promise.all([User.findById(req.user._id), StaffProfile.findOne({ user: req.user._id }).lean()]);
  ok(res, { id: user._id, name: user.name, email: user.email, phone: user.phone, avatarKey: user.avatarKey, ...profile, user: undefined, _id: undefined });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const before = { name: user.name, phone: user.phone };
  if (req.body.name) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  await user.save();
  await audit(req, { action: 'UPDATE_OWN_PROFILE', entity: 'User', entityId: user._id, before, after: { name: user.name, phone: user.phone } });
  ok(res, { id: user._id, name: user.name, phone: user.phone });
});

export const checkIn = asyncHandler(async (req, res) => created(res, await staffAtt.checkIn(req)));
export const checkOut = asyncHandler(async (req, res) => ok(res, await staffAtt.checkOut(req)));
export const myAttendance = asyncHandler(async (req, res) => ok(res, await staffAtt.monthView(req.user._id, req.query.month || todayStr().slice(0, 7))));

export const createLeave = asyncHandler(async (req, res) => created(res, await staffAtt.createLeave(req, req.body)));
export const myLeaves = asyncHandler(async (req, res) => paginate(res, LeaveRequest, { staff: req.user._id }, req.query, { sort: { createdAt: -1 } }));

// Read-only fee view for staff, only when an admin enabled it, scoped to students in their own batches
export const fees = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  if (!settings.staffCanViewFees) throw ApiError.forbidden('Fee access is not enabled for staff');
  const ids = (await Student.find({ batch: { $in: await myBatchIds(req.user._id) } }).select('_id').lean()).map((s) => String(s._id));
  const f = await feeFilter(req.query, ids);
  await paginate(res, StudentFee, f, req.query, {
    sort: { dueDate: 1 },
    populate: [{ path: 'student', select: 'name admissionNo' }, { path: 'course', select: 'name' }],
    map: (x) => ({ ...x, balance: Math.round((x.amountDue - x.amountPaid) * 100) / 100 }),
  });
});
