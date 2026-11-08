import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import config from '../config/env.js';
import logger from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/http.js';
import { email, password } from '../validators/common.js';
import {
  signAccessToken, signRefreshToken, verifyRefreshToken, setAuthCookies, clearAuthCookies, sha256, randomToken, REFRESH_COOKIE,
} from '../services/token.service.js';
import { verifyGoogleIdToken } from '../services/google.service.js';
import { emailService } from '../services/email/email.service.js';
import { passwordResetMessage } from '../services/email/templates.js';
import { audit } from '../services/audit.service.js';

export const BCRYPT_COST = 12;
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const MAX_SESSIONS = 5;

export const schemas = {
  login: z.object({ email, password: z.string().min(1).max(128) }),
  change: z.object({ currentPassword: z.string().min(1).max(128), newPassword: password }),
  forgot: z.object({ email }),
  google: z.object({ credential: z.string().min(100).max(4096) }),
  reset: z.object({ email, token: z.string().min(20).max(200), newPassword: password }),
};

export const hashPassword = (p) => bcrypt.hash(p, BCRYPT_COST);
const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, role: u.role, mustChangePassword: u.mustChangePassword, avatarKey: u.avatarKey,
});

// Issues a new access/refresh pair and stores the refresh jti (rotation)
async function startSession(res, user, replaceJti) {
  const refresh = signRefreshToken(user);
  const now = new Date();
  await User.updateOne({ _id: user._id }, { $pull: { sessions: replaceJti ? { jti: replaceJti } : { expiresAt: { $lt: now } } } });
  await User.updateOne({ _id: user._id }, { $push: { sessions: { $each: [{ jti: refresh.jti, expiresAt: refresh.expiresAt }], $slice: -MAX_SESSIONS } } });
  setAuthCookies(res, signAccessToken(user), refresh.token);
}

export const login = asyncHandler(async (req, res) => {
  const { email: addr, password: pw } = req.body;
  const user = await User.findOne({ email: addr }).select('+passwordHash +failedLogins +lockUntil');
  const invalid = ApiError.unauthorized('Invalid email or password');

  if (user?.lockUntil && user.lockUntil > new Date()) {
    throw new ApiError(423, 'ACCOUNT_LOCKED', 'Account temporarily locked after repeated failed logins. Try again later.');
  }
  // Compare against a dummy hash when the user is unknown to keep timing similar
  const hash = user?.passwordHash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const match = await bcrypt.compare(pw, hash);
  if (!user || !match || !user.isActive) {
    if (user) {
      const fails = (user.failedLogins || 0) + 1;
      const update = fails >= MAX_FAILS ? { failedLogins: 0, lockUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: fails };
      await User.updateOne({ _id: user._id }, update);
    }
    throw invalid;
  }
  await User.updateOne({ _id: user._id }, { failedLogins: 0, $unset: { lockUntil: 1 }, lastLoginAt: new Date() });
  await startSession(res, user);
  req.user = user;
  await audit(req, { action: 'LOGIN', entity: 'User', entityId: user._id });
  ok(res, { user: publicUser(user) });
});

// Public: lets the login page know whether to show the Google button (the client id is not a secret)
export const authConfig = asyncHandler(async (req, res) => ok(res, { googleClientId: config.services.google ? config.google.clientId : null }));

/**
 * Sign in with Google. Only for accounts an admin already created: the verified Google email must match an
 * active user. Nothing is ever created here, and a Google account that is not registered gets a clear refusal.
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const g = await verifyGoogleIdToken(req.body.credential);
  if (!g.email || !g.emailVerified) throw ApiError.unauthorized('Your Google email is not verified');
  const user = await User.findOne({ email: g.email, isActive: true });
  if (!user) throw new ApiError(403, 'GOOGLE_NOT_REGISTERED', 'This Google account is not registered here. Ask the administrator to add your email first.');
  if (user.googleSub && user.googleSub !== g.sub) throw new ApiError(403, 'GOOGLE_MISMATCH', 'This account is linked to a different Google account.');
  // A verified Google identity replaces the temporary-password step
  await User.updateOne({ _id: user._id }, { googleSub: g.sub, lastLoginAt: new Date(), failedLogins: 0, mustChangePassword: false, $unset: { lockUntil: 1 } });
  user.mustChangePassword = false;
  await startSession(res, user);
  req.user = user;
  await audit(req, { action: 'LOGIN_GOOGLE', entity: 'User', entityId: user._id });
  ok(res, { user: publicUser(user) });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const payload = token && verifyRefreshToken(token);
  if (!payload) { clearAuthCookies(res); throw ApiError.unauthorized('Session expired'); }
  const user = await User.findById(payload.sub).select('+sessions name email role isActive mustChangePassword avatarKey');
  if (!user || !user.isActive) { clearAuthCookies(res); throw ApiError.unauthorized(); }
  const known = user.sessions.some((s) => s.jti === payload.jti);
  if (!known) {
    // A rotated-out token was presented again: treat as theft and revoke every session
    await User.updateOne({ _id: user._id }, { $set: { sessions: [] } });
    clearAuthCookies(res);
    logger.warn({ userId: String(user._id) }, 'Refresh token reuse detected; sessions revoked');
    throw ApiError.unauthorized('Session expired');
  }
  await startSession(res, user, payload.jti);
  ok(res, { user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const payload = req.cookies?.[REFRESH_COOKIE] && verifyRefreshToken(req.cookies[REFRESH_COOKIE]);
  if (payload) await User.updateOne({ _id: payload.sub }, { $pull: { sessions: { jti: payload.jti } } });
  clearAuthCookies(res);
  ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => ok(res, { user: publicUser(req.user) }));

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  if (req.body.currentPassword === req.body.newPassword) throw ApiError.badRequest('Choose a different password');
  user.passwordHash = await hashPassword(req.body.newPassword);
  user.mustChangePassword = false;
  user.sessions = [];
  await user.save();
  await startSession(res, user);
  await audit(req, { action: 'CHANGE_PASSWORD', entity: 'User', entityId: user._id });
  ok(res, { changed: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const generic = { message: 'If that email exists, a reset link has been sent.' };
  const user = await User.findOne({ email: req.body.email, isActive: true });
  if (user) {
    const token = randomToken();
    await User.updateOne({ _id: user._id }, { resetTokenHash: sha256(token), resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) });
    const link = `${config.appUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    emailService.send({ to: user.email, ...passwordResetMessage({ name: user.name, link, minutes: 60 }) })
      .catch((err) => logger.warn({ err: err.message }, 'Password reset email not sent'));
  }
  ok(res, generic);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email: addr, token, newPassword } = req.body;
  const user = await User.findOne({ email: addr, resetTokenHash: sha256(token), resetTokenExpires: { $gt: new Date() } }).select('+resetTokenHash +resetTokenExpires');
  if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.sessions = [];
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.failedLogins = 0;
  user.lockUntil = undefined;
  await user.save();
  req.user = user;
  await audit(req, { action: 'RESET_PASSWORD', entity: 'User', entityId: user._id });
  ok(res, { reset: true });
});
