import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/core.js';
import { authenticate, authorize, enforcePasswordChange } from '../middleware/auth.js';
import { objectId, idParams } from '../validators/common.js';
import * as c from '../controllers/attendance.controller.js';

const r = Router();
r.use(authenticate, authorize('ADMIN', 'STAFF'), enforcePasswordChange);

const batchParam = validate({ params: z.object({ batchId: objectId }) });
r.get('/batch/:batchId', batchParam, validate({ query: c.schemas.dateQuery }), c.roster);
r.post('/batch/:batchId', batchParam, validate({ body: c.schemas.mark }), c.mark);
r.patch('/:id', validate({ params: idParams, body: c.schemas.edit }), c.edit);
r.get('/student/:studentId', validate({ params: z.object({ studentId: objectId }), query: c.schemas.range }), c.studentHistory);

export default r;
