import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { validate } from '../middleware/core.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, authLimiter, forgotLimiter } from '../middleware/rateLimit.js';

const r = Router();
r.post('/login', loginLimiter, validate({ body: c.schemas.login }), c.login);
r.post('/refresh', authLimiter, c.refresh);
r.post('/logout', c.logout);
r.get('/me', authenticate, c.me);
r.post('/change-password', authLimiter, authenticate, validate({ body: c.schemas.change }), c.changePassword);
r.post('/forgot-password', forgotLimiter, validate({ body: c.schemas.forgot }), c.forgotPassword);
r.post('/reset-password', authLimiter, validate({ body: c.schemas.reset }), c.resetPassword);

export default r;
