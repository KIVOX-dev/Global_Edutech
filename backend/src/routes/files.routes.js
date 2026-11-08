import { Router } from 'express';
import * as c from '../controllers/files.controller.js';
import { validate } from '../middleware/core.js';
import { authenticate, enforcePasswordChange } from '../middleware/auth.js';

const r = Router();
r.use(authenticate, enforcePasswordChange);
r.post('/upload-url', validate({ body: c.schemas.upload }), c.uploadUrl);
r.post('/confirm', validate({ body: c.schemas.confirm }), c.confirm);
r.get('/download-url', validate({ query: c.schemas.key }), c.downloadUrl);
r.delete('/', c.remove);

export default r;
