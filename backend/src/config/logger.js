import pino from 'pino';
import { createRequire } from 'node:module';
import config from './env.js';

// pretty output only when the dev dependency is installed (it is absent from the AppSail bundle)
const hasPretty = (() => { try { createRequire(import.meta.url).resolve('pino-pretty'); return true; } catch { return false; } })();

const logger = pino({
  level: config.isTest ? 'silent' : config.isProd ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]',
      '*.password', '*.passwordHash', '*.token', '*.refreshToken', '*.accessToken', '*.newPassword', '*.currentPassword',
      'password', 'token',
    ],
    censor: '[redacted]',
  },
  ...(config.isProd || config.isTest || !hasPretty ? {} : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }),
});

export default logger;
