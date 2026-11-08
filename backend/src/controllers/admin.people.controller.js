import crypto from 'node:crypto';
import { z } from 'zod';
import { parse as parseCsv } from 'csv-parse/sync';
import User from '../models/User.js';
import StaffProfile from '../models/StaffProfile.js';
import Student from '../models/Student.js';
import { Course, Batch } from '../models/Course.js';
import { StaffAttendance, StudentAttendance } from '../models/Attendance.js';
import { StudentFee } from '../models/Fees.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, paginate, parsePaging, escapeRegex } from '../utils/http.js';
import { reqText, text, email, optEmail, optPhone, objectId, hhmm, dateStr } from '../validators/common.js';
import { hashPassword } from './auth.controller.js';
import { audit } from '../services/audit.service.js';
import { emailService } from '../services/email/email.service.js';
import { brandedHtml, htmlToText } from '../services/email/templates.js';
import { escapeHtml } from '../utils/sanitize.js';
import config from '../config/env.js';
import logger from '../config/logger.js';

const tempPassword = () => `Ge${crypto.randomBytes(5).toString('hex')}9`;

async function mailCredentials(user, pw, reason) {
  const inner = `<p>Hello ${escapeHtml(user.name)},</p><p>${escapeHtml(reason)}</p>
    <p>Email: <strong>${escapeHtml(user.email)}</strong><br/>Temporary password: <strong>${escapeHtml(pw)}</strong></p>
    <p>Sign in at <a href="${config.appUrl}/login">${config.appUrl}/login</a>. You will be asked to choose a new password.</p>`;
  await emailService.send({ to: user.email, subject: `Your ${config.instituteName} login`, html: brandedHtml(inner), text: htmlToText(inner) })
    .catch((e) => logger.warn({ err: e.message }, 'Credentials email not sent'));
}

// Retries when a generated sequential code collides with a concurrent create
async function withGeneratedCode(gen, fn) {
  for (let i = 0; i < 5; i += 1) {
    const code = await gen(i);
    try { return await fn(code); } catch (e) { if (e.code !== 11000 || !/employeeId|admissionNo/.test(e.message)) throw e; }
  }
  throw ApiError.conflict('Could not allocate a unique code, please retry');
}

// ===================== STAFF =====================

const staffFields = {
  designation: text(80).optional(),
  joinDate: dateStr.optional(),
  shiftStart: hhmm.optional(),
  shiftEnd: hhmm.optional(),
  leaveBalance: z.object({ casual: z.coerce.number().min(0).max(365), sick: z.coerce.number().min(0).max(365) }).partial().optional(),
};

export const staffSchemas = {
  create: z.object({ name: reqText(120), email, phone: optPhone, employeeId: reqText(30).optional(), password: z.string().min(8).max(128).optional(), ...staffFields }),
  update: z.object({ name: reqText(120).optional(), email: email.optional(), phone: optPhone, employeeId: reqText(30).optional(), ...staffFields }),
  status: z.object({ isActive: z.boolean() }),
};

const shapeStaff = (user, p) => ({
  id: user._id, name: user.name, email: user.email, phone: user.phone, isActive: user.isActive, lastLoginAt: user.lastLoginAt,
  mustChangePassword: user.mustChangePassword, avatarKey: user.avatarKey,
  employeeId: p?.employeeId, designation: p?.designation, joinDate: p?.joinDate, shiftStart: p?.shiftStart, shiftEnd: p?.shiftEnd,
  leaveBalance: p?.leaveBalance, documents: p?.documents || [],
});

