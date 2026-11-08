import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const studentAttendanceSchema = new mongoose.Schema({
  student: { type: ObjectId, ref: 'Student', required: true },
  batch: { type: ObjectId, ref: 'Batch', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], required: true },
  note: { type: String, maxlength: 300 },
  markedBy: { type: ObjectId, ref: 'User' },
  markedAt: Date,
  editedBy: { type: ObjectId, ref: 'User' },
  editedAt: Date,
}, { timestamps: true });
studentAttendanceSchema.index({ student: 1, batch: 1, date: 1 }, { unique: true });
studentAttendanceSchema.index({ batch: 1, date: 1 });
studentAttendanceSchema.index({ date: 1 });

export const StudentAttendance = mongoose.models.StudentAttendance || mongoose.model('StudentAttendance', studentAttendanceSchema);

const staffAttendanceSchema = new mongoose.Schema({
  staff: { type: ObjectId, ref: 'User', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  checkIn: Date,
  checkOut: Date,
  status: { type: String, enum: ['PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE', 'HALF_DAY'], required: true },
  totalMinutes: { type: Number, default: 0 },
  note: String,
}, { timestamps: true });
staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ date: 1 });

export const StaffAttendance = mongoose.models.StaffAttendance || mongoose.model('StaffAttendance', staffAttendanceSchema);

const leaveSchema = new mongoose.Schema({
  staff: { type: ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['CASUAL', 'SICK', 'UNPAID'], required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  days: { type: Number, required: true, min: 0 },
  reason: { type: String, maxlength: 500 },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewNote: String,
  reviewedAt: Date,
}, { timestamps: true });

export const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveSchema);

const holidaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['PUBLIC', 'INSTITUTE', 'OTHER'], default: 'INSTITUTE' },
}, { timestamps: true });

export const Holiday = mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);
