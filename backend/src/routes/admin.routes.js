import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/core.js';
import { adminOnly } from '../middleware/auth.js';
import { reminderTriggerLimiter } from '../middleware/rateLimit.js';
import { idParams, pagingQuery, objectId } from '../validators/common.js';
import * as people from '../controllers/admin.people.controller.js';
import * as acad from '../controllers/admin.academics.controller.js';
import * as dash from '../controllers/admin.dashboard.controller.js';
import * as att from '../controllers/attendance.controller.js';
import * as fees from '../controllers/fees.controller.js';
import * as rem from '../controllers/reminders.controller.js';

const r = Router();
r.use(adminOnly);

const id = validate({ params: idParams });
const q = validate({ query: pagingQuery });

r.get('/system/status', dash.systemStatus);
r.get('/dashboard', dash.dashboard);

// staff
r.get('/staff', q, people.listStaff);
r.post('/staff', validate({ body: people.staffSchemas.create }), people.createStaff);
r.get('/staff/:id', id, people.getStaff);
r.patch('/staff/:id', id, validate({ body: people.staffSchemas.update }), people.updateStaff);
r.delete('/staff/:id', id, people.deleteStaff);
r.patch('/staff/:id/status', id, validate({ body: people.staffSchemas.status }), people.setStaffStatus);
r.post('/staff/:id/reset-password', id, people.resetStaffPassword);

// students
r.get('/students', q, people.listStudents);
r.post('/students', validate({ body: people.studentSchemas.create }), people.createStudent);
r.post('/students/import', validate({ body: people.importSchema }), people.importStudents);
r.get('/students/:id', id, people.getStudent);
r.patch('/students/:id', id, validate({ body: people.studentSchemas.update }), people.updateStudent);
r.delete('/students/:id', id, people.deleteStudent);

// courses & batches
r.get('/courses', q, acad.listCourses);
r.post('/courses', validate({ body: acad.courseSchemas.create }), acad.createCourse);
r.patch('/courses/:id', id, validate({ body: acad.courseSchemas.update }), acad.updateCourse);
r.delete('/courses/:id', id, acad.deleteCourse);
r.get('/batches', q, acad.listBatches);
r.post('/batches', validate({ body: acad.batchSchemas.create }), acad.createBatch);
r.patch('/batches/:id', id, validate({ body: acad.batchSchemas.update }), acad.updateBatch);
r.delete('/batches/:id', id, acad.deleteBatch);
r.post('/batches/:id/assign-staff', id, validate({ body: acad.batchSchemas.assignStaff }), acad.assignStaff);
r.post('/batches/:id/assign-students', id, validate({ body: acad.batchSchemas.assignStudents }), acad.assignStudents);

// holidays, settings, audit
r.get('/holidays', q, acad.listHolidays);
r.post('/holidays', validate({ body: acad.holidaySchemas.create }), acad.createHoliday);
r.delete('/holidays/:id', id, acad.deleteHoliday);
r.get('/settings', acad.getSettingsHandler);
r.patch('/settings', validate({ body: acad.settingsSchema }), acad.updateSettings);
r.get('/audit-logs', q, acad.listAudit);

// attendance oversight, leaves, reports
r.get('/attendance/staff', q, att.listStaffAttendance);
r.patch('/attendance/staff/:id', id, validate({ body: att.schemas.staffEdit }), att.editStaffAttendance);
r.get('/leaves', q, att.listLeaves);
r.patch('/leaves/:id', id, validate({ body: att.schemas.leaveReview }), att.reviewLeave);
r.get('/reports/attendance', validate({ query: att.schemas.report }), att.attendanceReport);
r.get('/reports/low-attendance', validate({ query: att.schemas.low }), att.lowAttendance);

// fees & payments (dashboard must be registered before /:id)
r.get('/fee-structures', q, fees.listStructures);
r.post('/fee-structures', validate({ body: fees.schemas.structure }), fees.createStructure);
r.post('/fees/generate', validate({ body: fees.schemas.generate }), fees.generate);
r.get('/fees/dashboard', fees.dashboard);
r.get('/fees', q, fees.listFees);
r.get('/fees/:id', id, fees.getFee);
r.post('/fees/:id/payments', id, validate({ body: fees.schemas.payment }), fees.addPayment);
r.get('/payments', q, fees.listPayments);
r.get('/payments/:id/receipt', id, fees.receipt);

// reminders
r.get('/reminders/settings', rem.getSettings);
r.patch('/reminders/settings', validate({ body: rem.settingsSchema }), rem.updateSettings);
r.post('/reminders/send/:studentFeeId', reminderTriggerLimiter, validate({ params: z.object({ studentFeeId: objectId }) }), rem.sendOne);
r.post('/reminders/send-overdue', reminderTriggerLimiter, rem.sendOverdue);
r.post('/reminders/run', reminderTriggerLimiter, rem.runNow);
r.get('/reminders/logs', q, rem.listLogs);

export default r;
