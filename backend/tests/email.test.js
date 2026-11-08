import { describe, it, expect, vi } from 'vitest';
import { EmailService } from '../src/services/email/email.service.js';

const provider = (name, impl, cap = 100) => ({ name, dailyCap: cap, isConfigured: () => true, send: vi.fn(impl) });
const silent = { info() {}, warn() {} };
const msg = { to: 'a@b.co', subject: 's', html: '<p>x</p>', text: 'x' };

describe('EmailService fallback', () => {
  it('uses Brevo when it works', async () => {
    const brevo = provider('BREVO', async () => ({ messageId: '1' }));
    const gmail = provider('GMAIL', async () => ({ messageId: '2' }));
    const svc = new EmailService({ providers: [brevo, gmail], delayMs: 0, retryDelayMs: 0, log: silent });
    expect(await svc.send(msg)).toMatchObject({ provider: 'BREVO', fallbackUsed: false });
    expect(gmail.send).not.toHaveBeenCalled();
  });

  it('retries Brevo once, then falls back to Gmail', async () => {
    const brevo = provider('BREVO', async () => { throw new Error('Brevo 401: Key not found'); });
    const gmail = provider('GMAIL', async () => ({ messageId: 'g1' }));
    const svc = new EmailService({ providers: [brevo, gmail], delayMs: 0, retryDelayMs: 0, log: silent });
    const res = await svc.send(msg);
    expect(res).toMatchObject({ provider: 'GMAIL', fallbackUsed: true });
    expect(brevo.send).toHaveBeenCalledTimes(2);
    expect(gmail.send).toHaveBeenCalledTimes(1);
    expect(res.errors[0]).toMatch(/BREVO/);
  });

  it('falls back when Brevo hits its daily cap', async () => {
    const brevo = provider('BREVO', async () => ({ messageId: '1' }), 1);
    const gmail = provider('GMAIL', async () => ({ messageId: '2' }));
    const svc = new EmailService({ providers: [brevo, gmail], delayMs: 0, log: silent });
    await svc.send(msg);
    expect((await svc.send(msg)).provider).toBe('GMAIL');
  });

  it('rejects when every provider fails and when none is configured', async () => {
    const bad = (n) => provider(n, async () => { throw new Error('down'); });
    const svc = new EmailService({ providers: [bad('BREVO'), bad('GMAIL')], delayMs: 0, retryDelayMs: 0, log: silent });
    await expect(svc.send(msg)).rejects.toMatchObject({ code: 'EMAIL_FAILED' });
    const none = new EmailService({ providers: [{ ...bad('BREVO'), isConfigured: () => false }], delayMs: 0, log: silent });
    await expect(none.send(msg)).rejects.toMatchObject({ code: 'EMAIL_NOT_CONFIGURED' });
  });
});
