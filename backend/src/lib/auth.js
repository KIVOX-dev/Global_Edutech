import * as jose from 'jose';
import { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, isProd } from './config.js';

const COOKIE = 'admin-token';
const MAX_AGE = 24 * 60 * 60; // seconds
const secretKey = () => new TextEncoder().encode(JWT_SECRET);

export async function generateToken() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return new jose.SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey());
    return payload;
  } catch {
    return null;
  }
}

export function validateCredentials(username, password) {
  return !!ADMIN_USERNAME && !!ADMIN_PASSWORD && username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

// Express middleware: 401 unless a valid admin cookie is present
export async function requireAdmin(req, res, next) {
  const token = readCookie(req, COOKIE);
  if (!token || !(await verifyToken(token))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

const cookieOptions = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' };

export function setAuthCookie(res, token) {
  res.cookie(COOKIE, token, { ...cookieOptions, maxAge: MAX_AGE * 1000 });
}

export function clearAuthCookie(res) {
  res.cookie(COOKIE, '', { ...cookieOptions, maxAge: 0 });
}
