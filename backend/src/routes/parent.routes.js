import { Router } from 'express';
import { validate } from '../middleware/core.js';
import { parentOnly, enforcePasswordChange } from '../middleware/auth.js';
import { idParams } from '../validators/common.js';
import * as c from '../controllers/parent.controller.js';

const r = Router();
r.use(parentOnly, enforcePasswordChange);

r.get('/children', c.children);
r.get('/children/:id/attendance', validate({ params: idParams, query: c.schemas.month }), c.attendance);
r.get('/children/:id/course', validate({ params: idParams }), c.course);
r.get('/children/:id/fees', validate({ params: idParams }), c.fees);

export default r;
