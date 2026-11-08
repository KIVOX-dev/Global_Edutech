import User from '../models/User.js';
import Student from '../models/Student.js';
import { Course, Batch } from '../models/Course.js';
import { StudentAttendance, StaffAttendance, LeaveRequest } from '../models/Attendance.js';
import { AuditLog } from '../models/System.js';
import Enquiry from '../models/Enquiry.js';
import config from '../config/env.js';
import { dbReady } from '../config/db.js';
import { asyncHandler, ok } from '../utils/http.js';
import { todayStr, addDays } from '../utils/dates.js';
import { summarizeStudents, loadCalendar } from '../services/attendance.service.js';
import { feeDashboard } from '../services/fee.service.js';
import { emailService } from '../services/email/email.service.js';

export const dashboard = asyncHandler(async (req, res) => {
  const today = todayStr();
  const from = addDays(today, -29);
  const [students, staff, courses, batches, todayAtt, staffToday, pendingLeaves, fees, low, recent, cal, newEnquiries] = await Promise.all([
    Student.countDocuments({ status: 'ACTIVE' }),
    User.countDocuments({ role: 'STAFF', isActive: true }),
    Course.countDocuments(),
    Batch.countDocuments({ isActive: true }),
    StudentAttendance.aggregate([{ $match: { date: today } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    StaffAttendance.countDocuments({ date: today, status: { $in: ['PRESENT', 'LATE', 'HALF_DAY'] } }),
    LeaveRequest.countDocuments({ status: 'PENDING' }),
    feeDashboard(today),
    summarizeStudents({ from, to: today }),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).select('actorName action entity entityId createdAt').lean(),
    loadCalendar(today, today),
    Enquiry.countDocuments({ status: 'NEW' }),
  ]);
  const by = Object.fromEntries(todayAtt.map((a) => [a._id, a.n]));
  const counted = (by.PRESENT || 0) + (by.LATE || 0) + (by.ABSENT || 0);
  ok(res, {
    counts: { students, staff, courses, batches, pendingLeaves, newEnquiries },
    today: {
      date: today,
      isWorkingDay: cal.isWorkingDay(today),
      studentAttendancePercent: counted ? Math.round((((by.PRESENT || 0) + (by.LATE || 0)) / counted) * 1000) / 10 : null,
      studentsMarked: Object.values(by).reduce((a, b) => a + b, 0),
      staffPresent: staffToday,
    },
    lowAttendance: { threshold: low.threshold, from, to: today, students: low.low.slice(0, 10).map((r) => ({ id: r.student._id, name: r.student.name, admissionNo: r.student.admissionNo, batch: r.student.batch?.name, percentage: r.percentage })) },
    fees,
    recentActivity: recent,
  });
});

export const systemStatus = asyncHandler(async (req, res) => {
  ok(res, {
    environment: config.env,
    timezone: config.timezone,
    integrations: {
      mongodb: config.services.mongodb && dbReady(),
      b2: config.services.b2,
      brevo: config.services.brevo,
      email: emailService.isConfigured(),
      jwtSecrets: config.services.jwt,
    },
    placeholderMode: config.notConfigured.length > 0,
    notConfigured: config.notConfigured.map((n) => n.split(' ')[0]),
  });
});
