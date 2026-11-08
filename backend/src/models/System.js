import mongoose from 'mongoose';
import config from '../config/env.js';
import { DEFAULT_TEMPLATES } from '../services/reminders/defaults.js';

const { ObjectId } = mongoose.Schema.Types;

const tpl = (t) => ({ subject: { type: String, default: t.subject }, html: { type: String, default: t.html } });

const reminderSettingSchema = new mongoose.Schema({
  key: { type: String, default: 'singleton', unique: true },
  enabled: { type: Boolean, default: true },
  daysBefore: { type: [Number], default: [7, 3, 1] },
  onDueDate: { type: Boolean, default: true },
  overdueEveryDays: { type: Number, default: 3, min: 1 },
  overdueMaxCount: { type: Number, default: 5, min: 0 },
  sendTime: { type: String, default: () => config.reminderTime },
  sendToParent: { type: Boolean, default: true },
  language: { type: String, enum: ['en', 'ta', 'hi'], default: 'en' }, // language of reminder emails
  translations: { type: mongoose.Schema.Types.Mixed, default: {} }, // saved ta / hi versions of the templates
  templates: {
    beforeDue: tpl(DEFAULT_TEMPLATES.beforeDue),
    dueToday: tpl(DEFAULT_TEMPLATES.dueToday),
    overdue: tpl(DEFAULT_TEMPLATES.overdue),
  },
}, { timestamps: true });

export const ReminderSetting = mongoose.models.ReminderSetting || mongoose.model('ReminderSetting', reminderSettingSchema);

const reminderLogSchema = new mongoose.Schema({
  studentFee: { type: ObjectId, ref: 'StudentFee', required: true },
  student: { type: ObjectId, ref: 'Student', required: true },
  rule: { type: String, required: true }, // D-7, D-3, D-1, D0, OVERDUE_n, MANUAL
  channel: { type: String, default: 'EMAIL' },
  provider: { type: String, enum: ['BREVO', null] },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED', 'SKIPPED'], required: true },
  error: String,
  recipients: [String],
  sentAt: Date,
  dateKey: { type: String, required: true },
}, { timestamps: true });
reminderLogSchema.index({ studentFee: 1, rule: 1, dateKey: 1 }, { unique: true });
reminderLogSchema.index({ dateKey: 1, status: 1 });

export const ReminderLog = mongoose.models.ReminderLog || mongoose.model('ReminderLog', reminderLogSchema);

const settingSchema = new mongoose.Schema({
  key: { type: String, default: 'singleton', unique: true },
  academicYear: { type: String, default: '2025-26' },
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] }, // 0 = Sunday
  attendanceCutoffTime: { type: String, default: '23:59' },
  lowAttendanceThreshold: { type: Number, default: 75 },
  staffEditWindowHours: { type: Number, default: 24 },
  staffLateGraceMinutes: { type: Number, default: 10 },
  staffCanViewFees: { type: Boolean, default: false },
}, { timestamps: true });

export const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

const jobLockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  lockedUntil: { type: Date, required: true },
  lockedBy: String,
}, { timestamps: true });

export const JobLock = mongoose.models.JobLock || mongoose.model('JobLock', jobLockSchema);

const auditSchema = new mongoose.Schema({
  actor: { type: ObjectId, ref: 'User', index: true },
  actorName: String,
  action: { type: String, required: true },
  entity: { type: String, required: true, index: true },
  entityId: String,
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  ip: String,
}, { timestamps: { createdAt: true, updatedAt: false } });
auditSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditSchema);
