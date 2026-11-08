import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import config from '../config/env.js';

const handler = (message) => (req, res) => res.status(429).json({ success: false, code: 'RATE_LIMITED', message });

const make = (opts) => rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  ...opts,
});

export const apiLimiter = make({ windowMs: 15 * 60 * 1000, limit: 600, handler: handler('Too many requests, please slow down') });

// 5 failed attempts per 15 minutes per IP + email
export const loginLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}|${String(req.body?.email || '').toLowerCase()}`,
  handler: handler('Too many login attempts. Try again in 15 minutes.'),
});

export const authLimiter = make({ windowMs: 15 * 60 * 1000, limit: 30, handler: handler('Too many requests. Try again later.') });
export const forgotLimiter = make({ windowMs: 60 * 60 * 1000, limit: 5, handler: handler('Too many reset requests. Try again in an hour.') });
export const enquiryLimiter = make({ windowMs: 60 * 60 * 1000, limit: 10, handler: handler('Too many enquiries from this connection. Please call us instead.') });
export const chatLimiter = make({ windowMs: 10 * 60 * 1000, limit: 20, handler: handler('You are sending messages too fast. Please wait a few minutes or call us.') });
export const aiLimiter = make({ windowMs: 60 * 60 * 1000, limit: 60, handler: handler('AI request limit reached. Try again later.') });
export const replySendLimiter = make({ windowMs: 60 * 60 * 1000, limit: 40, handler: handler('Email sending limit reached for this hour. Try again later.') });
export const reminderTriggerLimiter = make({ windowMs: 60 * 60 * 1000, limit: 20, handler: handler('Reminder trigger limit reached. Try again later.') });
