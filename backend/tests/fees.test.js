import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startDb, stopDb, resetDb, makeUser, loginAs, makeBatchWithStudents } from './helpers.js';
import { computeFeeStatus } from '../src/services/fee.service.js';
import { StudentFee } from '../src/models/Fees.js';
import { addDays, todayStr } from '../src/utils/dates.js';

beforeAll(startDb);
afterAll(stopDb);

describe('fee status (pure)', () => {
  const today = '2025-06-10';
  it('PENDING, PARTIAL, PAID and OVERDUE', () => {
    expect(computeFeeStatus({ amountDue: 1000, amountPaid: 0, dueDate: '2025-06-20' }, today)).toBe('PENDING');
    expect(computeFeeStatus({ amountDue: 1000, amountPaid: 400, dueDate: '2025-06-20' }, today)).toBe('PARTIAL');
    expect(computeFeeStatus({ amountDue: 1000, amountPaid: 1000, dueDate: '2025-06-01' }, today)).toBe('PAID');
    expect(computeFeeStatus({ amountDue: 1000, amountPaid: 400, dueDate: '2025-06-01' }, today)).toBe('OVERDUE');
    expect(computeFeeStatus({ amountDue: 1000, amountPaid: 0, dueDate: '2025-06-09' }, today)).toBe('OVERDUE');
  });
});

describe('payments API', () => {
  let fee;
  let admin;
  beforeEach(async () => {
    await resetDb();
    await makeUser('ADMIN', 'admin@t.co');
    const { course, students } = await makeBatchWithStudents(null, 1);
    fee = await StudentFee.create({ student: students[0]._id, course: course._id, installmentLabel: 'I1', amountDue: 1000, dueDate: addDays(todayStr(), 10) });
    admin = await loginAs('admin@t.co');
  });

  it('partial payment -> PARTIAL, completing it -> PAID, overpayment rejected', async () => {
    const p1 = await admin.post(`/api/admin/fees/${fee._id}/payments`).send({ amount: 400, mode: 'CASH' });
    expect(p1.status).toBe(201);
    expect(p1.body.data.fee).toMatchObject({ amountPaid: 400, status: 'PARTIAL' });

    const over = await admin.post(`/api/admin/fees/${fee._id}/payments`).send({ amount: 700, mode: 'UPI' });
    expect(over.status).toBe(400);

    const p2 = await admin.post(`/api/admin/fees/${fee._id}/payments`).send({ amount: 600, mode: 'UPI', reference: 'UTR1' });
    expect(p2.body.data.fee).toMatchObject({ amountPaid: 1000, status: 'PAID' });

    const done = await admin.post(`/api/admin/fees/${fee._id}/payments`).send({ amount: 1, mode: 'CASH' });
    expect(done.status).toBe(409);
  });

  it('concurrent payments can never exceed the amount due', async () => {
    const results = await Promise.all([1, 2, 3].map(() => admin.post(`/api/admin/fees/${fee._id}/payments`).send({ amount: 600, mode: 'CASH' })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    const after = await StudentFee.findById(fee._id);
    expect(after.amountPaid).toBe(600);
  });

  it('a partly paid fee past its due date shows OVERDUE', async () => {
    await StudentFee.updateOne({ _id: fee._id }, { dueDate: addDays(todayStr(), -3) });
    const p = await admin.post(`/api/admin/fees/${fee._id}/payments`).send({ amount: 100, mode: 'CASH' });
    expect(p.body.data.fee.status).toBe('OVERDUE');
  });
});
