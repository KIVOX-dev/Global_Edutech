import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
const ACCESS_TTL_S = 15 * 60;
const REFRESH_TTL_S = 7 * 24 * 60 * 60;

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, config.secrets.access, { expiresIn: ACCESS_TTL_S });

export function signRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: String(user._id), jti }, config.secrets.refresh, { expiresIn: REFRESH_TTL_S });
  return { token, jti, expiresAt: new Date(Date.now() + REFRESH_TTL_S * 1000) };
}

const verify = (token, secret) => { try { return jwt.verify(token, secret); } catch { return null; } };
export const verifyAccessToken = (t) => verify(t, config.secrets.access);
export const verifyRefreshToken = (t) => verify(t, config.secrets.refresh);

const base = () => ({ httpOnly: true, secure: config.isProd, sameSite: 'lax', domain: config.cookieDomain });

export function setAuthCookies(res, access, refresh) {
  res.cookie(ACCESS_COOKIE, access, { ...base(), path: '/', maxAge: ACCESS_TTL_S * 1000 });
  res.cookie(REFRESH_COOKIE, refresh, { ...base(), path: '/api/auth', maxAge: REFRESH_TTL_S * 1000 });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...base(), path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base(), path: '/api/auth' });
}

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = () => crypto.randomBytes(32).toString('hex');
