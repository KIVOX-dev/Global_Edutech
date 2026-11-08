import mongoose from 'mongoose';

export const installmentSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  dueOffsetDays: { type: Number, default: 0, min: 0 },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  durationMonths: { type: Number, default: 12, min: 1 },
  totalFee: { type: Number, default: 0, min: 0 },
  installments: { type: [installmentSchema], default: [] },
}, { timestamps: true });

export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  startDate: String,
  endDate: String,
  timings: { type: String, trim: true },
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
batchSchema.index({ staff: 1 });

export const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);
export default Course;
