import { emailService } from '../email/email.service.js';

/**
 * Pluggable delivery channel. To add WhatsApp or SMS, implement { name, isConfigured(), send(msg) }
 * (msg = { to: string[], subject, html, text, phones: string[] }) and register it below.
 */
export class EmailChannel {
  constructor(service = emailService) { this.name = 'EMAIL'; this.service = service; }
  isConfigured() { return this.service.isConfigured(); }
  async send({ to, subject, html, text }) {
    const res = await this.service.send({ to, subject, html, text });
    return { provider: res.provider };
  }
}

export const channels = { EMAIL: new EmailChannel() };
export const defaultChannel = () => channels.EMAIL;
