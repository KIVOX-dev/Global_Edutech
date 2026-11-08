import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/createApp.js';
import User from '../src/models/User.js';
import StaffProfile from '../src/models/StaffProfile.js';
import Student from '../src/models/Student.js';
import { Course, Batch } from '../src/models/Course.js';
import { hashPassword } from '../src/controllers/auth.controller.js';
import { addDays, todayStr, dayOfWeek } from '../src/utils/dates.js';

let mongod;
export const app = createApp();

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'ge_test' });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}
export async function stopDb() {
  await mongoose.disconnect();
  await mongod?.stop();
}
export async function resetDb() {
  await Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})));
}

export async function makeUser(role, email, extra = {}) {
  const user = await User.create({ name: `${role} ${email}`, email, role, passwordHash: await hashPassword('Passw0rd!x'), ...extra });
  if (role === 'STAFF') await StaffProfile.create({ user: user._id, employeeId: `E-${email}`, shiftStart: '09:00', shiftEnd: '17:00' });
  return user;
}

// Returns a supertest agent that carries the auth cookies
export async function loginAs(email, password = 'Passw0rd!x') {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

// Most recent Mon-Fri strictly before today (always a default working day, never in the future)
export function lastWeekday() {
  let d = addDays(todayStr(), -1);
  while (![1, 2, 3, 4, 5].includes(dayOfWeek(d))) d = addDays(d, -1);
  return d;
}

export async function makeBatchWithStudents(staff, n = 3) {
  const course = await Course.create({ name: 'Course', code: `C${Math.random().toString(36).slice(2, 6)}`, installments: [{ label: 'I1', amount: 1000, dueOffsetDays: 0 }] });
  const batch = await Batch.create({ name: 'Batch A', course: course._id, staff: staff ? [staff._id] : [] });
  const students = [];
  for (let i = 0; i < n; i += 1) {
    students.push(await Student.create({ admissionNo: `A${Date.now()}${i}`, name: `Student ${i}`, course: course._id, batch: batch._id }));
  }
  await Batch.updateOne({ _id: batch._id }, { students: students.map((s) => s._id) });
  return { course, batch, students };
}