export const listStaff = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const userFilter = { role: 'STAFF' };
  if (req.query.status === 'active') userFilter.isActive = true;
  if (req.query.status === 'inactive') userFilter.isActive = false;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    const byProfile = await StaffProfile.find({ employeeId: rx }).select('user').lean();
    userFilter.$or = [{ name: rx }, { email: rx }, { _id: { $in: byProfile.map((p) => p.user) } }];
  }
  const [users, total] = await Promise.all([
    User.find(userFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(userFilter),
  ]);
  const profiles = await StaffProfile.find({ user: { $in: users.map((u) => u._id) } }).lean();
  const byUser = new Map(profiles.map((p) => [String(p.user), p]));
  ok(res, users.map((u) => shapeStaff(u, byUser.get(String(u._id)))), { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getStaff = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'STAFF' });
  if (!user) throw ApiError.notFound('Staff not found');
  const [profile, batches] = await Promise.all([StaffProfile.findOne({ user: user._id }).lean(), Batch.find({ staff: user._id }).select('name').lean()]);
  ok(res, { ...shapeStaff(user, profile), batches });
});

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email: addr, phone: ph, password, employeeId, designation, joinDate, shiftStart, shiftEnd, leaveBalance } = req.body;
  if (await User.exists({ email: addr })) throw ApiError.conflict('A user with this email already exists');
  const pw = password || tempPassword();
  const user = await User.create({ name, email: addr, phone: ph, role: 'STAFF', passwordHash: await hashPassword(pw), mustChangePassword: true });
  try {
    const profile = await withGeneratedCode(
      async (i) => employeeId || `EMP-${String((await StaffProfile.countDocuments()) + 1 + i).padStart(3, '0')}`,
      (code) => StaffProfile.create({ user: user._id, employeeId: code, designation, joinDate, shiftStart, shiftEnd, ...(leaveBalance ? { leaveBalance } : {}) }),
    );
    await audit(req, { action: 'CREATE_STAFF', entity: 'User', entityId: user._id, after: { ...shapeStaff(user, profile) } });
    mailCredentials(user, pw, `An account has been created for you at ${config.instituteName}.`);
    created(res, { staff: shapeStaff(user, profile), temporaryPassword: password ? undefined : pw });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // keep user + profile consistent
    throw err;
  }
});

export const updateStaff = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'STAFF' });
  if (!user) throw ApiError.notFound('Staff not found');
  const profile = await StaffProfile.findOne({ user: user._id });
  const before = shapeStaff(user, profile);
  const { name, email: addr, phone: ph, employeeId, designation, joinDate, shiftStart, shiftEnd, leaveBalance } = req.body;
  if (addr && addr !== user.email && await User.exists({ email: addr })) throw ApiError.conflict('Email already in use');
  if (name) user.name = name;
  if (addr) user.email = addr;
  if (ph !== undefined) user.phone = ph;
  await user.save();
  Object.assign(profile, Object.fromEntries(Object.entries({ employeeId, designation, joinDate, shiftStart, shiftEnd }).filter(([, v]) => v !== undefined)));
  if (leaveBalance) Object.assign(profile.leaveBalance, leaveBalance);
  await profile.save();
  const after = shapeStaff(user, profile);
  await audit(req, { action: 'UPDATE_STAFF', entity: 'User', entityId: user._id, before, after });
  ok(res, after);
});

export const setStaffStatus = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'STAFF' });
  if (!user) throw ApiError.notFound('Staff not found');
  const before = { isActive: user.isActive };
  user.isActive = req.body.isActive;
  if (!user.isActive) user.sessions = []; // sign them out everywhere
  await user.save();
  await audit(req, { action: user.isActive ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF', entity: 'User', entityId: user._id, before, after: { isActive: user.isActive } });
  ok(res, { id: user._id, isActive: user.isActive });
});

