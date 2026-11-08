import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startDb, stopDb, resetDb, makeUser, loginAs, makeBatchWithStudents, lastWeekday } from './helpers.js';
import { calcAttendance, makeIsWorkingDay, isWithinEditWindow } from '../src/services/attendance.service.js';
import { StudentAttendance, Holiday } from '../src/models/Attendance.js';
import { addDays, todayStr } from '../src/utils/dates.js';

beforeAll(startDb);
afterAll(stopDb);

describe('attendance rules (pure)', () => {
  it('excludes holidays and non-working days from the percentage', () => {
    // 2025-01-06 Mon, 07 Tue (holiday), 08 Wed, 12 Sun
    const isWorking = makeIsWorkingDay([1, 2, 3, 4, 5, 6], new Set(['2025-01-07']));
    const records = [
      { date: '2025-01-06', status: 'PRESENT' },
      { date: '2025-01-07', status: 'ABSENT' }, // holiday: ignored
      { date: '2025-01-08', status: 'ABSENT' },
      { date: '2025-01-12', status: 'ABSENT' }, // Sunday: ignored
    ];
    const r = calcAttendance(records, isWorking);
    expect(r).toMatchObject({ present: 1, absent: 1, counted: 2, percentage: 50 });
  });

  it('counts LATE as attended and ignores EXCUSED', () => {
    const r = calcAttendance([
      { date: '2025-01-06', status: 'LATE' }, { date: '2025-01-08', status: 'EXCUSED' }, { date: '2025-01-09', status: 'PRESENT' }, { date: '2025-01-10', status: 'ABSENT' },
    ], makeIsWorkingDay());
    expect(r.percentage).toBe(66.7);
  });

  it('edit window helper', () => {
    expect(isWithinEditWindow(new Date(Date.now() - 23 * 3600e3), 24)).toBe(true);
    expect(isWithinEditWindow(new Date(Date.now() - 25 * 3600e3), 24)).toBe(false);
  });
});

describe('attendance API', () => {
  let ctx;
  let date;
  beforeEach(async () => {
    await resetDb();
    await makeUser('ADMIN', 'admin@t.co');
    const staff = await makeUser('STAFF', 'staff@t.co');
    ctx = { staff, ...(await makeBatchWithStudents(staff)) };
    date = lastWeekday();
  });

  it('never creates duplicates, even for concurrent submits', async () => {
    const staff = await loginAs('staff@t.co');
    const url = `/api/attendance/batch/${ctx.batch._id}`;
    const body = { date, markAllPresent: true };
    const results = await Promise.all([staff.post(url).send(body), staff.post(url).send(body), staff.post(url).send(body)]);
    results.forEach((r) => expect(r.status).toBe(200));
    expect(await StudentAttendance.countDocuments({ batch: ctx.batch._id, date })).toBe(3);
    const again = await staff.post(url).send(body);
    expect(again.body.data.saved).toBe(0);
    expect(await StudentAttendance.countDocuments({ batch: ctx.batch._id, date })).toBe(3);
  });

  it('blocks future dates and holidays', async () => {
    const staff = await loginAs('staff@t.co');
    const url = `/api/attendance/batch/${ctx.batch._id}`;
    const future = await staff.post(url).send({ date: addDays(todayStr(), 2), markAllPresent: true });
    expect(future.status).toBe(400);
    expect(future.body.code).toBe('FUTURE_DATE');
    await Holiday.create({ date, title: 'Test holiday' });
    const hol = await staff.post(url).send({ date, markAllPresent: true });
    expect(hol.status).toBe(400);
    expect(hol.body.message).toMatch(/Holiday/);
  });

  it('staff cannot mark a batch they are not assigned to', async () => {
    await makeUser('STAFF', 'other@t.co');
    const other = await loginAs('other@t.co');
    const res = await other.post(`/api/attendance/batch/${ctx.batch._id}`).send({ date, markAllPresent: true });
    expect(res.status).toBe(403);
  });

  it('enforces the staff edit window; admin can always edit', async () => {
    const staff = await loginAs('staff@t.co');
    await staff.post(`/api/attendance/batch/${ctx.batch._id}`).send({ date, markAllPresent: true });
    const rec = await StudentAttendance.findOne({ batch: ctx.batch._id, date });

    const fresh = await staff.patch(`/api/attendance/${rec._id}`).send({ status: 'ABSENT' });
    expect(fresh.status).toBe(200);
    expect(fresh.body.data.status).toBe('ABSENT');

    await StudentAttendance.updateOne({ _id: rec._id }, { markedAt: new Date(Date.now() - 30 * 3600e3) });
    const late = await staff.patch(`/api/attendance/${rec._id}`).send({ status: 'PRESENT' });
    expect(late.status).toBe(403);
    expect(late.body.code).toBe('EDIT_WINDOW_CLOSED');

    const admin = await loginAs('admin@t.co');
    const adm = await admin.patch(`/api/attendance/${rec._id}`).send({ status: 'EXCUSED' });
    expect(adm.status).toBe(200);
  });

  it('student history leaves holiday absences out of the percentage', async () => {
    const admin = await loginAs('admin@t.co');
    await StudentAttendance.insertMany([
      { student: ctx.students[0]._id, batch: ctx.batch._id, date, status: 'PRESENT' },
    ]);
    // A stray ABSENT record sitting on a holiday must not count
    const holiday = addDays(date, -7);
    await StudentAttendance.create({ student: ctx.students[0]._id, batch: ctx.batch._id, date: holiday, status: 'ABSENT' });
    await Holiday.create({ date: holiday, title: 'Closed' });
    const res = await admin.get(`/api/attendance/student/${ctx.students[0]._id}?from=${addDays(holiday, -1)}&to=${date}`);
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toMatchObject({ absent: 0, present: 1, percentage: 100 });
  });
});
