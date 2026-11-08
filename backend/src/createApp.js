import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import config from './config/env.js';
import logger from './config/logger.js';
import { dbReady } from './config/db.js';
import { requestId, sanitizeInput, requireDb, errorHandler, notFoundApi } from './middleware/core.js';
import { apiLimiter } from './middleware/rateLimit.js';
import publicRoutes from './routes/public.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import staffRoutes from './routes/staff.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import filesRoutes from './routes/files.routes.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // AppSail / Vercel sit behind a proxy

  const b2Origin = config.b2.endpoint && /^https?:/.test(config.b2.endpoint) ? new URL(config.b2.endpoint).origin : null;
  const b2Wildcard = b2Origin ? [b2Origin, 'https://*.backblazeb2.com'] : ['https://*.backblazeb2.com'];

  app.use(requestId);
  if (!config.isTest) app.use(pinoHttp({ logger, genReqId: (req) => req.id, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://maps.googleapis.com'], // Next static export uses inline bootstrap scripts
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", ...b2Wildcard], // browser uploads go straight to B2 with presigned URLs
        frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: config.isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: (origin, cb) => (!origin || config.allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('CORS_NOT_ALLOWED'))),
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(sanitizeInput);

  app.get('/api/health', (req, res) => res.json({
    success: true, status: 'ok',
    data: { status: 'ok', uptime: Math.round(process.uptime()), db: dbReady(), time: new Date().toISOString() },
  }));

  app.use('/api', apiLimiter);

  // Landing-page enquiry form endpoint
  app.use('/api', publicRoutes); // the enquiry route checks the database itself; the chatbot works without one

  // Institute management API
  app.use('/api/auth', requireDb, authRoutes);
  app.use('/api/admin', requireDb, adminRoutes);
  app.use('/api/staff', requireDb, staffRoutes);
  app.use('/api/attendance', requireDb, attendanceRoutes);
  app.use('/api/files', requireDb, filesRoutes);
  app.use('/api', notFoundApi);

  // Built frontend (next export) served by the same service
  const staticDir = config.staticDir ? path.resolve(config.staticDir) : path.resolve(here, '../public');
  if (fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { redirect: false, index: 'index.html', maxAge: config.isProd ? '1h' : 0 }));
    app.get('*', (req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      const clean = path.normalize(decodeURIComponent(req.path)).replace(/^([/\\])+/, '');
      const candidates = [`${clean}.html`, path.join(clean, 'index.html')];
      for (const c of candidates) {
        const file = path.join(staticDir, c);
        if (file.startsWith(staticDir) && fs.existsSync(file) && fs.statSync(file).isFile()) return res.sendFile(file);
      }
      return res.sendFile(path.join(staticDir, 'index.html')); // client-side routes
    });
  }

  app.use(errorHandler);
  return app;
}

export default createApp;