export const resetStaffPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'STAFF' });
  if (!user) throw ApiError.notFound('Staff not found');
  const pw = tempPassword();
  user.passwordHash = await hashPassword(pw);
  user.mustChangePassword = true;
  user.sessions = [];
  user.failedLogins = 0;
  user.lockUntil = undefined;
  await user.save();
  await audit(req, { action: 'RESET_STAFF_PASSWORD', entity: 'User', entityId: user._id });
  mailCredentials(user, pw, 'Your password was reset by an administrator.');
  ok(res, { temporaryPassword: pw });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: 'STAFF' });
  if (!user) throw ApiError.notFound('Staff not found');
  const [att, batches] = await Promise.all([StaffAttendance.exists({ staff: user._id }), Batch.exists({ staff: user._id })]);
  if (att || batches) throw ApiError.conflict('This staff member has attendance or batch assignments. Deactivate the account instead.');
  const before = shapeStaff(user, await StaffProfile.findOne({ user: user._id }));
  await Promise.all([StaffProfile.deleteOne({ user: user._id }), user.deleteOne()]);
  await audit(req, { action: 'DELETE_STAFF', entity: 'User', entityId: user._id, before });
  ok(res, { deleted: true });
});

// ===================== STUDENTS =====================

const studentBody = {
  name: reqText(120), email: optEmail, phone: optPhone,
  parentName: text(120).optional(), parentEmail: optEmail, parentPhone: optPhone,
  course: objectId.optional().nullable(), batch: objectId.optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
};
export const studentSchemas = {
  create: z.object({ ...studentBody, admissionNo: reqText(30).optional() }),
  update: z.object(studentBody).partial().extend({ admissionNo: reqText(30).optional() }),
};

async function syncBatch(studentId, oldBatch, newBatch) {
  if (String(oldBatch || '') === String(newBatch || '')) return;
  if (oldBatch) await Batch.updateOne({ _id: oldBatch }, { $pull: { students: studentId } });
  if (newBatch) await Batch.updateOne({ _id: newBatch }, { $addToSet: { students: studentId } });
}

async function checkRefs({ course, batch }) {
  if (course && !(await Course.exists({ _id: course }))) throw ApiError.badRequest('Course not found');
  if (batch && !(await Batch.exists({ _id: batch }))) throw ApiError.badRequest('Batch not found');
}

const nextAdmission = async (i = 0) => `GE${new Date().getFullYear().toString().slice(2)}${String((await Student.countDocuments()) + 1 + i).padStart(4, '0')}`;

export const listStudents = asyncHandler(async (req, res) => {
  const f = {};
  const { search, batch, course, status } = req.query;
  if (batch) f.batch = batch;
  if (course) f.course = course;
  if (status) f.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    f.$or = [{ name: rx }, { admissionNo: rx }, { phone: rx }, { parentName: rx }, { email: rx }];
  }
  const sortKey = ['name', 'admissionNo', 'createdAt'].includes(req.query.sort) ? req.query.sort : 'createdAt';
  await paginate(res, Student, f, req.query, {
    sort: { [sortKey]: req.query.order === 'asc' ? 1 : -1 },
    populate: [{ path: 'course', select: 'name code' }, { path: 'batch', select: 'name' }],
  });
});

export const getStudent = asyncHandler(async (req, res) => {
  const s = await Student.findById(req.params.id).populate('course', 'name code').populate('batch', 'name').lean();
  if (!s) throw ApiError.notFound('Student not found');
  ok(res, s);
});

export const createStudent = asyncHandler(async (req, res) => {
  await checkRefs(req.body);
  const body = { ...req.body, course: req.body.course || undefined, batch: req.body.batch || undefined };
  const s = await withGeneratedCode((i) => body.admissionNo || nextAdmission(i), (code) => Student.create({ ...body, admissionNo: code }));
  await syncBatch(s._id, null, s.batch);
  await audit(req, { action: 'CREATE_STUDENT', entity: 'Student', entityId: s._id, after: s });
  created(res, s);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) throw ApiError.notFound('Student not found');
  await checkRefs(req.body);
  const before = s.toObject();
  const oldBatch = s.batch;
  for (const [k, v] of Object.entries(req.body)) s[k] = v === null ? undefined : v;
  await s.save();
  await syncBatch(s._id, oldBatch, s.batch);
  await audit(req, { action: 'UPDATE_STUDENT', entity: 'Student', entityId: s._id, before, after: s });
  ok(res, s);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) throw ApiError.notFound('Student not found');
  const [att, fees] = await Promise.all([StudentAttendance.exists({ student: s._id }), StudentFee.exists({ student: s._id })]);
  if (att || fees) throw ApiError.conflict('This student has attendance or fee records. Set the status to INACTIVE instead.');
  await syncBatch(s._id, s.batch, null);
  await s.deleteOne();
  await audit(req, { action: 'DELETE_STUDENT', entity: 'Student', entityId: s._id, before: s });
  ok(res, { deleted: true });
});

