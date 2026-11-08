import { diffDays } from '../../utils/dates.js';

/**
 * Decides which reminder (if any) applies to a fee today. Pure function.
 *   fee      { dueDate: 'YYYY-MM-DD', status }
 *   settings { daysBefore: [7,3,1], onDueDate, overdueEveryDays, overdueMaxCount }
 *   overdue  { count: overdue reminders already SENT, lastDate: dateKey of the last one }
 * Returns { rule, template } or null.
 */
export function matchReminderRule(fee, today, settings, overdue = { count: 0, lastDate: null }) {
  if (fee.status === 'PAID') return null;
  const diff = diffDays(fee.dueDate, today); // positive = due in the future

  if (diff > 0) {
    return (settings.daysBefore || []).includes(diff) ? { rule: `D-${diff}`, template: 'beforeDue' } : null;
  }
  if (diff === 0) return settings.onDueDate ? { rule: 'D0', template: 'dueToday' } : null;

  const max = settings.overdueMaxCount ?? 0;
  if (max <= 0 || overdue.count >= max) return null;
  if (overdue.count === 0) return { rule: 'OVERDUE_1', template: 'overdue' };
  const every = Math.max(settings.overdueEveryDays || 1, 1);
  if (overdue.lastDate && diffDays(today, overdue.lastDate) >= every) return { rule: `OVERDUE_${overdue.count + 1}`, template: 'overdue' };
  return null;
}
