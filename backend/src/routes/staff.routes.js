import { Router } from 'express';
import { validate } from '../middleware/core.js';
import { staffOnly, enforcePasswordChange } from '../middleware/auth.js';
import { idParams, pagingQuery } from '../validators/common.js';
import * as c from '../controllers/staff.controller.js';

const r = Router();
r.use(staffOnly, enforcePasswordChange);

r.get('/dashboard', c.dashboard);
r.get('/batches', c.myBatches);
r.get('/batches/:id/students', validate({ params: idParams }), c.batchStudents);
r.get('/profile', c.getProfile);
r.patch('/profile', validate({ body: c.schemas.profile }), c.updateProfile);
r.get('/attendance/me', validate({ query: c.schemas.month }), c.myAttendance);
r.post('/leaves', validate({ body: c.schemas.leave }), c.createLeave);
r.get('/leaves', validate({ query: pagingQuery }), c.myLeaves);
r.get('/fees', validate({ query: pagingQuery }), c.fees);

export default r;
