import { Router } from 'express';
import { validate, requireDb } from '../middleware/core.js';
import { enquiryLimiter, chatLimiter } from '../middleware/rateLimit.js';
import * as ai from '../controllers/ai.controller.js';
import * as c from '../controllers/enquiries.controller.js';

const r = Router();
r.post('/submit-form', enquiryLimiter, requireDb, validate({ body: c.schemas.submit }), c.submit);
// Website assistant (rate limited per visitor; answers even when Groq is unavailable)
r.post('/chat', chatLimiter, validate({ body: ai.schemas.chat }), ai.chat);

export default r;
