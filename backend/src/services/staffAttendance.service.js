import { StaffAttendance, LeaveRequest } from '../models/Attendance.js';
import StaffProfile from '../models/StaffProfile.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { todayStr, now, toHHmm, minutesOf, eachDate, monthRange } from '../utils/dates.js';
import { dayStatus, loadCalendar } from './attendance.service.js';
import { getSettings } from './settings.service.js';
import { audit } from './audit.service.js';

// ---------- pure helpers ----------
export const isLate = (checkInDate, shiftStart, graceMinutes) => minutesOf(toHHmm(checkInDate)) > minutesOf(shiftStart) + graceMinutes;
export const minutesBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));

async function profileOf(userId) {
  const p = await StaffProfile.findOne({ user: userId });
  if (!p) throw ApiError.notFound('Staff profile not found');
  return p;
}

// Staff attendance is recorded by the admin only (no self check-in)
export async function staffRoster(date) {
  const staff = await User.find({ role: 'STAFF', isActive: true }).select('name email').sort({ name: 1 }).lean();
  const recs = await StaffAttendance.find({ date, staff: { $in: staff.map((u) => u._id) } }).lean();
  const by = new Map(recs.map((r) => [String(r.staff), r]));
  const day = await dayStatus(date);
  return {
    date, isWorkingDay: day.isWorkingDay, reason: day.reason,
    staff: staff.map((u) => ({ id: u._id, name: u.name, email: u.email, status: by.get(String(u._id))?.status || null, note: by.get(String(u._id))?.note || '' })),
  };
}

export async function markStaff(req, { date, entries, markAllPresent }) {
  if (date > todayStr()) throw ApiError.badRequest('Cannot mark attendance for a future date');
  const day = await dayStatus(date);
  if (!day.isWorkingDay) throw new ApiError(400, 'NON_WORKING_DAY', `Not a working day: ${day.reason}`);
  const active = await User.find({ role: 'STAFF', isActive: true }).select('_id').lean();
  const ok = new Set(active.map((u) => String(u._id)));
  const chosen = new Map();
  if (markAllPresent) {
    const existing = new Set((await StaffAttendance.find({ date }).select('staff').lean()).map((r) => String(r.staff)));
    for (const id of ok) if (!existing.has(id)) chosen.set(id, { status: 'PRESENT' });
  }
  for (const e of entries || []) {
    if (!ok.has(String(e.staffId))) throw ApiError.badRequest('One or more staff members are invalid or inactive');
    chosen.set(String(e.staffId), { status: e.status, note: e.note });
  }
  const ops = [...chosen].map(([staff, v]) => ({
    updateOne: { filter: { staff, date }, update: { $set: { status: v.status, ...(v.note !== undefined && { note: v.note }) } }, upsert: true },
  }));
  if (ops.length) await StaffAttendance.bulkWrite(ops, { ordered: false });
  await audit(req, { action: 'ADMIN_MARK_STAFF_ATTENDANCE', entity: 'StaffAttendance', after: { date, saved: ops.length } });
  return { date, saved: ops.length };
}

export async function monthView(userId, ym) {
  const { from, to } = monthRange(ym);
  const [records, cal] = await Promise.all([
    StaffAttendance.find({ staff: userId, date: { $gte: from, $lte: to } }).sort({ date: 1 }).lean(),
    loadCalendar(from, to),
  ]);
  const summary = { present: 0, late: 0, halfDay: 0, onLeave: 0, absent: 0, totalMinutes: 0 };
  const today = todayStr();
  const byDate = new Map(records.map((r) => [r.date, r]));
  for (const d of eachDate(from, to)) {
    const r = byDate.get(d);
    if (r?.status === 'PRESENT') summary.present += 1;
    else if (r?.status === 'LATE') { summary.late += 1; summary.present += 1; }
    else if (r?.status === 'HALF_DAY') summary.halfDay += 1;
    else if (r?.status === 'ON_LEAVE') summary.onLeave += 1;
    else if (r?.status === 'ABSENT') summary.absent += 1;
    summary.totalMinutes += r?.totalMinutes || 0;
  }
  return { month: ym, from, to, records, summary, holidays: [...cal.holidayMap.values()] };
}

