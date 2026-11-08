import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startDb, stopDb, resetDb, makeUser, loginAs, lastWeekday } from './helpers.js';
import { addDays, todayStr } from '../src/utils/dates.js';

// Walks the main admin + staff flows end to end against an in-memory MongoDB.
describe('admin and staff flows', () => {
  let admin;
  let staffAgent;
  const ids = {};

  beforeAll(async () => {
    await startDb();
    await resetDb();
    await makeUser('ADMIN', 'admin@t.co');
    admin = await loginAs('admin@t.co');
  });
  afterAll(stopDb);

  const okRes = (res, status = 200) => { expect(res.status, JSON.stringify(res.body)).toBe(status); return res.body.data; };

  it('creates course, batch, staff and students', async () => {
    ids.course = okRes(await admin.post('/api/admin/courses').send({ name: 'Maths', code: 'mth', installments: [{ label: 'I1', amount: 500, dueOffsetDays: 0 }, { label: 'I2', amount: 500, dueOffsetDays: 30 }] }), 201)._id;
    ids.batch = okRes(await admin.post('/api/admin/batches').send({ name: 'Morning', course: ids.course }), 201)._id;
    const staff = okRes(await admin.post('/api/admin/staff').send({ name: 'Sita', email: 'sita@t.co', designation: 'Teacher' }), 201);
    expect(staff.temporaryPassword).toBeTruthy();
    ids.staff = staff.staff.id;
    ids.tempPw = staff.temporaryPassword;
    okRes(await admin.post(`/api/admin/batches/${ids.batch}/assign-staff`).send({ staffIds: [ids.staff] }));
    const s1 = okRes(await admin.post('/api/admin/students').send({ name: 'Ravi', parentEmail: 'p@t.co', course: ids.course, batch: ids.batch }), 201);
    expect(s1.admissionNo).toMatch(/^GE/);
    ids.student = s1._id;
    const imp = okRes(await admin.post('/api/admin/students/import').send({ csv: 'name,email,courseCode,batchName\nAsha,a@t.co,MTH,Morning\n,bad,XXX,Nope\nBala,,MTH,Morning' }));
    expect(imp).toMatchObject({ imported: 2, failed: 1 });
    expect(imp.errors[0].row).toBe(3);
    const list = await admin.get(`/api/admin/students?batch=${ids.batch}&search=ra`);
    expect(okRes(list).length).toBeGreaterThan(0);
    expect(list.body.meta.total).toBeGreaterThan(0);
  });

  it('staff logs in with a temporary password and is forced to change it', async () => {
    const { default: request } = await import('supertest');
    const { app } = await import('./helpers.js');
    staffAgent = request.agent(app);
    okRes(await staffAgent.post('/api/auth/login').send({ email: 'sita@t.co', password: ids.tempPw }));
    const blocked = await staffAgent.get('/api/staff/dashboard');
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    okRes(await staffAgent.post('/api/auth/change-password').send({ currentPassword: ids.tempPw, newPassword: 'NewPass123' }));
    okRes(await staffAgent.get('/api/staff/dashboard'));
  });

  it('staff marks attendance for their batch, checks in/out, requests leave', async () => {
    const date = lastWeekday();
    const roster = okRes(await staffAgent.get(`/api/attendance/batch/${ids.batch}?date=${date}`));
    expect(roster.students.length).toBe(3);
    const mark = okRes(await staffAgent.post(`/api/attendance/batch/${ids.batch}`).send({ date, markAllPresent: true, entries: [{ studentId: ids.student, status: 'ABSENT' }] }));
    expect(mark.saved).toBe(3);
    okRes(await staffAgent.get('/api/staff/batches'));
    okRes(await staffAgent.get(`/api/staff/batches/${ids.batch}/students`));
    expect((await staffAgent.post('/api/staff/attendance/check-in')).status).toBe(404); // admin marks staff attendance
    okRes(await staffAgent.get('/api/staff/attendance/me'));
    const from = addDays(todayStr(), 3);
    const leave = okRes(await staffAgent.post('/api/staff/leaves').send({ type: 'CASUAL', fromDate: from, toDate: addDays(from, 1), reason: 'Family' }), 201);
    ids.leave = leave._id;
    okRes(await staffAgent.get('/api/staff/leaves'));
    okRes(await staffAgent.get('/api/staff/profile'));
    okRes(await staffAgent.patch('/api/staff/profile').send({ phone: '9876543210' }));
    expect((await staffAgent.get('/api/staff/fees')).status).toBe(403); // disabled by default
  });

  it('admin reviews the leave, which deducts balance', async () => {
    const pending = okRes(await admin.get('/api/admin/leaves?status=pending'));
    expect(pending.length).toBe(1);
    const reviewed = okRes(await admin.patch(`/api/admin/leaves/${ids.leave}`).send({ status: 'APPROVED' }));
    expect(reviewed.status).toBe('APPROVED');
    expect((await admin.patch(`/api/admin/leaves/${ids.leave}`).send({ status: 'REJECTED' })).status).toBe(409);
    const staff = okRes(await admin.get(`/api/admin/staff/${ids.staff}`));
    expect(staff.leaveBalance.casual).toBeLessThan(12);
  });

  it('fees: generate, list, pay, dashboard, receipt needs B2, reminders', async () => {
    const gen = okRes(await admin.post('/api/admin/fees/generate').send({ batchId: ids.batch, startDate: addDays(todayStr(), -40) }));
    expect(gen.created).toBe(6);
    expect(okRes(await admin.post('/api/admin/fees/generate').send({ batchId: ids.batch, startDate: addDays(todayStr(), -40) })).created).toBe(0);
    const fees = okRes(await admin.get('/api/admin/fees?status=OVERDUE'));
    expect(fees.length).toBeGreaterThan(0);
    const detail = okRes(await admin.get(`/api/admin/fees/${fees[0]._id}`));
    expect(detail.balance).toBe(500);
    const pay = okRes(await admin.post(`/api/admin/fees/${fees[0]._id}/payments`).send({ amount: 500, mode: 'UPI', reference: 'X1' }), 201);
    const dash = okRes(await admin.get('/api/admin/fees/dashboard'));
    expect(dash.collectedTotal).toBe(500);
    okRes(await admin.get('/api/admin/payments'));
    expect((await admin.get(`/api/admin/payments/${pay.payment._id}/receipt`)).status).toBe(503);
    const rs = okRes(await admin.get('/api/admin/reminders/settings'));
    expect(rs.daysBefore).toEqual([7, 3, 1]);
    okRes(await admin.patch('/api/admin/reminders/settings').send({ overdueEveryDays: 2 }));
    expect((await admin.post(`/api/admin/reminders/send/${fees[1]._id}`)).status).toBe(503); // no email provider configured
    const run = okRes(await admin.post('/api/admin/reminders/run'));
    expect(run.ran).toBe(true);
    okRes(await admin.get('/api/admin/reminders/logs'));
  });

  it('dashboards, reports, holidays, settings, audit', async () => {
    const d = okRes(await admin.get('/api/admin/dashboard'));
    expect(d.counts.students).toBe(3);
    const to = todayStr();
    const from = addDays(to, -14);
    for (const type of ['student', 'batch', 'staff']) okRes(await admin.get(`/api/admin/reports/attendance?type=${type}&from=${from}&to=${to}`));
    const csv = await admin.get(`/api/admin/reports/attendance?type=student&from=${from}&to=${to}&format=csv`);
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    okRes(await admin.get('/api/admin/reports/low-attendance'));
    okRes(await admin.post('/api/admin/holidays').send({ date: addDays(to, 10), title: 'Festival' }), 201);
    expect((await admin.post('/api/admin/holidays').send({ date: addDays(to, 10), title: 'Again' })).status).toBe(409);
    const holidays = okRes(await admin.get('/api/admin/holidays'));
    okRes(await admin.delete(`/api/admin/holidays/${holidays[0]._id}`));
    okRes(await admin.patch('/api/admin/settings').send({ staffCanViewFees: true, lowAttendanceThreshold: 80 }));
    okRes(await staffAgent.get('/api/staff/fees'));
    const audit = okRes(await admin.get('/api/admin/audit-logs?entity=Payment'));
    expect(audit.length).toBe(1);
    okRes(await admin.patch(`/api/admin/staff/${ids.staff}/status`).send({ isActive: false }));
    expect((await staffAgent.get('/api/staff/dashboard')).status).toBe(401); // deactivation is immediate
  });

  it('file endpoints refuse politely when B2 is not configured, and validate input', async () => {
    const bad = await admin.post('/api/files/upload-url').send({ purpose: 'STUDENT_DOC', ownerId: ids.student, fileName: 'x.exe', contentType: 'application/x-msdownload', size: 100 });
    expect(bad.status).toBe(400);
    const big = await admin.post('/api/files/upload-url').send({ purpose: 'STUDENT_DOC', ownerId: ids.student, fileName: 'x.pdf', contentType: 'application/pdf', size: 6 * 1024 * 1024 });
    expect(big.status).toBe(400);
    const ok = await admin.post('/api/files/upload-url').send({ purpose: 'STUDENT_DOC', ownerId: ids.student, fileName: 'x.pdf', contentType: 'application/pdf', size: 1000 });
    expect(ok.status).toBe(503);
    expect((await admin.get('/api/files/download-url?key=../../etc/passwd')).status).toBe(400);
  });
});

