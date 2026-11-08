// npm run seed  : creates 1 admin (from env), 3 staff, 2 courses, 2 batches, 20 students,
// a week of sample attendance and sample fees (paid, partial, pending, overdue). Safe to run again.
import mongoose from 'mongoose';
import config from '../src/config/env.js';
import { connectDb } from '../src/config/db.js';
import User from '../src/models/User.js';
import StaffProfile from '../src/models/StaffProfile.js';
import Student from '../src/models/Student.js';
import { Course, Batch } from '../src/models/Course.js';
import { StudentAttendance, StaffAttendance } from '../src/models/Attendance.js';
import { StudentFee } from '../src/models/Fees.js';
import { hashPassword } from '../src/controllers/auth.controller.js';
import { getSettings, getReminderSettings } from '../src/services/settings.service.js';
import { generateFees, recordPayment, markOverdueFees } from '../src/services/fee.service.js';
import { todayStr, addDays } from '../src/utils/dates.js';
import { isPlaceholder } from '../src/config/env.js';

const STAFF_PASSWORD = 'Staff@12345';

async function main() {
  if (!config.services.mongodb) throw new Error('Set a real MONGODB_URI in backend/.env before seeding');
  if (config.isProd && (isPlaceholder(config.seed.password) || isPlaceholder(config.seed.email))) {
    throw new Error('Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to real values before seeding production');
  }
  await connectDb();
  const adminEmail = (config.seed.email || 'admin@example.com').toLowerCase();
  const adminPassword = config.seed.password || 'changeme_strong_password';

  // --- admin
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ name: 'Administrator', email: adminEmail, role: 'ADMIN', passwordHash: await hashPassword(adminPassword), mustChangePassword: false });
    console.log(`+ admin created: ${adminEmail}`);
  } else console.log(`= admin exists: ${adminEmail}`);

  await getSettings();
  await getReminderSettings();

  // npm run seed:admin creates only the admin account and default settings (no sample students, staff or fees)
  if (process.argv.includes('--admin-only')) {
    console.log('Admin-only seed complete.');
    console.log(`Admin login : ${adminEmail}`);
    return;
  }

  // --- staff
  const staffDefs = [
    { name: 'Priya Sharma', email: 'priya.staff@example.com', designation: 'Senior Teacher', employeeId: 'EMP-001' },
    { name: 'Rahul Verma', email: 'rahul.staff@example.com', designation: 'Maths Teacher', employeeId: 'EMP-002' },
    { name: 'Anita Rao', email: 'anita.staff@example.com', designation: 'Coordinator', employeeId: 'EMP-003' },
  ];
  const staff = [];
  for (const d of staffDefs) {
    let u = await User.findOne({ email: d.email });
    if (!u) {
      u = await User.create({ name: d.name, email: d.email, role: 'STAFF', phone: '9876543210', passwordHash: await hashPassword(STAFF_PASSWORD) });
      await StaffProfile.create({ user: u._id, employeeId: d.employeeId, designation: d.designation, joinDate: addDays(todayStr(), -200), shiftStart: '09:00', shiftEnd: '17:00' });
      console.log(`+ staff: ${d.email}`);
    }
    staff.push(u);
  }

  // --- courses
  const courseDefs = [
    { name: 'Abacus & Vedic Maths', code: 'ABV', durationMonths: 6, totalFee: 18000, installments: [{ label: 'Instalment 1', amount: 6000, dueOffsetDays: 0 }, { label: 'Instalment 2', amount: 6000, dueOffsetDays: 30 }, { label: 'Instalment 3', amount: 6000, dueOffsetDays: 60 }] },
    { name: 'Spoken English', code: 'ENG', durationMonths: 4, totalFee: 12000, installments: [{ label: 'Instalment 1', amount: 6000, dueOffsetDays: 0 }, { label: 'Instalment 2', amount: 6000, dueOffsetDays: 45 }] },
  ];
  const courses = [];
  for (const c of courseDefs) courses.push(await Course.findOneAndUpdate({ code: c.code }, { $setOnInsert: c }, { upsert: true, returnDocument: 'after' }));

  // --- batches
  const batchDefs = [
    { name: 'ABV Morning', course: courses[0]._id, timings: '9:00 - 10:30', staff: [staff[0]._id, staff[2]._id] },
    { name: 'ENG Evening', course: courses[1]._id, timings: '17:00 - 18:30', staff: [staff[1]._id] },
  ];
  const batches = [];
  for (const b of batchDefs) {
    batches.push(await Batch.findOneAndUpdate({ name: b.name }, { $setOnInsert: { ...b, startDate: addDays(todayStr(), -60) } }, { upsert: true, returnDocument: 'after' }));
  }

  // --- students
  const first = ['Aarav', 'Diya', 'Vihaan', 'Ananya', 'Kabir', 'Ira', 'Reyansh', 'Myra', 'Arjun', 'Saanvi', 'Ishaan', 'Kiara', 'Advait', 'Navya', 'Rohan', 'Tara', 'Vivaan', 'Meera', 'Dev', 'Zoya'];
  const students = [];
  for (let i = 0; i < 20; i += 1) {
    const idx = i % 2;
    const adm = `SEED${String(i + 1).padStart(3, '0')}`;
    let s = await Student.findOne({ admissionNo: adm });
    if (!s) {
      s = await Student.create({
        admissionNo: adm, name: `${first[i]} Kumar`, phone: `90000000${String(i).padStart(2, '0')}`,
        email: `student${i + 1}@example.com`, parentName: `Parent of ${first[i]}`, parentEmail: `parent${i + 1}@example.com`, parentPhone: `91000000${String(i).padStart(2, '0')}`,
        course: courses[idx]._id, batch: batches[idx]._id,
      });
      await Batch.updateOne({ _id: batches[idx]._id }, { $addToSet: { students: s._id } });
    }
    students.push(s);
  }
  console.log(`+ ${students.length} students ready`);

  // --- a week of attendance (working days only), deterministic pseudo-random statuses
  const settings = await getSettings();
  const pick = (n) => ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT', 'PRESENT', 'EXCUSED'][n % 8];
  let attOps = [];
  for (let d = 7; d >= 1; d -= 1) {
    const date = addDays(todayStr(), -d);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    if (!settings.workingDays.includes(dow)) continue;
    students.forEach((s, i) => {
      const batch = batches[i % 2];
      attOps.push({ updateOne: { filter: { student: s._id, batch: batch._id, date }, update: { $setOnInsert: { status: pick(i * 3 + d), markedBy: staff[i % 2]._id, markedAt: new Date() } }, upsert: true } });
    });
    staff.forEach((u, i) => {
      attOps.push({ updateOne: { filter: { staff: u._id, date }, update: { $setOnInsert: { status: i === 2 && d % 3 === 0 ? 'LATE' : 'PRESENT', checkIn: new Date(`${date}T03:30:00Z`), checkOut: new Date(`${date}T11:30:00Z`), totalMinutes: 480 } }, upsert: true } });
    });
  }
  if (attOps.length) {
    await StudentAttendance.bulkWrite(attOps.filter((o) => o.updateOne.filter.student), { ordered: false });
    await StaffAttendance.bulkWrite(attOps.filter((o) => o.updateOne.filter.staff), { ordered: false });
  }
  console.log('+ sample attendance for the last 7 days');

  // --- fees: schedule starts 40 days ago so some instalments are paid, partial, overdue and upcoming
  const req = { user: admin, ip: 'seed' };
  const start = addDays(todayStr(), -40);
  for (const s of students) await generateFees(req, { studentId: String(s._id), startDate: start });
  await markOverdueFees();
  for (const [i, s] of students.entries()) {
    const first = await StudentFee.findOne({ student: s._id, installmentLabel: 'Instalment 1' });
    if (!first || first.amountPaid > 0) continue;
    if (i % 4 === 0) await recordPayment(req, first._id, { amount: first.amountDue, mode: 'UPI', reference: `SEED-UPI-${i}` });
    else if (i % 4 === 1) await recordPayment(req, first._id, { amount: first.amountDue / 2, mode: 'CASH' });
    // i % 4 === 2 or 3: left unpaid -> overdue
  }
  console.log('+ sample fees and payments');

  console.log('\nSeed complete.');
  console.log(`Admin login : ${adminEmail}  /  ${config.seed.password ? '(your ADMIN_SEED_PASSWORD)' : adminPassword}`);
  console.log(`Staff login : priya.staff@example.com  /  ${STAFF_PASSWORD}`);
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
