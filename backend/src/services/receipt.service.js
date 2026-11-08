import PDFDocument from 'pdfkit';
import { Payment } from '../models/Fees.js';
import config from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { formatDisplayDate } from '../utils/dates.js';
import { inr } from '../utils/money.js';
import * as storage from './storage.service.js';

function buildPdf(p) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fee = p.studentFee;
    const s = p.student;
    doc.fontSize(18).fillColor('#7c4dcc').text(config.instituteName, { align: 'center' });
    doc.moveDown(0.2).fontSize(11).fillColor('#444').text('FEE RECEIPT', { align: 'center' });
    doc.moveDown().strokeColor('#dddddd').moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke().moveDown();

    const row = (k, v) => { doc.fontSize(10).fillColor('#777').text(k, { continued: true }).fillColor('#111').text(`  ${v ?? '-'}`); };
    row('Receipt No:', p.receiptNo);
    row('Date:', formatDisplayDate(p.paidOn));
    row('Student:', `${s?.name} (${s?.admissionNo})`);
    row('Course:', fee?.course?.name);
    row('Instalment:', fee?.installmentLabel);
    row('Payment mode:', p.mode + (p.reference ? ` / ${p.reference}` : ''));
    doc.moveDown();
    doc.fontSize(14).fillColor('#111').text(`Amount received: ${inr(p.amount)}`);
    doc.moveDown(0.3).fontSize(10).fillColor('#555')
      .text(`Fee total ${inr(fee?.amountDue)}  |  Paid so far ${inr(fee?.amountPaid)}  |  Balance ${inr((fee?.amountDue || 0) - (fee?.amountPaid || 0))}`);
    doc.moveDown(2).fontSize(9).fillColor('#888').text(`Received by: ${p.receivedBy?.name || '-'}`);
    doc.text('This is a computer generated receipt.', { align: 'center' });
    doc.end();
  });
}

export async function getReceiptUrl(paymentId) {
  const payment = await Payment.findById(paymentId)
    .populate({ path: 'studentFee', populate: { path: 'course', select: 'name' } })
    .populate('student', 'name admissionNo')
    .populate('receivedBy', 'name');
  if (!payment) throw ApiError.notFound('Payment not found');
  const key = `receipts/${payment._id}.pdf`;
  if (!payment.receiptKey || !(await storage.headObject(key))) {
    await storage.putObject(key, await buildPdf(payment), 'application/pdf');
    await Payment.updateOne({ _id: payment._id }, { receiptKey: key });
  }
  return { url: await storage.getDownloadUrl(key, 300, `${payment.receiptNo}.pdf`), key, expiresIn: 300 };
}