describe('website enquiries', () => {
  it('public form saves an enquiry and the admin can manage it', async () => {
    const { default: request } = await import('supertest');
    const { app, loginAs: login, makeUser: mk, startDb: start, stopDb: stop, resetDb: reset } = await import('./helpers.js');
    await start();
    await reset();
    await mk('ADMIN', 'admin@t.co');
    const body = { name: 'Asha', email: 'asha@t.co', phone: '+91 93630 42019', program: 'Pre-School', studentAge: '3-5 years', preferredTime: 'Morning', mode: 'Online', message: 'Need details', formType: 'Program Enquiry' };
    const res = await request(app).post('/api/submit-form').send(body);
    expect(res.status).toBe(201);
    expect((await request(app).post('/api/submit-form').send({ ...body, email: 'nope' })).status).toBe(400);
    expect((await request(app).get('/api/admin/enquiries')).status).toBe(401);
    const admin = await login('admin@t.co');
    const list = await admin.get('/api/admin/enquiries?status=NEW');
    expect(list.body.data).toHaveLength(1);
    const id = list.body.data[0]._id;
    expect((await admin.patch(`/api/admin/enquiries/${id}`).send({ status: 'CONTACTED', note: 'Called' })).body.data.status).toBe('CONTACTED');
    expect((await admin.delete(`/api/admin/enquiries/${id}`)).status).toBe(200);
    await stop();
  });
});
