import { z } from 'zod';
import { Course, Batch } from '../models/Course.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { Holiday, StudentAttendance } from '../models/Attendance.js';
import { StudentFee } from '../models/Fees.js';
import { Setting, AuditLog } from '../models/System.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, paginate, escapeRegex } from '../utils/http.js';
import { reqText, text, objectId, dateStr, hhmm, money } from '../validators/common.js';
import { audit } from '../services/audit.service.js';
import { getSettings } from '../services/settings.service.js';
import { rescheduleReminders } from '../jobs/scheduler.js';

// ===================== COURSES =====================
const installment = z.object({ label: reqText(60), amount: money, dueOffsetDays: z.coerce.number().int().min(0).max(3650).default(0) });
const courseBody = {
  name: reqText(120), code: reqText(20), durationMonths: z.coerce.number().int().min(1).max(120).optional(),
  totalFee: money.optional(), installments: z.array(installment).max(24).optional(),
};
export const courseSchemas = { create: z.object(courseBody), update: z.object(courseBody).partial() };

export const listCourses = asyncHandler(async (req, res) => {
  const f = req.query.search ? { $or: [{ name: new RegExp(escapeRegex(req.query.search), 'i') }, { code: new RegExp(escapeRegex(req.query.search), 'i') }] } : {};
  await paginate(res, Course, f, req.query, { sort: { name: 1 } });
});

export const createCourse = asyncHandler(async (req, res) => {
  const c = await Course.create(req.body);
  await audit(req, { action: 'CREATE_COURSE', entity: 'Course', entityId: c._id, after: c });
  created(res, c);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const c = await Course.findById(req.params.id);
  if (!c) throw ApiError.notFound('Course not found');
  const before = c.toObject();
  c.set(req.body);
  await c.save();
  await audit(req, { action: 'UPDATE_COURSE', entity: 'Course', entityId: c._id, before, after: c });
  ok(res, c);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const c = await Course.findById(req.params.id);
  if (!c) throw ApiError.notFound('Course not found');
  const [s, b, f] = await Promise.all([Student.exists({ course: c._id }), Batch.exists({ course: c._id }), StudentFee.exists({ course: c._id })]);
  if (s || b || f) throw ApiError.conflict('Course is used by students, batches or fees and cannot be deleted');
  await c.deleteOne();
  await audit(req, { action: 'DELETE_COURSE', entity: 'Course', entityId: c._id, before: c });
  ok(res, { deleted: true });
});

// ===================== BATCHES =====================
const batchBody = {
  name: reqText(120), course: objectId, startDate: dateStr.optional(), endDate: dateStr.optional(),
  timings: text(80).optional(), isActive: z.boolean().optional(),
};
export const batchSchemas = {
  create: z.object(batchBody),
  update: z.object(batchBody).partial(),
  assignStaff: z.object({ staffIds: z.array(objectId).max(50) }),
  assignStudents: z.object({ studentIds: z.array(objectId).max(500), mode: z.enum(['add', 'set', 'remove']).default('add') }),
};

export const listBatches = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.course) f.course = req.query.course;
  if (req.query.active) f.isActive = req.query.active === 'true';
  if (req.query.search) f.name = new RegExp(escapeRegex(req.query.search), 'i');
  await paginate(res, Batch, f, req.query, {
    sort: { createdAt: -1 },
    populate: [{ path: 'course', select: 'name code' }, { path: 'staff', select: 'name email' }],
    map: (b) => ({ ...b, studentCount: b.students?.length || 0, students: undefined }),
  });
});

export const createBatch = asyncHandler(async (req, res) => {
  if (!(await Course.exists({ _id: req.body.course }))) throw ApiError.badRequest('Course not found');
  const b = await Batch.create(req.body);
  await audit(req, { action: 'CREATE_BATCH', entity: 'Batch', entityId: b._id, after: b });
  created(res, b);
});

export const updateBatch = asyncHandler(async (req, res) => {
  const b = await Batch.findById(req.params.id);
  if (!b) throw ApiError.notFound('Batch not found');
  if (req.body.course && !(await Course.exists({ _id: req.body.course }))) throw ApiError.badRequest('Course not found');
  const before = b.toObject();
  b.set(req.body);
  await b.save();
  await audit(req, { action: 'UPDATE_BATCH', entity: 'Batch', entityId: b._id, before, after: b });
  ok(res, b);
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const b = await Batch.findById(req.params.id);
  if (!b) throw ApiError.notFound('Batch not found');
  if (await StudentAttendance.exists({ batch: b._id })) throw ApiError.conflict('Batch has attendance records. Mark it inactive instead.');
  await Student.updateMany({ batch: b._id }, { $unset: { batch: 1 } });
  await b.deleteOne();
  await audit(req, { action: 'DELETE_BATCH', entity: 'Batch', entityId: b._id, before: b });
  ok(res, { deleted: true });
});

