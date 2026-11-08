import { StudentFee } from '../../models/Fees.js';
import User from '../../models/User.js';
import { ReminderLog } from '../../models/System.js';
import config from '../../config/env.js';
import logger from '../../config/logger.js';
import { todayStr, addDays, formatDisplayDate } from '../../utils/dates.js';
import { inr, round2 } from '../../utils/money.js';
import { getReminderSettings } from '../settings.service.js';
import { acquireLock, releaseLock } from '../jobLock.service.js';
import { markOverdueFees } from '../fee.service.js';
import { emailService } from '../email/email.service.js';
import { buildMessage, brandedHtml, htmlToText } from '../email/templates.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { matchReminderRule } from './rules.js';
import { defaultChannel } from './channels.js';

const LOCK_NAME = 'daily-fee-reminders';

function recipientsFor(student, settings) {
  const set = new Set();
  if (student.email) set.add(student.email.toLowerCase());
  if (settings.sendToParent && student.parentEmail) set.add(student.parentEmail.toLowerCase());
  return [...set];
}

function varsFor(fee, student) {
  const course = fee.course?.name || fee.course?.code || '';
  return {
    student_name: student.name,
    parent_name: student.parentName || 'Parent / Guardian',
    amount_due: inr(round2(fee.amountDue - fee.amountPaid)),
    due_date: formatDisplayDate(fee.dueDate),
    course,
    institute_name: config.instituteName,
    payment_instructions: config.paymentInstructions,
  };
}

/**
 * Sends one reminder. The ReminderLog row is inserted first as a claim: the unique
 * (studentFee, rule, dateKey) index means a second attempt, even from another instance, is dropped.
 */
export async function sendReminder(fee, { rule, template, dateKey, settings, channel = defaultChannel() }) {
  const student = fee.student;
  try {
    await ReminderLog.create({ studentFee: fee._id, student: student._id, rule, dateKey, channel: channel.name, status: 'PENDING' });
  } catch (err) {
    if (err.code === 11000) return { status: 'DUPLICATE' };
    throw err;
  }
  const filter = { studentFee: fee._id, rule, dateKey };
  const to = recipientsFor(student, settings);
  if (!to.length) {
    await ReminderLog.updateOne(filter, { status: 'SKIPPED', error: 'No recipient email on file' });
    return { status: 'SKIPPED', reason: 'no-recipient' };
  }
  if (!channel.isConfigured()) {
    await ReminderLog.deleteOne(filter); // not a real attempt: allow a later run today
    return { status: 'SKIPPED', reason: 'channel-not-configured' };
  }
  try {
    const msg = buildMessage(settings.templates[template], varsFor(fee, student));
    const res = await channel.send({ to, ...msg });
    await ReminderLog.updateOne(filter, { status: 'SENT', provider: res.provider, sentAt: new Date(), recipients: to, error: undefined });
    return { status: 'SENT', provider: res.provider };
  } catch (err) {
    await ReminderLog.updateOne(filter, { status: 'FAILED', error: String(err.message).slice(0, 500), recipients: to });
    return { status: 'FAILED', error: err.message };
  }
}

async function overdueHistory(feeIds) {
  const rows = await ReminderLog.aggregate([
    { $match: { studentFee: { $in: feeIds }, status: 'SENT', rule: /^OVERDUE_/ } },
    { $group: { _id: '$studentFee', count: { $sum: 1 }, lastDate: { $max: '$dateKey' } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), { count: r.count, lastDate: r.lastDate }]));
}

