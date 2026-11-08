import crypto from 'node:crypto';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeValue } from '../utils/sanitize.js';
import { dbReady } from '../config/db.js';
import logger from '../config/logger.js';
import config from '../config/env.js';

export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

// NoSQL injection guard: removes "$" / "." keys from body, query and params
export function sanitizeInput(req, res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) {
    const clean = sanitizeValue({ ...req.query });
    for (const k of Object.keys(req.query)) delete req.query[k];
    Object.assign(req.query, clean);
  }
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

// Database-backed routes answer 503 instead of hanging when MongoDB is not connected
export function requireDb(req, res, next) {
  if (!dbReady()) return next(ApiError.unavailable('Database is not configured or not connected'));
  next();
}

// validate({ body, query, params }) with zod schemas; parsed values replace the raw ones
export const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) {
      const parsed = schemas.query.parse(req.query);
      for (const k of Object.keys(req.query)) delete req.query[k];
      Object.assign(req.query, parsed);
    }
    if (schemas.params) req.params = schemas.params.parse(req.params);
    next();
  } catch (err) {
    next(err);
  }
};

export function notFoundApi(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details;

  if (err instanceof ApiError) {
    ({ status, code, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err?.name === 'CastError') {
    status = 400; code = 'INVALID_ID'; message = `Invalid ${err.path || 'id'}`;
  } else if (err?.name === 'ValidationError' && err.errors) {
    status = 400; code = 'VALIDATION_ERROR'; message = 'Invalid input';
    details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
  } else if (err?.code === 11000) {
    status = 409; code = 'DUPLICATE'; message = `Duplicate value for ${Object.keys(err.keyPattern || {}).join(', ') || 'unique field'}`;
  } else if (err?.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request body too large';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON body';
  } else if (err?.message === 'CORS_NOT_ALLOWED') {
    status = 403; code = 'CORS_NOT_ALLOWED'; message = 'Origin not allowed';
    logger.warn({ origin: req.headers.origin, allowed: config.allowedOrigins }, 'Request blocked by CORS: set APP_URL (or ALLOWED_ORIGINS) to this origin');
  }

  if (status === 500) logger.error({ err, reqId: req.id, path: req.path }, 'Unhandled error');
  const body = { success: false, code, message };
  if (details !== undefined) body.details = details;
  if (status === 500 && !config.isProd) body.details = { stack: String(err?.stack || '').split('\n').slice(0, 4) };
  res.status(status).json(body);
}