const importRow = z.object({
  name: reqText(120), email: optEmail, phone: optPhone, parentName: text(120).optional(), parentEmail: optEmail, parentPhone: optPhone,
  admissionNo: reqText(30).optional(), courseCode: text(20).optional(), batchName: text(80).optional(),
});
export const importSchema = z.object({ csv: z.string().min(1).max(1_000_000), dryRun: z.boolean().optional() });

// CSV columns: name,email,phone,parentName,parentEmail,parentPhone,admissionNo,courseCode,batchName
export const importStudents = asyncHandler(async (req, res) => {
  let rows;
  try {
    rows = parseCsv(req.body.csv, { columns: (h) => h.map((x) => x.trim()), skip_empty_lines: true, trim: true, bom: true, relax_column_count: true });
  } catch (e) {
    throw ApiError.badRequest(`Could not read CSV: ${e.message}`);
  }
  if (!rows.length) throw ApiError.badRequest('CSV has no data rows');
  if (rows.length > 500) throw ApiError.badRequest('Import at most 500 rows at a time');

  const [courses, batches] = await Promise.all([Course.find().lean(), Batch.find().lean()]);
  const courseBy = new Map(courses.map((c) => [c.code.toUpperCase(), c]));
  const batchBy = new Map(batches.map((b) => [b.name.toLowerCase(), b]));
  const errors = [];
  const good = [];
  const seenAdm = new Set();

  rows.forEach((raw, idx) => {
    const line = idx + 2; // header is line 1
    const parsed = importRow.safeParse(raw);
    if (!parsed.success) { errors.push({ row: line, errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }); return; }
    const d = parsed.data;
    const errs = [];
    const course = d.courseCode ? courseBy.get(d.courseCode.toUpperCase()) : undefined;
    const batch = d.batchName ? batchBy.get(d.batchName.toLowerCase()) : undefined;
    if (d.courseCode && !course) errs.push(`Unknown courseCode "${d.courseCode}"`);
    if (d.batchName && !batch) errs.push(`Unknown batchName "${d.batchName}"`);
    if (d.admissionNo && seenAdm.has(d.admissionNo)) errs.push(`Duplicate admissionNo "${d.admissionNo}" in file`);
    if (errs.length) { errors.push({ row: line, errors: errs }); return; }
    if (d.admissionNo) seenAdm.add(d.admissionNo);
    good.push({ line, data: { ...d, course: course?._id || batch?.course, batch: batch?._id } });
  });

  let imported = 0;
  if (!req.body.dryRun) {
    const base = await Student.countDocuments();
    for (const [n, g] of good.entries()) {
      try {
        const doc = await withGeneratedCode(
          (i) => g.data.admissionNo || `GE${new Date().getFullYear().toString().slice(2)}${String(base + 1 + n + i).padStart(4, '0')}`,
          (code) => Student.create({ ...g.data, admissionNo: code }),
        );
        await syncBatch(doc._id, null, doc.batch);
        imported += 1;
      } catch (e) {
        errors.push({ row: g.line, errors: [e.code === 11000 ? 'Admission number already exists' : e.message] });
      }
    }
    await audit(req, { action: 'IMPORT_STUDENTS', entity: 'Student', after: { imported, failed: errors.length } });
  }
  ok(res, { totalRows: rows.length, valid: good.length, imported, failed: errors.length, errors: errors.sort((a, b) => a.row - b.row), dryRun: !!req.body.dryRun });
});

