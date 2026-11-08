import { StaffAttendance, LeaveRequest } from '../models/Attendance.js';
import StaffProfile from '../models/StaffProfile.js';
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

export async function checkIn(req) {
  const user = req.user;
  const date = todayStr();
  const status = await dayStatus(date);
  if (!status.isWorkingDay) throw new ApiError(400, 'NON_WORKING_DAY', `Check-in not needed: ${status.reason}`);
  const profile = await profileOf(user._id);
  const settings = await getSettings();
  const at = now().toDate();
  const late = isLate(at, profile.shiftStart, settings.staffLateGraceMinutes);

  const existing = await StaffAttendance.findOne({ staff: user._id, date });
  if (existing?.status === 'ON_LEAVE') throw ApiError.conflict('You are on approved leave today');
  if (existing?.checkIn) throw ApiError.conflict('Already checked in today');

  // Unique (staff, date) index guarantees a single row even with concurrent taps
  const rec = await StaffAttendance.findOneAndUpdate(
    { staff: user._id, date },
    { $set: { checkIn: at, status: late ? 'LATE' : 'PRESENT' } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  await audit(req, { action: 'STAFF_CHECK_IN', entity: 'StaffAttendance', entityId: rec._id, after: rec });
  return rec;
}

export async function checkOut(req) {
  const user = req.user;
  const date = todayStr();
  const rec = await StaffAttendance.findOne({ staff: user._id, date });
  if (!rec?.checkIn) throw ApiError.badRequest('You have not checked in today');
  if (rec.checkOut) throw ApiError.conflict('Already checked out today');
  const profile = await profileOf(user._id);
  rec.checkOut = now().toDate();
  rec.totalMinutes = minutesBetween(rec.checkIn, rec.checkOut);
  const shiftMinutes = minutesOf(profile.shiftEnd) - minutesOf(profile.shiftStart);
  if (shiftMinutes > 0 && rec.totalMinutes < shiftMinutes / 2) rec.status = 'HALF_DAY';
  await rec.save();
  await audit(req, { action: 'STAFF_CHECK_OUT', entity: 'StaffAttendance', entityId: rec._id, after: rec });
  return rec;
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
    else if (r?.status === 'ABSENT' || (!r && d < today && cal.isWorkingDay(d))) summary.absent += 1;
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
