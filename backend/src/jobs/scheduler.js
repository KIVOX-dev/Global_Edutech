import cron from 'node-cron';
import config from '../config/env.js';
import logger from '../config/logger.js';
import { getReminderSettings } from '../services/settings.service.js';
import { runDailyReminders } from '../services/reminders/reminder.service.js';
import { emailService } from '../services/email/email.service.js';

let task = null;

const toCron = (hhmm) => {
  const [h, m] = (/^\d{1,2}:\d{2}$/.test(hhmm) ? hhmm : config.reminderTime).split(':').map(Number);
  return `${m} ${h} * * *`;
};

export function stopScheduler() {
  if (task) { task.stop(); task = null; }
}

// (Re)schedules the daily reminder job at the configured Asia/Kolkata time
export async function startScheduler() {
  stopScheduler();
  if (!config.services.mongodb) { logger.warn('Scheduler disabled: MongoDB not configured'); return false; }
  if (!emailService.isConfigured()) { logger.warn('Reminder cron will run but no email provider is configured: sends are skipped'); }
  const settings = await getReminderSettings();
  const expr = toCron(settings.sendTime);
  task = cron.schedule(expr, () => {
    runDailyReminders().catch((err) => logger.error({ err: err.message }, 'Daily reminder job crashed'));
  }, { timezone: config.timezone });
  logger.info({ cron: expr, timezone: config.timezone }, 'Reminder scheduler started');
  return true;
}

export const rescheduleReminders = startScheduler;
