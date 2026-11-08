import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['ADMIN', 'STAFF'], required: true, index: true },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },
  lastLoginAt: Date,
  avatarKey: String,
  googleSub: { type: String, index: true, sparse: true }, // linked Google account id (set at first Google sign-in)
  // Security bookkeeping (never returned by the API)
  failedLogins: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
  sessions: { type: [{ _id: false, jti: String, expiresAt: Date }], default: [], select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash; delete ret.failedLogins; delete ret.lockUntil;
    delete ret.sessions; delete ret.resetTokenHash; delete ret.resetTokenExpires; delete ret.__v;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model('User', userSchema);
