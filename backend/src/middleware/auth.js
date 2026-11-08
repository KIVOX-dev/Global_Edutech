import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/http.js';
import { verifyAccessToken, ACCESS_COOKIE } from '../services/token.service.js';
import User from '../models/User.js';

// Verifies the access cookie (or Bearer header) and loads the live user so deactivation is immediate
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.[ACCESS_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) throw ApiError.unauthorized();
  const payload = verifyAccessToken(token);
  if (!payload) throw ApiError.unauthorized('Session expired');
  const user = await User.findById(payload.sub).select('name email role isActive mustChangePassword');
  if (!user || !user.isActive) throw ApiError.unauthorized('Account is disabled');
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

export const adminOnly = [authenticate, authorize('ADMIN')];
export const staffOnly = [authenticate, authorize('STAFF')];

// Blocks everything except password change while a temporary password is in use
export function enforcePasswordChange(req, res, next) {
  if (req.user?.mustChangePassword) {
    return next(new ApiError(403, 'PASSWORD_CHANGE_REQUIRED', 'You must change your temporary password first'));
  }
  next();
}

// Ownership: a staff member may only touch resources whose owner id matches their own user id
export const requireSelfOrAdmin = (getOwnerId) => (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();
  if (String(getOwnerId(req)) !== String(req.user._id)) return next(ApiError.forbidden());
  next();
};
