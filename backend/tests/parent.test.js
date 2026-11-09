import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { startDb, stopDb, resetDb, makeUser, loginAs, lastWeekday, app } from './helpers.js';
import { addDays, todayStr } from '../src/utils/dates.js';

describe('parent portal', () => {
  let admin;
  let parent;
  const ids = {};
  const okRes = (res, status = 200) => { expect(res.status, JSON.stringify(res.body)).toBe(status); return res.body.data; };

  beforeAll(async () => {
    await startDb();
    await resetDb();
    await makeUser('ADMIN', 'admin@t.co');
    admin = await loginAs('admin@t.co');
    ids.course = okRes(await admin.post('/api/admin/courses').send({
      name: 'Maths', code: 'mth', durationMonths: 6, startDate: addDays(todayStr(), -30), endDate: addDays(todayStr(), 150),
      installments: [{ label: 'I1', amount: 500, dueOffsetDays: 0 }, { label: 'I2', amount: 500, dueOffsetDays: 30 }],
    }), 201)._id;
    ids.batch = okRes(await admin.post('/api/admin/batches').send({ name: 'Morning', course: ids.course }), 201)._id;
    ids.student = okRes(await admin.post('/api/admin/students').send({ name: 'Ravi', parentEmail: 'Parent@T.co', parentName: 'Mr Kumar', course: ids.course, batch: ids.batch }), 201)._id;
    okRes(await admin.post('/api/admin/fees/generate').send({ studentId: ids.student, totalFee: 1000, installmentCount: 2, startDate: addDays(todayStr(), -10) }));
    ids.other = okRes(await admin.post('/api/admin/students').send({ name: 'Stranger', parentEmail: 'someone@else.co', course: ids.course, batch: ids.batch }), 201)._id;
  });
  afterAll(stopDb);

  it('admin creates the parent login, a second call reports it exists', async () => {
    const r = okRes(await admin.post(`/api/admin/students/${ids.student}/parent-login`), 201);
    expect(r).toMatchObject({ created: true, email: 'parent@t.co', children: 1 });
    ids.pw = r.temporaryPassword;
    const again = okRes(await admin.post(`/api/admin/students/${ids.student}/parent-login`));
    expect(again.created).toBe(false);
  });

  it('refuses a parent login for a student without a parent email', async () => {
    const s = okRes(await admin.post('/api/admin/students').send({ name: 'NoMail', course: ids.course, batch: ids.batch }), 201);
    expect((await admin.post(`/api/admin/students/${s._id}/parent-login`)).status).toBe(400);
  });

  it('parent must change the temporary password, then sees only their own child', async () => {
    parent = request.agent(app);
    const login = okRes(await parent.post('/api/auth/login').send({ email: 'parent@t.co', password: ids.pw }));
    expect(login.user.role).toBe('PARENT');
    expect((await parent.get('/api/parent/children')).body.code).toBe('PASSWORD_CHANGE_REQUIRED');
    okRes(await parent.post('/api/auth/change-password').send({ currentPassword: ids.pw, newPassword: 'NewPass123' }));

    const { children } = okRes(await parent.get('/api/parent/children'));
    expect(children).toHaveLength(1);
    const c = children[0];
    expect(c.name).toBe('Ravi');
    expect(c.window.status).toBe('RUNNING');
    expect(c.window.daysRemaining).toBe(150);
    expect(c.window.progress).toBeGreaterThan(10);
    expect(c.fees.totalFee).toBe(1000);
    expect(c.fees.totalDue).toBe(1000);

    expect((await parent.get(`/api/parent/children/${ids.other}/attendance`)).status).toBe(404);
    expect((await parent.get(`/api/parent/children/${ids.other}/fees`)).status).toBe(404);
  });

  it('shows attendance and fees after the admin records them', async () => {
    const date = lastWeekday();
    okRes(await admin.post(`/api/attendance/batch/${ids.batch}`).send({ date, markAllPresent: true, entries: [] }));
    const att = okRes(await parent.get(`/api/parent/children/${ids.student}/attendance?month=${date.slice(0, 7)}`));
    expect(att.records.some((r) => r.date === date && r.status === 'PRESENT')).toBe(true);
    expect(att.overall.percentage).toBe(100);

    const fees = okRes(await parent.get(`/api/parent/children/${ids.student}/fees`));
    expect(fees.installments).toHaveLength(2);
    const first = fees.installments[0];
    okRes(await admin.post(`/api/admin/fees/${first.id}/payments`).send({ amount: 200, mode: 'CASH', paidOn: todayStr() }), 201);
    const after = okRes(await parent.get(`/api/parent/children/${ids.student}/fees`));
    expect(after.totalPaid).toBe(200);
    expect(after.totalDue).toBe(800);
    expect(after.payments).toHaveLength(1);
  });

  it('parents cannot reach admin or staff routes, and staff cannot reach parent routes', async () => {
    expect((await parent.get('/api/admin/students')).status).toBe(403);
    expect((await parent.get('/api/staff/dashboard')).status).toBe(403);
    expect((await admin.get('/api/parent/children')).status).toBe(403);
  });
});
