import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  program: { type: String, trim: true },
  studentAge: { type: String, trim: true },
  preferredTime: { type: String, trim: true },
  message: { type: String, trim: true, maxlength: 2000 },
  formType: { type: String, default: 'Program Enquiry' },
  status: { type: String, enum: ['NEW', 'CONTACTED', 'IN_PROGRESS', 'ENROLLED', 'CLOSED'], default: 'NEW', index: true },
  note: { type: String, maxlength: 500 },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
schema.index({ createdAt: -1 });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', schema);
