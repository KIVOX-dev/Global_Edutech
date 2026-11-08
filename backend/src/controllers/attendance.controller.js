import { z } from 'zod';
import { StaffAttendance, LeaveRequest } from '../models/Attendance.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { Batch } from '../models/Course.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, paginate } from '../utils/http.js';
import { objectId, dateStr, text, hhmm } from '../validators/common.js';
import { todayStr, addDays } from '../utils/dates.js';
import { toCsv } from '../utils/csv.js';
import * as att from '../services/attendance.service.js';
import * as staffAtt from '../services/staffAttendance.service.js';
import { isStorageConfigured, putObject, getDownloadUrl } from '../services/storage.service.js';

const status = z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);
export const schemas = {
  dateQuery: z.object({ date: dateStr.optional() }).passthrough(),
  mark: z.object({
    date: dateStr,
    markAllPresent: z.boolean().optional(),
    entries: z.array(z.object({ studentId: objectId, status, note: text(300).optional() })).max(500).default([]),
  }),
  edit: z.object({ status: status.optional(), note: text(300).optional() }).refine((v) => v.status || v.note !== undefined, 'Nothing to update'),
  range: z.object({ from: dateStr.optional(), to: dateStr.optional() }).passthrough(),
  staffMark: z.object({
    date: dateStr,
    markAllPresent: z.boolean().optional(),
    entries: z.array(z.object({ staffId: objectId, status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE', 'HALF_DAY']), note: text(300).optional() })).max(200).default([]),
  }),
  staffEdit: z.object({
    status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE', 'HALF_DAY']).optional(),
    checkIn: z.coerce.date().optional(), checkOut: z.coerce.date().optional(), note: text(300).optional(),
  }),
  leaveReview: z.object({ status: z.enum(['APPROVED', 'REJECTED']), reviewNote: text(300).optional() }),
  report: z.object({ type: z.enum(['student', 'batch', 'staff']), from: dateStr, to: dateStr, format: z.enum(['json', 'csv']).default('json'), batch: objectId.optional() }),
  low: z.object({ from: dateStr.optional(), to: dateStr.optional(), threshold: z.coerce.number().min(0).max(100).optional(), batch: objectId.optional() }).passthrough(),
};

// ---------- student attendance (admin + staff) ----------
export const roster = asyncHandler(async (req, res) => ok(res, await att.getRoster(req.user, req.params.batchId, req.query.date || todayStr())));
export const mark = asyncHandler(async (req, res) => ok(res, await att.markBatch(req, req.params.batchId, req.body)));
export const edit = asyncHandler(async (req, res) => ok(res, await att.editRecord(req, req.params.id, req.body)));
export const studentHistory = asyncHandler(async (req, res) => {
  const to = req.query.to || todayStr();
  const from = req.query.from || addDays(to, -29);
  ok(res, await att.studentHistory(req.user, req.params.studentId, from, to));
});

// ---------- admin oversight ----------
export const listStaffAttendance = asyncHandler(async (req, res) => {
  const to = req.query.to || todayStr();
  const from = req.query.from || addDays(to, -6);
  const f = { date: { $gte: from, $lte: to } };
  if (req.query.staff) f.staff = req.query.staff;
  await paginate(res, StaffAttendance, f, { limit: 100, ...req.query }, { sort: { date: -1 }, populate: { path: 'staff', select: 'name email' } });
});

export const staffRoster = asyncHandler(async (req, res) => ok(res, await staffAtt.staffRoster(req.query.date || todayStr())));
export const markStaff = asyncHandler(async (req, res) => ok(res, await staffAtt.markStaff(req, req.body)));
export const editStaffAttendance = asyncHandler(async (req, res) => ok(res, await staffAtt.adminEditStaffAttendance(req, req.params.id, req.body)));

export const listLeaves = asyncHandler(async (req, res) => {
  const f = req.query.status ? { status: String(req.query.status).toUpperCase() } : {};
  await paginate(res, LeaveRequest, f, req.query, { sort: { createdAt: -1 }, populate: [{ path: 'staff', select: 'name email' }, { path: 'reviewedBy', select: 'name' }] });
});

export const reviewLeave = asyncHandler(async (req, res) => ok(res, await staffAtt.reviewLeave(req, req.params.id, req.body)));

// ---------- reports ----------
async function deliverCsv(res, name, columns, rows) {
  const csv = toCsv(columns, rows);
  if (!isStorageConfigured()) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
    return res.send(csv);
  }
  const key = `exports/${todayStr()}/${name}-${Date.now()}.csv`;
  await putObject(key, Buffer.from(csv, 'utf8'), 'text/csv');
  return ok(res, { key, url: await getDownloadUrl(key, 300, `${name}.csv`), expiresIn: 300, rows: rows.length });
}

export const attendanceReport = asyncHandler(async (req, res) => {
  const { type, from, to, format, batch } = req.query;
  if (to < from) throw ApiError.badRequest('"to" must not be before "from"');
  let columns;
  let rows;

  if (type === 'staff') {
    const users = await User.find({ role: 'STAFF' }).select('name email').lean();
    const recs = await StaffAttendance.find({ date: { $gte: from, $lte: to } }).lean();
    const by = new Map();
    for (const r of recs) { const k = String(r.staff); if (!by.has(k)) by.set(k, []); by.get(k).push(r); }
    rows = users.map((u) => {
      const list = by.get(String(u._id)) || [];
      const c = (s) => list.filter((r) => r.status === s).length;
      return { name: u.name, email: u.email, present: c('PRESENT'), late: c('LATE'), halfDay: c('HALF_DAY'), onLeave: c('ON_LEAVE'), absent: c('ABSENT'), hours: Math.round(list.reduce((a, r) => a + (r.totalMinutes || 0), 0) / 6) / 10 };
    });
    columns = ['name', 'email', 'present', 'late', 'halfDay', 'onLeave', 'absent', 'hours'].map((k) => ({ header: k, key: k }));
  } else {
    const { rows: summary } = await att.summarizeStudents({ from, to, batchId: batch });
    const flat = summary.map((r) => ({
      admissionNo: r.student.admissionNo, name: r.student.name, batch: r.student.batch?.name || '', present: r.present, late: r.late, absent: r.absent, excused: r.excused, percentage: r.percentage ?? '',
    }));
    if (type === 'batch') {
      const g = new Map();
      for (const r of flat) {
        const k = r.batch || '(no batch)';
        const o = g.get(k) || { batch: k, students: 0, present: 0, late: 0, absent: 0 };
        o.students += 1; o.present += r.present; o.late += r.late; o.absent += r.absent; g.set(k, o);
      }
      rows = [...g.values()].map((o) => ({ ...o, percentage: o.present + o.late + o.absent ? Math.round(((o.present + o.late) / (o.present + o.late + o.absent)) * 1000) / 10 : '' }));
      columns = ['batch', 'students', 'present', 'late', 'absent', 'percentage'].map((k) => ({ header: k, key: k }));
    } else {
      rows = flat;
      columns = ['admissionNo', 'name', 'batch', 'present', 'late', 'absent', 'excused', 'percentage'].map((k) => ({ header: k, key: k }));
    }
  }
  if (format === 'csv') return deliverCsv(res, `attendance-${type}-${from}_to_${to}`, columns, rows);
  return ok(res, { type, from, to, rows }, { total: rows.length });
});

export const lowAttendance = asyncHandler(async (req, res) => {
  const to = req.query.to || todayStr();
  const from = req.query.from || addDays(to, -29);
  const r = await att.summarizeStudents({ from, to, batchId: req.query.batch, threshold: req.query.threshold });
  ok(res, {
    from, to, threshold: r.threshold,
    students: r.low.sort((a, b) => a.percentage - b.percentage).map((x) => ({
      id: x.student._id, name: x.student.name, admissionNo: x.student.admissionNo, batch: x.student.batch?.name, percentage: x.percentage, present: x.present, late: x.late, absent: x.absent,
    })),
  });
});

export { Student, Batch, hhmm };
