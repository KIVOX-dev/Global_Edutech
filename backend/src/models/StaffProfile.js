import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  key: { type: String, required: true },
  name: String,
  contentType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

export { documentSchema };

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId: { type: String, required: true, unique: true, trim: true },
  designation: { type: String, trim: true },
  joinDate: String, // YYYY-MM-DD
  shiftStart: { type: String, default: '09:00' }, // HH:mm
  shiftEnd: { type: String, default: '17:00' },
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 6 },
  },
  documents: { type: [documentSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.StaffProfile || mongoose.model('StaffProfile', schema);
