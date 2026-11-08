import { z } from 'zod';
import Enquiry from '../models/Enquiry.js';
import { ReminderSetting } from '../models/System.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/http.js';
import { getReminderSettings } from '../services/settings.service.js';
import { audit } from '../services/audit.service.js';
import { ai } from '../services/ai/ai.service.js';

const lang = z.enum(['en', 'ta', 'hi']);

export const schemas = {
  chat: z.object({
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(500) })).min(1).max(12),
  }),
  draft: z.object({ channel: z.enum(['whatsapp', 'email']).default('whatsapp'), language: lang.default('en') }),
  translate: z.object({ language: z.enum(['ta', 'hi']) }),
};

// Public website assistant. Works with or without Groq (built-in fallback answers).
export const chat = asyncHandler(async (req, res) => {
  if (req.body.messages[req.body.messages.length - 1].role !== 'user') throw ApiError.badRequest('The last message must be from the visitor');
  const r = await ai.chatReply(req.body.messages);
  ok(res, { reply: r.reply, links: r.links, source: r.source });
});

export const draftReply = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).lean();
  if (!enquiry) throw ApiError.notFound('Enquiry not found');
  const r = await ai.draftReply({ enquiry, channel: req.body.channel, language: req.body.language });
  await audit(req, { action: 'AI_DRAFT_REPLY', entity: 'Enquiry', entityId: enquiry._id, after: { source: r.source, channel: req.body.channel, language: req.body.language } });
  ok(res, { text: r.text, source: r.source, reason: r.reason });
});

export const translateReminders = asyncHandler(async (req, res) => {
  const settings = await getReminderSettings();
  const r = await ai.translateTemplates({ templates: settings.templates, language: req.body.language });
  if (!r.translations) throw ApiError.badRequest('Unsupported language');
  await ReminderSetting.updateOne({ _id: settings._id }, { $set: { [`translations.${req.body.language}`]: r.translations } });
  await audit(req, { action: 'AI_TRANSLATE_REMINDERS', entity: 'ReminderSetting', entityId: settings._id, after: { language: req.body.language, source: r.source } });
  ok(res, { language: req.body.language, translations: r.translations, source: r.source, reason: r.reason });
});

export const insights = asyncHandler(async (req, res) => ok(res, await ai.insights()));
export const aiStatus = asyncHandler(async (req, res) => ok(res, ai.status()));