export const assignStaff = asyncHandler(async (req, res) => {
  const b = await Batch.findById(req.params.id);
  if (!b) throw ApiError.notFound('Batch not found');
  const ids = [...new Set(req.body.staffIds)];
  const valid = await User.countDocuments({ _id: { $in: ids }, role: 'STAFF', isActive: true });
  if (valid !== ids.length) throw ApiError.badRequest('One or more staff ids are invalid or inactive');
  const before = { staff: b.staff };
  b.staff = ids;
  await b.save();
  await audit(req, { action: 'ASSIGN_BATCH_STAFF', entity: 'Batch', entityId: b._id, before, after: { staff: ids } });
  ok(res, b);
});

export const assignStudents = asyncHandler(async (req, res) => {
  const b = await Batch.findById(req.params.id);
  if (!b) throw ApiError.notFound('Batch not found');
  const ids = [...new Set(req.body.studentIds)];
  const valid = await Student.countDocuments({ _id: { $in: ids } });
  if (valid !== ids.length) throw ApiError.badRequest('One or more student ids are invalid');
  const before = { students: b.students.length };

  if (req.body.mode === 'remove') {
    await Student.updateMany({ _id: { $in: ids }, batch: b._id }, { $unset: { batch: 1 } });
    await Batch.updateOne({ _id: b._id }, { $pull: { students: { $in: ids } } });
  } else {
    if (req.body.mode === 'set') {
      await Student.updateMany({ batch: b._id, _id: { $nin: ids } }, { $unset: { batch: 1 } });
    }
    // A student belongs to one batch: detach from previous batches first
    const moving = await Student.find({ _id: { $in: ids }, batch: { $ne: b._id, $exists: true } }).select('batch').lean();
    for (const m of moving) await Batch.updateOne({ _id: m.batch }, { $pull: { students: m._id } });
    await Student.updateMany({ _id: { $in: ids } }, { batch: b._id, course: b.course });
    await Batch.updateOne({ _id: b._id }, req.body.mode === 'set' ? { $set: { students: ids } } : { $addToSet: { students: { $each: ids } } });
  }
  const fresh = await Batch.findById(b._id).lean();
  await audit(req, { action: 'ASSIGN_BATCH_STUDENTS', entity: 'Batch', entityId: b._id, before, after: { mode: req.body.mode, students: fresh.students.length } });
  ok(res, { ...fresh, studentCount: fresh.students.length, students: undefined });
});

// ===================== HOLIDAYS =====================
export const holidaySchemas = { create: z.object({ date: dateStr, title: reqText(120), type: z.enum(['PUBLIC', 'INSTITUTE', 'OTHER']).default('INSTITUTE') }) };

export const listHolidays = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.from || req.query.to) f.date = { ...(req.query.from && { $gte: req.query.from }), ...(req.query.to && { $lte: req.query.to }) };
  if (req.query.year) f.date = { $gte: `${req.query.year}-01-01`, $lte: `${req.query.year}-12-31` };
  await paginate(res, Holiday, f, { ...req.query, limit: req.query.limit || 200 }, { sort: { date: 1 } });
});

export const createHoliday = asyncHandler(async (req, res) => {
  const h = await Holiday.create(req.body);
  await audit(req, { action: 'CREATE_HOLIDAY', entity: 'Holiday', entityId: h._id, after: h });
  created(res, h);
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  const h = await Holiday.findByIdAndDelete(req.params.id);
  if (!h) throw ApiError.notFound('Holiday not found');
  await audit(req, { action: 'DELETE_HOLIDAY', entity: 'Holiday', entityId: h._id, before: h });
  ok(res, { deleted: true });
});

// ===================== SETTINGS =====================
export const settingsSchema = z.object({
  academicYear: reqText(20), workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  attendanceCutoffTime: hhmm, lowAttendanceThreshold: z.coerce.number().min(0).max(100),
  staffEditWindowHours: z.coerce.number().min(0).max(720), staffLateGraceMinutes: z.coerce.number().min(0).max(240),
  staffCanViewFees: z.boolean(),
}).partial();

export const getSettingsHandler = asyncHandler(async (req, res) => ok(res, await getSettings()));

export const updateSettings = asyncHandler(async (req, res) => {
  const s = await getSettings();
  const before = s.toObject();
  s.set(req.body);
  await s.save();
  await audit(req, { action: 'UPDATE_SETTINGS', entity: 'Setting', entityId: s._id, before, after: s });
  ok(res, s);
});

// ===================== AUDIT =====================
export const listAudit = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.actor) f.actor = req.query.actor;
  if (req.query.entity) f.entity = req.query.entity;
  if (req.query.action) f.action = req.query.action;
  if (req.query.from || req.query.to) {
    f.createdAt = {};
    if (req.query.from) f.createdAt.$gte = new Date(`${req.query.from}T00:00:00+05:30`);
    if (req.query.to) f.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999+05:30`);
  }
  await paginate(res, AuditLog, f, req.query, { sort: { createdAt: -1 } });
});

export { Setting };
