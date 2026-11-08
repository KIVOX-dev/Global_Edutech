import { Router } from 'express';
import { validate } from '../middleware/core.js';
import { enquiryLimiter } from '../middleware/rateLimit.js';
import * as c from '../controllers/enquiries.controller.js';

const r = Router();
r.post('/submit-form', enquiryLimiter, validate({ body: c.schemas.submit }), c.submit);
export default r;
