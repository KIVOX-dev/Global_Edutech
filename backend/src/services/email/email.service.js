import config from '../../config/env.js';
import logger from '../../config/logger.js';
import { todayStr } from '../../utils/dates.js';
import { BrevoProvider, GmailProvider } from './providers.js';

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });

export class EmailNotConfiguredError extends Error {
  constructor() { super('No email provider is configured'); this.code = 'EMAIL_NOT_CONFIGURED'; }
}

/**
 * Tries providers in order (Brevo first). The primary gets one retry, then the next provider is used.
 * Sends are serialised through an in-process queue with a delay between messages and a per-provider daily cap.
 */
export class EmailService {
  constructor({ providers, delayMs = 1200, retryDelayMs = 800, log = logger } = {}) {
    this.providers = providers;
    this.delayMs = delayMs;
    this.retryDelayMs = retryDelayMs;
    this.log = log;
    this.queue = [];
    this.running = false;
    this.counts = { day: todayStr(), byProvider: {} };
  }

  isConfigured() { return this.providers.some((p) => p.isConfigured()); }

  status() { return Object.fromEntries(this.providers.map((p) => [p.name.toLowerCase(), p.isConfigured()])); }

  #used(p) {
    const today = todayStr();
    if (this.counts.day !== today) this.counts = { day: today, byProvider: {} };
    return this.counts.byProvider[p.name] || 0;
  }

  #bump(p) { this.counts.byProvider[p.name] = this.#used(p) + 1; }

  send(message) {
    if (!this.isConfigured()) return Promise.reject(new EmailNotConfiguredError());
    return new Promise((resolve, reject) => {
      this.queue.push({ message, resolve, reject });
      this.#drain();
    });
  }

  async #drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const job = this.queue.shift();
      try {
        job.resolve(await this.#deliver(job.message));
      } catch (err) {
        job.reject(err);
      }
      if (this.queue.length && this.delayMs) await sleep(this.delayMs);
    }
    this.running = false;
  }

  async #deliver(message) {
    const errors = [];
    const candidates = this.providers.filter((p) => p.isConfigured());
    for (let i = 0; i < candidates.length; i += 1) {
      const provider = candidates[i];
      if (this.#used(provider) >= provider.dailyCap) {
        errors.push(`${provider.name}: daily cap reached`);
        continue;
      }
      const attempts = i === 0 ? 2 : 1;
      for (let a = 1; a <= attempts; a += 1) {
        try {
          const res = await provider.send(message);
          this.#bump(provider);
          this.log.info({ provider: provider.name, attempt: a }, 'Email sent');
          return { provider: provider.name, messageId: res?.messageId, fallbackUsed: i > 0, errors };
        } catch (err) {
          errors.push(`${provider.name}: ${err.message}`);
          this.log.warn({ provider: provider.name, attempt: a, err: err.message }, 'Email provider failed');
          if (a < attempts) await sleep(this.retryDelayMs);
        }
      }
    }
    const e = new Error(`All email providers failed (${errors.join(' | ')})`);
    e.code = 'EMAIL_FAILED';
    e.errors = errors;
    throw e;
  }
}

export const emailService = new EmailService({
  providers: [new BrevoProvider(), new GmailProvider()],
  delayMs: config.isTest ? 0 : 1200,
  retryDelayMs: config.isTest ? 0 : 800,
});
export default emailService;
