import { z } from 'zod';
import Enquiry from '../models/Enquiry.js';
import User from '../models/User.js';
import config from '../config/env.js';
import logger from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, paginate, escapeRegex } from '../utils/http.js';
import { reqText, text, email } from '../validators/common.js';
import { audit } from '../services/audit.service.js';
import { emailService } from '../services/email/email.service.js';
import { brandedHtml, htmlToText } from '../services/email/templates.js';
import { escapeHtml } from '../utils/sanitize.js';
import { ai } from '../services/ai/ai.service.js';

export const schemas = {
  submit: z.object({
    name: reqText(120),
    email,
    phone: z.string().trim().min(6).max(20).transform((v) => v.replace(/[^\d+\-\s()]/g, '')),
    program: text(80).optional(),
    studentAge: text(40).optional(),
    preferredTime: text(60).optional(),
    mode: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['Online', 'Offline']).optional()),
    message: reqText(2000),
    formType: text(40).optional(),
  }),
  reply: z.object({ subject: reqText(150), body: z.string().trim().min(5).max(3000) }),
  update: z.object({
    status: z.enum(['NEW', 'CONTACTED', 'IN_PROGRESS', 'ENROLLED', 'CLOSED']).optional(),
    note: text(500).optional(),
  }).refine((v) => v.status || v.note !== undefined, 'Nothing to update'),
};

// Public: the website enquiry form. Saves the enquiry, then notifies the admins by email (best effort).
export const submit = asyncHandler(async (req, res) => {
  const e = await Enquiry.create(req.body);
  res.status(201).json({ success: true, message: 'Thank you! We will contact you shortly.', id: e._id });

  // triage in the background; a failure here never affects the visitor
  try {
    const t = await ai.triageEnquiry(e);
    await Enquiry.updateOne({ _id: e._id }, { ai: { category: t.category, urgency: t.urgency, summary: t.summary, source: t.source, model: t.model, at: new Date() } });
  } catch (err) {
    logger.warn({ err: err.message }, 'Enquiry triage failed');
  }

  if (!emailService.isConfigured()) return;
  const admins = await User.find({ role: 'ADMIN', isActive: true }).select('email').lean();
  const to = [process.env.CONTACT_RECEIVER_EMAIL, ...admins.map((a) => a.email)].filter((x) => x && !/your_|changeme/i.test(x));
  if (!to.length) return;
  const inner = `<h3 style="margin:0 0 12px">New ${escapeHtml(e.formType)}</h3>
    <p><strong>Name:</strong> ${escapeHtml(e.name)}<br/><strong>Phone:</strong> ${escapeHtml(e.phone)}<br/><strong>Email:</strong> ${escapeHtml(e.email)}<br/>
    <strong>Program:</strong> ${escapeHtml(e.program || '-')}<br/><strong>Student age:</strong> ${escapeHtml(e.studentAge || '-')}<br/><strong>Preferred time:</strong> ${escapeHtml(e.preferredTime || '-')}<br/><strong>Class mode:</strong> ${escapeHtml(e.mode || '-')}</p>
    <p style="background:#f7f3ff;padding:12px;border-left:4px solid #7c4dcc">${escapeHtml(e.message).replace(/\n/g, '<br/>')}</p>
    <p><a href="${config.appUrl}/admin/enquiries">Open in the admin panel</a></p>`;
  emailService.send({ to: [...new Set(to)], subject: `New enquiry: ${e.name} (${e.program || 'General'})`, html: brandedHtml(inner), text: htmlToText(inner), replyTo: e.email })
    .catch((err) => logger.warn({ err: err.message }, 'Enquiry notification email failed'));
});

export const list = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.status) f.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    f.$or = [{ name: rx }, { email: rx }, { phone: rx }, { program: rx }];
  }
  await paginate(res, Enquiry, f, req.query, { sort: { createdAt: -1 } });
});

export const update = asyncHandler(async (req, res) => {
  const e = await Enquiry.findById(req.params.id);
  if (!e) throw ApiError.notFound('Enquiry not found');
  const before = e.toObject();
  if (req.body.status) e.status = req.body.status;
  if (req.body.note !== undefined) e.note = req.body.note;
  e.handledBy = req.user._id;
  await e.save();
  await audit(req, { action: 'UPDATE_ENQUIRY', entity: 'Enquiry', entityId: e._id, before, after: e });
  ok(res, e);
});

// Admin presses "Send": the (edited) reply goes to the enquirer's own address through Brevo, never anywhere else
export const sendReply = asyncHandler(async (req, res) => {
  const e = await Enquiry.findById(req.params.id);
  if (!e) throw ApiError.notFound('Enquiry not found');
  if (!emailService.isConfigured()) throw ApiError.unavailable('Email is not configured (set BREVO_API_KEY and BREVO_SENDER_EMAIL)');
  const { subject, body } = req.body;
  const inner = body.split(/\r?\n\r?\n/).map((p) => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\r?\n/g, '<br/>')}</p>`).join('');
  let result;
  try {
    result = await emailService.send({ to: e.email, subject, html: brandedHtml(inner), text: body, replyTo: config.brevo.senderEmail });
  } catch (err) {
    logger.warn({ err: err.message }, 'Enquiry reply email failed');
    throw new ApiError(502, 'EMAIL_FAILED', 'The email could not be sent right now. Please try again, or use "Open in email app".');
  }
  e.repliedAt = new Date();
  if (e.status === 'NEW') e.status = 'CONTACTED';
  e.handledBy = req.user._id;
  await e.save();
  await audit(req, { action: 'SEND_ENQUIRY_REPLY', entity: 'Enquiry', entityId: e._id, after: { to: e.email, subject, provider: result.provider } });
  ok(res, { sent: true, to: e.email, status: e.status, repliedAt: e.repliedAt });
});

export const remove = asyncHandler(async (req, res) => {
  const e = await Enquiry.findByIdAndDelete(req.params.id);
  if (!e) throw ApiError.notFound('Enquiry not found');
  await audit(req, { action: 'DELETE_ENQUIRY', entity: 'Enquiry', entityId: e._id, before: e });
  ok(res, { deleted: true });
});
