import { StudentAttendance, Holiday } from '../models/Attendance.js';
import Student from '../models/Student.js';
import { Batch } from '../models/Course.js';
import { ApiError } from '../utils/ApiError.js';
import { todayStr, dayOfWeek, nowHHmm } from '../utils/dates.js';
import { getSettings } from './settings.service.js';
import { audit } from './audit.service.js';

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5, 6];

// ---------- pure helpers (unit tested) ----------

export const makeIsWorkingDay = (workingDays = DEFAULT_WORKING_DAYS, holidays = new Set()) =>
  (date) => workingDays.includes(dayOfWeek(date)) && !holidays.has(date);

/**
 * Attendance percentage = (PRESENT + LATE) / (PRESENT + LATE + ABSENT) on working days only.
 * EXCUSED days, holidays and non-working days are excluded from both sides.
 */
export function calcAttendance(records, isWorkingDay) {
  const t = { present: 0, late: 0, absent: 0, excused: 0 };
  for (const r of records) {
    if (!isWorkingDay(r.date)) continue;
    if (r.status === 'PRESENT') t.present += 1;
    else if (r.status === 'LATE') t.late += 1;
    else if (r.status === 'ABSENT') t.absent += 1;
    else if (r.status === 'EXCUSED') t.excused += 1;
  }
  const counted = t.present + t.late + t.absent;
  return { ...t, counted, percentage: counted ? Math.round(((t.present + t.late) / counted) * 1000) / 10 : null };
}

export const isWithinEditWindow = (markedAt, hours, at = new Date()) =>
  !markedAt || (at.getTime() - new Date(markedAt).getTime()) <= hours * 3600 * 1000;

// ---------- calendar ----------

export async function loadCalendar(from, to) {
  const [settings, holidays] = await Promise.all([
    getSettings(),
    Holiday.find({ date: { $gte: from, $lte: to } }).lean(),
  ]);
  const holidayMap = new Map(holidays.map((h) => [h.date, h]));
  const isWorkingDay = makeIsWorkingDay(settings.workingDays, new Set(holidayMap.keys()));
  return { settings, holidayMap, isWorkingDay };
}

export async function dayStatus(date) {
  const { settings, holidayMap, isWorkingDay } = await loadCalendar(date, date);
  const holiday = holidayMap.get(date);
  let reason = null;
  if (holiday) reason = `Holiday: ${holiday.title}`;
  else if (!isWorkingDay(date)) reason = 'Not a working day';
  return { isWorkingDay: !reason, reason, settings };
}

export async function assertMarkable(date) {
  if (date > todayStr()) throw new ApiError(400, 'FUTURE_DATE', 'Attendance cannot be marked for a future date');
  const s = await dayStatus(date);
  if (!s.isWorkingDay) throw new ApiError(400, 'NON_WORKING_DAY', `Attendance cannot be marked: ${s.reason}`);
  return s.settings;
}

// ---------- access ----------

export async function loadBatchFor(user, batchId) {
  const batch = await Batch.findById(batchId);
  if (!batch) throw ApiError.notFound('Batch not found');
  if (user.role === 'STAFF' && !batch.staff.some((s) => String(s) === String(user._id))) {
    throw ApiError.forbidden('You are not assigned to this batch');
  }
  return batch;
}

export async function assertCanSeeStudent(user, studentId) {
  const student = await Student.findById(studentId);
  if (!student) throw ApiError.notFound('Student not found');
  if (user.role === 'STAFF') {
    const ok = student.batch && await Batch.exists({ _id: student.batch, staff: user._id });
    if (!ok) throw ApiError.forbidden('This student is not in your batches');
  }
  return student;
}

// ---------- roster & marking ----------

export async function getRoster(user, batchId, date) {
  const batch = await loadBatchFor(user, batchId);
  const [students, records, status] = await Promise.all([
    Student.find({ batch: batch._id, status: 'ACTIVE' }).select('name admissionNo photoKey').sort({ name: 1 }).lean(),
    StudentAttendance.find({ batch: batch._id, date }).lean(),
    dayStatus(date),
  ]);
  const byStudent = new Map(records.map((r) => [String(r.student), r]));
  const window = status.settings.staffEditWindowHours;
  return {
    batch: { id: batch._id, name: batch.name },
    date,
    isWorkingDay: status.isWorkingDay,
    reason: status.reason,
    isFuture: date > todayStr(),
    students: students.map((s) => {
      const rec = byStudent.get(String(s._id));
      return {
        id: s._id, name: s.name, admissionNo: s.admissionNo,
        attendance: rec ? {
          id: rec._id, status: rec.status, note: rec.note, markedAt: rec.markedAt,
          locked: user.role === 'STAFF' && !isWithinEditWindow(rec.markedAt, window),
        } : null,
      };
    }),
  };
}

