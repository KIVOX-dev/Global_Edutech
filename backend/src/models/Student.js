import mongoose from 'mongoose';
import { documentSchema } from './StaffProfile.js';

const schema = new mongoose.Schema({
  admissionNo: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  parentName: { type: String, trim: true },
  parentEmail: { type: String, lowercase: true, trim: true },
  parentPhone: { type: String, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', index: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
  photoKey: String,
  documents: { type: [documentSchema], default: [] },
}, { timestamps: true });

schema.index({ name: 'text', admissionNo: 'text' });

export default mongoose.models.Student || mongoose.model('Student', schema);
