import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app, startDb, stopDb, resetDb, makeUser } from './helpers.js';
import { emailService } from '../src/services/email/email.service.js';
import User from '../src/models/User.js';

beforeAll(startDb);
afterAll(stopDb);

const flush = () => new Promise((r) => setTimeout(r, 50));

describe('forgot / reset password', () => {
  let send;
  beforeEach(async () => {
    await resetDb();
    await makeUser('ADMIN', 'owner@t.co', { name: 'Kavi Arasan' });
    send = vi.spyOn(emailService, 'send').mockResolvedValue({ provider: 'BREVO' });
  });

  it('emails a branded reset link, and the link resets the password once', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'owner@t.co' });
    expect(res.status).toBe(200);
    await flush();
    expect(send).toHaveBeenCalledTimes(1);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe('owner@t.co');
    expect(mail.subject).toMatch(/Reset your .* password/);
    expect(mail.html).toMatch(/logo-banner\.png/);
    expect(mail.html).toMatch(/Reset password/);
    expect(mail.html).toMatch(/60 minutes/);
    expect(mail.html).toMatch(/Hello Kavi,/);
    expect(mail.text).toMatch(/reset-password\?token=/);

    const link = new URL(mail.text.match(/https?:\/\/\S+reset-password\?\S+/)[0]);
    const token = link.searchParams.get('token');
    const body = { email: link.searchParams.get('email'), token, newPassword: 'Brand-new-9' };
    expect((await request(app).post('/api/auth/reset-password').send(body)).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: 'owner@t.co', password: 'Brand-new-9' })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: 'owner@t.co', password: 'Passw0rd!x' })).status).toBe(401);
    // the token cannot be used a second time
    expect((await request(app).post('/api/auth/reset-password').send(body)).status).toBe(400);
  });

  it('answers the same for unknown emails and sends nothing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@t.co' });
    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/If that email exists/);
    await flush();
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects expired and wrong tokens', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'owner@t.co' });
    await flush();
    const token = new URL(send.mock.calls[0][0].text.match(/https?:\/\/\S+reset-password\?\S+/)[0]).searchParams.get('token');
    expect((await request(app).post('/api/auth/reset-password').send({ email: 'owner@t.co', token: 'x'.repeat(64), newPassword: 'Another-9x' })).status).toBe(400);
    await User.updateOne({ email: 'owner@t.co' }, { $set: { 'resetTokens.$[].expires': new Date(Date.now() - 1000) } });
    expect((await request(app).post('/api/auth/reset-password').send({ email: 'owner@t.co', token, newPassword: 'Another-9x' })).status).toBe(400);
  });

  it('an older reset email keeps working after another one is requested, and one use retires them all', async () => {
    const tokenOf = (i) => new URL(send.mock.calls[i][0].text.match(/https?:\/\/\S+reset-password\?\S+/)[0]).searchParams.get('token');
    await request(app).post('/api/auth/forgot-password').send({ email: 'owner@t.co' });
    await flush();
    await request(app).post('/api/auth/forgot-password').send({ email: 'owner@t.co' });
    await flush();
    expect(send).toHaveBeenCalledTimes(2);
    const [first, second] = [tokenOf(0), tokenOf(1)];
    expect(first).not.toBe(second);
    // the FIRST email still works
    expect((await request(app).post('/api/auth/reset-password').send({ email: 'owner@t.co', token: first, newPassword: 'Older-link-9' })).status).toBe(200);
    // and using it retires the other link too
    const again = await request(app).post('/api/auth/reset-password').send({ email: 'owner@t.co', token: second, newPassword: 'Newer-link-9' });
    expect(again.status).toBe(400);
    expect(again.body.message).toMatch(/newest email/);
  });

  it('does not break the request when email sending fails', async () => {
    send.mockRejectedValue(new Error('Brevo down'));
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'owner@t.co' });
    expect(res.status).toBe(200);
  });
});