export async function markBatch(req, batchId, { date, entries = [], markAllPresent = false }) {
  const user = req.user;
  const batch = await loadBatchFor(user, batchId);
  const settings = await assertMarkable(date);

  if (user.role === 'STAFF' && date === todayStr() && nowHHmm() > settings.attendanceCutoffTime) {
    throw new ApiError(403, 'PAST_CUTOFF', `Attendance for today closed at ${settings.attendanceCutoffTime}`);
  }

  const roster = await Student.find({ batch: batch._id, status: 'ACTIVE' }).select('_id').lean();
  const rosterIds = new Set(roster.map((s) => String(s._id)));
  const wanted = new Map();
  if (markAllPresent) for (const id of rosterIds) wanted.set(id, { studentId: id, status: 'PRESENT' });
  for (const e of entries) wanted.set(String(e.studentId), e);

  const outsiders = [...wanted.keys()].filter((id) => !rosterIds.has(id));
  if (outsiders.length) throw ApiError.badRequest('Some students are not in this batch', { studentIds: outsiders });
  if (!wanted.size) throw ApiError.badRequest('Nothing to save');

  const existing = await StudentAttendance.find({ batch: batch._id, date }).lean();
  const existingBy = new Map(existing.map((r) => [String(r.student), r]));
  const nowDate = new Date();
  const ops = [];
  const locked = [];
  let unchanged = 0;

  for (const [id, e] of wanted) {
    const prev = existingBy.get(id);
    if (prev) {
      if (prev.status === e.status && (prev.note || '') === (e.note || '')) { unchanged += 1; continue; }
      if (user.role === 'STAFF' && !isWithinEditWindow(prev.markedAt, settings.staffEditWindowHours, nowDate)) { locked.push(id); continue; }
    }
    ops.push({
      updateOne: {
        filter: { student: id, batch: batch._id, date },
        update: {
          $set: { status: e.status, note: e.note || undefined, ...(prev ? { editedBy: user._id, editedAt: nowDate } : {}) },
          $setOnInsert: { markedBy: user._id, markedAt: nowDate },
        },
        upsert: true,
      },
    });
  }
  // The unique (student, batch, date) index makes concurrent double-submits collapse into one row
  if (ops.length) await StudentAttendance.bulkWrite(ops, { ordered: false });
  await audit(req, { action: 'MARK_ATTENDANCE', entity: 'StudentAttendance', entityId: batch._id, after: { date, saved: ops.length, locked: locked.length } });
  return { saved: ops.length, unchanged, locked, total: wanted.size };
}

export async function editRecord(req, id, { status, note }) {
  const rec = await StudentAttendance.findById(id);
  if (!rec) throw ApiError.notFound('Attendance record not found');
  const user = req.user;
  if (user.role === 'STAFF') {
    await loadBatchFor(user, rec.batch);
    const settings = await getSettings();
    if (!isWithinEditWindow(rec.markedAt, settings.staffEditWindowHours)) {
      throw new ApiError(403, 'EDIT_WINDOW_CLOSED', `Staff can edit attendance only within ${settings.staffEditWindowHours} hours. Ask an admin.`);
    }
  }
  const before = rec.toObject();
  if (status) rec.status = status;
  if (note !== undefined) rec.note = note;
  rec.editedBy = user._id;
  rec.editedAt = new Date();
  await rec.save();
  await audit(req, { action: 'EDIT_ATTENDANCE', entity: 'StudentAttendance', entityId: rec._id, before, after: rec });
  return rec;
}

export async function studentHistory(user, studentId, from, to) {
  const student = await assertCanSeeStudent(user, studentId);
  const records = await StudentAttendance.find({ student: student._id, date: { $gte: from, $lte: to } }).sort({ date: 1 }).lean();
  const { isWorkingDay } = await loadCalendar(from, to);
  return { student: { id: student._id, name: student.name, admissionNo: student.admissionNo }, from, to, records, summary: calcAttendance(records, isWorkingDay) };
}

// Per-student summary for a date range (used by reports, dashboard and low-attendance alerts)
export async function summarizeStudents({ from, to, batchId, threshold }) {
  const { isWorkingDay, settings } = await loadCalendar(from, to);
  const filter = { date: { $gte: from, $lte: to } };
  if (batchId) filter.batch = batchId;
  const records = await StudentAttendance.find(filter).select('student date status').lean();
  const grouped = new Map();
  for (const r of records) {
    const k = String(r.student);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(r);
  }
  const studentFilter = { _id: { $in: [...grouped.keys()] } };
  const students = await Student.find(studentFilter).select('name admissionNo batch course status').populate('batch', 'name').lean();
  const rows = students.map((s) => ({ student: s, ...calcAttendance(grouped.get(String(s._id)), isWorkingDay) }));
  const limit = threshold ?? settings.lowAttendanceThreshold;
  return { rows, threshold: limit, low: rows.filter((r) => r.percentage !== null && r.percentage < limit && r.student.status === 'ACTIVE') };
}

