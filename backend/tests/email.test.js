import { describe, it, expect, vi } from 'vitest';
import { EmailService } from '../src/services/email/email.service.js';

const provider = (name, impl, cap = 100) => ({ name, dailyCap: cap, isConfigured: () => true, send: vi.fn(impl) });
const silent = { info() {}, warn() {} };
const msg = { to: 'a@b.co', subject: 's', html: '<p>x</p>', text: 'x' };
const svc = (providers) => new EmailService({ providers, delayMs: 0, retryDelayMs: 0, log: silent });

describe('EmailService (Brevo)', () => {
  it('sends through Brevo', async () => {
    const brevo = provider('BREVO', async () => ({ messageId: '1' }));
    expect(await svc([brevo]).send(msg)).toMatchObject({ provider: 'BREVO', fallbackUsed: false });
  });

  it('retries once when the first attempt fails', async () => {
    let n = 0;
    const brevo = provider('BREVO', async () => { n += 1; if (n === 1) throw new Error('Brevo 500'); return { messageId: '2' }; });
    const res = await svc([brevo]).send(msg);
    expect(res.provider).toBe('BREVO');
    expect(brevo.send).toHaveBeenCalledTimes(2);
  });

  it('rejects with EMAIL_FAILED after the retry also fails', async () => {
    const brevo = provider('BREVO', async () => { throw new Error('Brevo 401: Key not found'); });
    await expect(svc([brevo]).send(msg)).rejects.toMatchObject({ code: 'EMAIL_FAILED' });
    expect(brevo.send).toHaveBeenCalledTimes(2);
  });

  it('stops at the daily cap', async () => {
    const brevo = provider('BREVO', async () => ({ messageId: '1' }), 1);
    const s = svc([brevo]);
    await s.send(msg);
    await expect(s.send(msg)).rejects.toMatchObject({ code: 'EMAIL_FAILED' });
  });

  it('rejects when nothing is configured', async () => {
    const none = provider('BREVO', async () => ({}));
    none.isConfigured = () => false;
    await expect(svc([none]).send(msg)).rejects.toMatchObject({ code: 'EMAIL_NOT_CONFIGURED' });
  });
});
