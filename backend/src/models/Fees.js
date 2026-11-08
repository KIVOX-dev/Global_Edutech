import mongoose from 'mongoose';
import { installmentSchema } from './Course.js';

const { ObjectId } = mongoose.Schema.Types;

const feeStructureSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  course: { type: ObjectId, ref: 'Course', required: true, index: true },
  totalAmount: { type: Number, required: true, min: 0 },
  installments: { type: [installmentSchema], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const FeeStructure = mongoose.models.FeeStructure || mongoose.model('FeeStructure', feeStructureSchema);

const studentFeeSchema = new mongoose.Schema({
  student: { type: ObjectId, ref: 'Student', required: true, index: true },
  course: { type: ObjectId, ref: 'Course', required: true },
  installmentLabel: { type: String, required: true },
  amountDue: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  dueDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  status: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'], default: 'PENDING' },
}, { timestamps: true });
studentFeeSchema.index({ dueDate: 1 });
studentFeeSchema.index({ status: 1, dueDate: 1 });
studentFeeSchema.index({ student: 1, course: 1, installmentLabel: 1 }, { unique: true });

export const StudentFee = mongoose.models.StudentFee || mongoose.model('StudentFee', studentFeeSchema);

const paymentSchema = new mongoose.Schema({
  studentFee: { type: ObjectId, ref: 'StudentFee', required: true, index: true },
  student: { type: ObjectId, ref: 'Student', required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  paidOn: { type: String, required: true, index: true },
  mode: { type: String, enum: ['CASH', 'UPI', 'CARD', 'BANK', 'CHEQUE'], required: true },
  reference: { type: String, trim: true },
  receiptNo: { type: String, unique: true, sparse: true },
  receiptKey: String,
  receivedBy: { type: ObjectId, ref: 'User' },
}, { timestamps: true });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
