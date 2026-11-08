import { z } from 'zod';
import { ReminderLog } from '../models/System.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, paginate } from '../utils/http.js';
import { hhmm } from '../validators/common.js';
import { getReminderSettings } from '../services/settings.service.js';
import { audit } from '../services/audit.service.js';
import { runDailyReminders, sendNow, sendOverdueNow } from '../services/reminders/reminder.service.js';
import { rescheduleReminders } from '../jobs/scheduler.js';

const tpl = z.object({ subject: z.string().min(1).max(200), html: z.string().min(1).max(20000) });
export const settingsSchema = z.object({
  enabled: z.boolean(),
  daysBefore: z.array(z.number().int().min(1).max(60)).max(10),
  onDueDate: z.boolean(),
  overdueEveryDays: z.number().int().min(1).max(60),
  overdueMaxCount: z.number().int().min(0).max(50),
  sendTime: hhmm,
  sendToParent: z.boolean(),
  templates: z.object({ beforeDue: tpl, dueToday: tpl, overdue: tpl }).partial(),
}).partial();

export const getSettings = asyncHandler(async (req, res) => ok(res, await getReminderSettings()));

export const updateSettings = asyncHandler(async (req, res) => {
  const s = await getReminderSettings();
  const before = s.toObject();
  const { templates, ...rest } = req.body;
  s.set(rest);
  for (const [k, v] of Object.entries(templates || {})) s.templates[k] = v;
  await s.save();
  if (rest.sendTime) await rescheduleReminders();
  await audit(req, { action: 'UPDATE_REMINDER_SETTINGS', entity: 'ReminderSetting', entityId: s._id, before, after: s });
  ok(res, s);
});

export const sendOne = asyncHandler(async (req, res) => {
  const r = await sendNow(req.params.studentFeeId);
  if (r.status === 'NOT_FOUND') throw ApiError.notFound('Fee not found');
  if (r.status === 'SKIPPED' && r.reason === 'channel-not-configured') throw ApiError.unavailable('No email provider is configured (set BREVO_* or GMAIL_*)');
  await audit(req, { action: 'SEND_REMINDER', entity: 'StudentFee', entityId: req.params.studentFeeId, after: r });
  ok(res, r);
});

export const sendOverdue = asyncHandler(async (req, res) => {
  const r = await sendOverdueNow();
  await audit(req, { action: 'SEND_OVERDUE_REMINDERS', entity: 'StudentFee', after: r });
  ok(res, r);
});

export const runNow = asyncHandler(async (req, res) => {
  const r = await runDailyReminders({ force: req.query.force === 'true' });
  await audit(req, { action: 'RUN_REMINDER_JOB', entity: 'Reminder', after: r });
  ok(res, r);
});

export const listLogs = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.provider) f.provider = req.query.provider;
  if (req.query.from || req.query.to) f.dateKey = { ...(req.query.from && { $gte: req.query.from }), ...(req.query.to && { $lte: `${req.query.to}~` }) };
  await paginate(res, ReminderLog, f, req.query, {
    sort: { createdAt: -1 },
    populate: [{ path: 'student', select: 'name admissionNo' }, { path: 'studentFee', select: 'installmentLabel amountDue dueDate' }],
  });
});
