import config from '../../config/env.js';

// Provider interface: { name, dailyCap, isConfigured(), send({ to, subject, html, text, replyTo }) -> { messageId } }
const toArray = (to) => (Array.isArray(to) ? to : [to]).filter(Boolean);

export class BrevoProvider {
  constructor(cfg = config.brevo, configured = config.services.brevo) {
    this.name = 'BREVO';
    this.dailyCap = 280; // Brevo free plan is about 300/day; keep a margin
    this.cfg = cfg;
    this.configured = configured;
  }

  isConfigured() { return this.configured; }

  async send({ to, subject, html, text, replyTo }) {
    const body = {
      sender: { email: this.cfg.senderEmail, name: this.cfg.senderName },
      to: toArray(to).map((email) => ({ email })),
      subject,
      htmlContent: html,
      textContent: text,
    };
    if (replyTo) body.replyTo = { email: replyTo };
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.cfg.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Brevo ${res.status}: ${payload.message || res.statusText}`);
    return { messageId: payload.messageId };
  }
}