export async function adminEditStaffAttendance(req, id, patch) {
  const rec = await StaffAttendance.findById(id);
  if (!rec) throw ApiError.notFound('Record not found');
  const before = rec.toObject();
  for (const k of ['status', 'note']) if (patch[k] !== undefined) rec[k] = patch[k];
  if (patch.checkIn !== undefined) rec.checkIn = patch.checkIn;
  if (patch.checkOut !== undefined) rec.checkOut = patch.checkOut;
  rec.totalMinutes = rec.checkIn && rec.checkOut ? minutesBetween(rec.checkIn, rec.checkOut) : 0;
  await rec.save();
  await audit(req, { action: 'ADMIN_EDIT_STAFF_ATTENDANCE', entity: 'StaffAttendance', entityId: rec._id, before, after: rec });
  return rec;
}

// ---------- leaves ----------

export async function countLeaveDays(from, to) {
  const { isWorkingDay } = await loadCalendar(from, to);
  return eachDate(from, to).filter(isWorkingDay).length;
}

export async function createLeave(req, { type, fromDate, toDate, reason }) {
  if (toDate < fromDate) throw ApiError.badRequest('End date is before start date');
  if (fromDate < todayStr()) throw ApiError.badRequest('Leave cannot start in the past');
  const days = await countLeaveDays(fromDate, toDate);
  if (days === 0) throw ApiError.badRequest('Selected dates contain no working days');
  const overlap = await LeaveRequest.exists({
    staff: req.user._id, status: { $in: ['PENDING', 'APPROVED'] }, fromDate: { $lte: toDate }, toDate: { $gte: fromDate },
  });
  if (overlap) throw ApiError.conflict('You already have a leave request overlapping these dates');
  const leave = await LeaveRequest.create({ staff: req.user._id, type, fromDate, toDate, days, reason });
  await audit(req, { action: 'LEAVE_REQUEST', entity: 'LeaveRequest', entityId: leave._id, after: leave });
  return leave;
}

export async function reviewLeave(req, id, { status, reviewNote }) {
  const leave = await LeaveRequest.findById(id);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'PENDING') throw ApiError.conflict(`Leave was already ${leave.status.toLowerCase()}`);
  const before = leave.toObject();

  if (status === 'APPROVED') {
    if (leave.type !== 'UNPAID') {
      const field = leave.type === 'CASUAL' ? 'leaveBalance.casual' : 'leaveBalance.sick';
      // Guarded decrement: fails atomically if the balance is not enough
      const upd = await StaffProfile.updateOne({ user: leave.staff, [field]: { $gte: leave.days } }, { $inc: { [field]: -leave.days } });
      if (!upd.modifiedCount) throw ApiError.badRequest(`Insufficient ${leave.type.toLowerCase()} leave balance`);
    }
    const { isWorkingDay } = await loadCalendar(leave.fromDate, leave.toDate);
    const ops = eachDate(leave.fromDate, leave.toDate).filter(isWorkingDay).map((date) => ({
      updateOne: { filter: { staff: leave.staff, date, checkIn: { $exists: false } }, update: { $set: { status: 'ON_LEAVE', totalMinutes: 0 } }, upsert: true },
    }));
    // Days the staff member already checked in on match no filter and hit the unique index: those duplicate-key errors are expected
    if (ops.length) await StaffAttendance.bulkWrite(ops, { ordered: false }).catch((e) => { if (e.code !== 11000) throw e; });
  }
  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewNote = reviewNote;
  leave.reviewedAt = new Date();
  await leave.save();
  await audit(req, { action: `LEAVE_${status}`, entity: 'LeaveRequest', entityId: leave._id, before, after: leave });
  return leave;
}