async function adminSummary(summary, today) {
  if (!emailService.isConfigured()) return;
  const admins = await User.find({ role: 'ADMIN', isActive: true }).select('email').lean();
  if (!admins.length) return;
  const open = await StudentFee.aggregate([{ $match: { status: { $ne: 'PAID' } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$amountDue', '$amountPaid'] } } } }]);
  const inner = `<p>Daily fee reminder run for <strong>${escapeHtml(today)}</strong>.</p>
    <ul><li>Sent: <strong>${summary.sent}</strong></li><li>Failed: <strong>${summary.failed}</strong></li><li>Skipped: <strong>${summary.skipped}</strong></li>
    <li>Newly overdue: <strong>${summary.newlyOverdue}</strong></li><li>Total pending amount: <strong>${escapeHtml(inr(open[0]?.total || 0))}</strong></li></ul>`;
  await emailService.send({
    to: admins.map((a) => a.email),
    subject: `${config.instituteName}: reminder summary ${today} (${summary.sent} sent, ${summary.failed} failed)`,
    html: brandedHtml(inner), text: htmlToText(inner),
  }).catch((err) => logger.warn({ err: err.message }, 'Admin summary email failed'));
}

/** The daily job. Safe to call twice and from several instances. */
export async function runDailyReminders({ force = false, today = todayStr(), channel = defaultChannel(), sendSummary = true } = {}) {
  if (!(await acquireLock(LOCK_NAME))) return { ran: false, reason: 'Another instance is running this job' };
  try {
    const settings = await getReminderSettings();
    if (!settings.enabled && !force) return { ran: false, reason: 'Reminders are disabled in settings' };

    const newlyOverdue = await markOverdueFees(today);
    const horizon = addDays(today, Math.max(0, ...(settings.daysBefore || [0])));
    const fees = await StudentFee.find({ status: { $ne: 'PAID' }, dueDate: { $lte: horizon } })
      .populate({ path: 'student', select: 'name email parentName parentEmail status' })
      .populate({ path: 'course', select: 'name code' });
    const history = await overdueHistory(fees.map((f) => f._id));

    const summary = { ran: true, date: today, considered: fees.length, sent: 0, failed: 0, skipped: 0, duplicates: 0, newlyOverdue };
    for (const fee of fees) {
      if (!fee.student || fee.student.status !== 'ACTIVE') continue;
      const match = matchReminderRule(fee, today, settings, history.get(String(fee._id)));
      if (!match) continue;
      const r = await sendReminder(fee, { ...match, dateKey: today, settings, channel });
      if (r.status === 'SENT') summary.sent += 1;
      else if (r.status === 'FAILED') summary.failed += 1;
      else if (r.status === 'DUPLICATE') summary.duplicates += 1;
      else summary.skipped += 1;
    }
    if (sendSummary && (summary.sent || summary.failed)) await adminSummary(summary, today);
    logger.info(summary, 'Reminder run finished');
    return summary;
  } finally {
    await releaseLock(LOCK_NAME).catch(() => {});
  }
}

// "Send now" for a single fee. Always allowed; each manual send gets its own dateKey.
export async function sendNow(feeId, { channel = defaultChannel() } = {}) {
  const settings = await getReminderSettings();
  const fee = await StudentFee.findById(feeId).populate('student', 'name email parentName parentEmail status').populate('course', 'name code');
  if (!fee) return { status: 'NOT_FOUND' };
  if (fee.status === 'PAID') return { status: 'SKIPPED', reason: 'already-paid' };
  const overdue = fee.dueDate < todayStr();
  return sendReminder(fee, { rule: 'MANUAL', template: overdue ? 'overdue' : fee.dueDate === todayStr() ? 'dueToday' : 'beforeDue', dateKey: `${todayStr()}T${Date.now()}`, settings, channel });
}

export async function sendOverdueNow({ channel = defaultChannel() } = {}) {
  const today = todayStr();
  await markOverdueFees(today);
  const settings = await getReminderSettings();
  const fees = await StudentFee.find({ status: 'OVERDUE' }).populate('student', 'name email parentName parentEmail status').populate('course', 'name code');
  const out = { total: fees.length, sent: 0, failed: 0, skipped: 0 };
  for (const fee of fees) {
    if (!fee.student || fee.student.status !== 'ACTIVE') { out.skipped += 1; continue; }
    // One bulk send per fee per day: repeated clicks are ignored by the unique index
    const r = await sendReminder(fee, { rule: 'BULK_OVERDUE', template: 'overdue', dateKey: today, settings, channel });
    if (r.status === 'SENT') out.sent += 1; else if (r.status === 'FAILED') out.failed += 1; else out.skipped += 1;
  }
  return out;
}
