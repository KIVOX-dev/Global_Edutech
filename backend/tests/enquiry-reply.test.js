import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app, startDb, stopDb, resetDb, makeUser, loginAs } from './helpers.js';
import { emailService } from '../src/services/email/email.service.js';
import Enquiry from '../src/models/Enquiry.js';

beforeAll(startDb);
afterAll(stopDb);

describe('sending an enquiry reply through Brevo', () => {
  let admin;
  let enquiry;
  let send;
  beforeEach(async () => {
    await resetDb();
    await makeUser('ADMIN', 'admin@t.co');
    admin = await loginAs('admin@t.co');
    enquiry = await Enquiry.create({ name: 'Kavi Arasan', email: 'kavi@t.co', phone: '9876543210', message: 'Handwriting for my child' });
    vi.spyOn(emailService, 'isConfigured').mockReturnValue(true);
    send = vi.spyOn(emailService, 'send').mockResolvedValue({ provider: 'BREVO', messageId: 'm1' });
  });

  it('emails only the enquirer, wraps the text in the branded layout and marks the enquiry Contacted', async () => {
    const res = await admin.post(`/api/admin/enquiries/${enquiry._id}/send-reply`).send({ subject: 'About your enquiry', body: 'Hi Kavi,\n\nThanks <b>so</b> much.\n\nBest,\nGlobal Edutech team' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ sent: true, to: 'kavi@t.co', status: 'CONTACTED' });
    expect(send).toHaveBeenCalledTimes(1);
    const mail = send.mock.calls[0][0];
    expect(mail.to).toBe('kavi@t.co');
    expect(mail.subject).toBe('About your enquiry');
    expect(mail.html).toMatch(/logo-banner\.png/);
    expect(mail.html).toMatch(/&lt;b&gt;so&lt;\/b&gt;/); // admin text is escaped, never injected as HTML
    expect(mail.text).toMatch(/Hi Kavi/);
    const saved = await Enquiry.findById(enquiry._id);
    expect(saved.status).toBe('CONTACTED');
    expect(saved.repliedAt).toBeTruthy();
  });

  it('requires an admin, a valid body, and a configured email service', async () => {
    expect((await request(app).post(`/api/admin/enquiries/${enquiry._id}/send-reply`).send({ subject: 's', body: 'long enough body' })).status).toBe(401);
    expect((await admin.post(`/api/admin/enquiries/${enquiry._id}/send-reply`).send({ subject: '', body: 'long enough body' })).status).toBe(400);
    expect((await admin.post(`/api/admin/enquiries/${enquiry._id}/send-reply`).send({ subject: 'Hi', body: 'x' })).status).toBe(400);
    emailService.isConfigured.mockReturnValue(false);
    const res = await admin.post(`/api/admin/enquiries/${enquiry._id}/send-reply`).send({ subject: 'Hi', body: 'long enough body' });
    expect(res.status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });

  it('reports a clean error when Brevo fails and leaves the enquiry untouched', async () => {
    send.mockRejectedValue(new Error('Brevo 401'));
    const res = await admin.post(`/api/admin/enquiries/${enquiry._id}/send-reply`).send({ subject: 'Hi', body: 'long enough body' });
    expect(res.status).toBe(502);
    expect(res.body.code).toBe('EMAIL_FAILED');
    const saved = await Enquiry.findById(enquiry._id);
    expect(saved.status).toBe('NEW');
    expect(saved.repliedAt).toBeUndefined();
  });
});
