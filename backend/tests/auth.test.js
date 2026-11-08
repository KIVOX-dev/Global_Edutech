import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app, startDb, stopDb, resetDb, makeUser, loginAs } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await resetDb();
  await makeUser('ADMIN', 'admin@t.co');
  await makeUser('STAFF', 'staff@t.co');
});

describe('role protection', () => {
  it('rejects anonymous requests with 401 in the standard error format', async () => {
    const res = await request(app).get('/api/admin/students');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
  });

  it('blocks STAFF from every admin route (403) but lets ADMIN in', async () => {
    const staff = await loginAs('staff@t.co');
    for (const url of ['/api/admin/students', '/api/admin/dashboard', '/api/admin/fees', '/api/admin/reminders/logs', '/api/admin/system/status']) {
      expect((await staff.get(url)).status).toBe(403);
    }
    expect((await staff.post('/api/admin/reminders/run')).status).toBe(403);
    const admin = await loginAs('admin@t.co');
    const ok = await admin.get('/api/admin/students');
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ success: true, meta: { page: 1 } });
  });

  it('blocks ADMIN from staff-only routes', async () => {
    const admin = await loginAs('admin@t.co');
    expect((await admin.get('/api/staff/dashboard')).status).toBe(403);
  });

  it('system status reports integrations without leaking values', async () => {
    const admin = await loginAs('admin@t.co');
    const res = await admin.get('/api/admin/system/status');
    expect(res.body.data.integrations).toMatchObject({ b2: false, brevo: false, gmail: false });
    expect(JSON.stringify(res.body)).not.toMatch(/test-access-secret|your_/);
  });

  it('rejects NoSQL operator injection in login', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  it('rotates refresh tokens and revokes everything when an old one is reused', async () => {
    const first = await request(app).post('/api/auth/login').send({ email: 'staff@t.co', password: 'Passw0rd!x' });
    const oldCookies = first.headers['set-cookie'];
    const refreshed = await request(app).post('/api/auth/refresh').set('Cookie', oldCookies);
    expect(refreshed.status).toBe(200);
    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', oldCookies);
    expect(reuse.status).toBe(401);
    const newOne = await request(app).post('/api/auth/refresh').set('Cookie', refreshed.headers['set-cookie']);
    expect(newOne.status).toBe(401); // family revoked
  });

  it('locks the account after repeated failures', async () => {
    for (let i = 0; i < 5; i += 1) await request(app).post('/api/auth/login').send({ email: 'staff@t.co', password: 'wrong-pass' });
    const res = await request(app).post('/api/auth/login').send({ email: 'staff@t.co', password: 'Passw0rd!x' });
    expect(res.status).toBe(423);
  });
});
