import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { startDb, stopDb, resetDb, makeBatchWithStudents } from './helpers.js';
import { matchReminderRule } from '../src/services/reminders/rules.js';
import { runDailyReminders } from '../src/services/reminders/reminder.service.js';
import { StudentFee } from '../src/models/Fees.js';
import { ReminderLog } from '../src/models/System.js';
import Student from '../src/models/Student.js';
import { addDays, todayStr } from '../src/utils/dates.js';

const settings = { daysBefore: [7, 3, 1], onDueDate: true, overdueEveryDays: 3, overdueMaxCount: 5 };
const today = '2025-06-10';

describe('reminder rule matching (pure)', () => {
  const rule = (dueDate, overdue, status = 'PENDING') => matchReminderRule({ dueDate, status }, today, settings, overdue)?.rule ?? null;

  it('before due: D-7, D-3, D-1 only', () => {
    expect(rule('2025-06-17')).toBe('D-7');
    expect(rule('2025-06-13')).toBe('D-3');
    expect(rule('2025-06-11')).toBe('D-1');
    expect(rule('2025-06-15')).toBeNull();
  });
  it('due today', () => {
    expect(rule(today)).toBe('D0');
    expect(matchReminderRule({ dueDate: today, status: 'PENDING' }, today, { ...settings, onDueDate: false })).toBeNull();
  });
  it('overdue: first immediately, then every N days, up to the max', () => {
    expect(rule('2025-06-08', { count: 0 })).toBe('OVERDUE_1');
    expect(rule('2025-06-01', { count: 1, lastDate: '2025-06-08' })).toBeNull();
    expect(rule('2025-06-01', { count: 1, lastDate: '2025-06-07' })).toBe('OVERDUE_2');
    expect(rule('2025-06-01', { count: 5, lastDate: '2025-05-01' })).toBeNull();
  });
  it('never reminds for PAID fees', () => {
    expect(rule('2025-06-13', undefined, 'PAID')).toBeNull();
  });
});

describe('daily reminder job', () => {
  beforeAll(startDb);
  afterAll(stopDb);
  let channel;
  beforeEach(async () => {
    await resetDb();
    channel = { name: 'EMAIL', isConfigured: () => true, send: vi.fn(async () => ({ provider: 'BREVO' })) };
    const { course, students } = await makeBatchWithStudents(null, 2);
    await Student.updateMany({}, { email: 's@t.co', parentEmail: 'p@t.co', parentName: 'Parent' });
    await StudentFee.create({ student: students[0]._id, course: course._id, installmentLabel: 'I1', amountDue: 1000, dueDate: addDays(todayStr(), 3) });
    await StudentFee.create({ student: students[1]._id, course: course._id, installmentLabel: 'I1', amountDue: 1000, dueDate: addDays(todayStr(), 30) });
  });

  it('sends once per matching fee and never twice, even if the job runs twice', async () => {
    const first = await runDailyReminders({ channel, sendSummary: false });
    expect(first).toMatchObject({ ran: true, sent: 1 });
    const second = await runDailyReminders({ channel, sendSummary: false });
    expect(second.sent).toBe(0);
    expect(channel.send).toHaveBeenCalledTimes(1);
    const logs = await ReminderLog.find();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ rule: 'D-3', status: 'SENT', provider: 'BREVO' });
    expect([...channel.send.mock.calls[0][0].to].sort()).toEqual(['p@t.co', 's@t.co']);
  });

  it('two concurrent runs still send a single email (lock + unique index)', async () => {
    await Promise.all([runDailyReminders({ channel, sendSummary: false }), runDailyReminders({ channel, sendSummary: false })]);
    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  it('marks past-due fees OVERDUE and skips PAID fees', async () => {
    const fee = await StudentFee.findOne({ dueDate: addDays(todayStr(), 3) });
    await StudentFee.updateOne({ _id: fee._id }, { status: 'PAID', amountPaid: 1000 });
    await StudentFee.updateOne({ dueDate: addDays(todayStr(), 30) }, { dueDate: addDays(todayStr(), -2) });
    const r = await runDailyReminders({ channel, sendSummary: false });
    expect(r.newlyOverdue).toBe(1);
    expect(r.sent).toBe(1);
    expect((await ReminderLog.findOne()).rule).toBe('OVERDUE_1');
  });
});
