import crypto from 'node:crypto';
import Enquiry from '../../models/Enquiry.js';
import { todayStr, addDays } from '../../utils/dates.js';
import { attendanceTrend, summarizeStudents } from '../attendance.service.js';
import { feeDashboard } from '../fee.service.js';
import { TRANSLATIONS, LANGUAGES } from '../reminders/defaults.js';
import { groq, AiUnavailableError } from './groq.service.js';
import { knowledge, CATEGORIES, triageByRules, replyFallback, chatFallback, findCourse } from './fallbacks.js';

const KNOWLEDGE = JSON.stringify({
  institute: knowledge.institute,
  programs: knowledge.programs,
  courses: knowledge.courses.map(({ title, category, ageGroup, duration, intro }) => ({ title, category, ageGroup, duration, intro })),
});

const parseJson = (text) => {
  try { return JSON.parse(text); } catch { /* fall through */ }
  const m = String(text).match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* ignore */ } }
  return null;
};
const placeholders = (s) => new Set(String(s).match(/\{\w+\}/g) || []);
const tagCount = (s) => (String(s).match(/<\/?[a-z][^>]*>/gi) || []).length;
const avg = (xs) => { const v = xs.filter((x) => x !== null && x !== undefined); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null; };

/**
 * Every feature has the same shape: try Groq, and on ANY failure (not configured, rate limit, daily cap, bad output)
 * return the built-in fallback with source: 'fallback' so the UI can say which one was used.
 */
export function createAi(client = groq) {
  const via = async (aiFn, fallbackFn) => {
    try {
      return { ...(await aiFn()), source: 'ai' };
    } catch (err) {
      return { ...(await fallbackFn()), source: 'fallback', reason: err?.code || 'error' };
    }
  };

  // ---------- enquiry triage (no name, phone or email is ever sent) ----------
  async function triageEnquiry(e) {
    return via(async () => {
      const r = await client.complete({
        json: true, maxTokens: 200, temperature: 0.1,
        messages: [
          { role: 'system', content: `You triage enquiries for Global Edutech, a preschool, after-school and home-tuition institute in Coimbatore. Return JSON only: {"category": one of ${JSON.stringify(CATEGORIES)}, "urgency": "high" | "normal" | "low", "summary": "max 140 characters, English"}. High urgency = the parent wants to start right away or is upset. Spam = adverts, links, gibberish.` },
          { role: 'user', content: JSON.stringify({ program: e.program, studentAge: e.studentAge, preferredTime: e.preferredTime, mode: e.mode, message: String(e.message || '').slice(0, 600) }) },
        ],
      });
      const j = parseJson(r.text);
      if (!j || !CATEGORIES.includes(j.category) || !['high', 'normal', 'low'].includes(j.urgency) || typeof j.summary !== 'string') throw new AiUnavailableError('bad-output');
      return { category: j.category, urgency: j.urgency, summary: j.summary.slice(0, 160), model: r.model };
    }, async () => triageByRules(e));
  }

  // ---------- reply drafts (first name only) ----------
  async function draftReply({ enquiry, channel = 'whatsapp', language = 'en' }) {
    const first = String(enquiry.name || '').trim().split(/\s+/)[0] || 'there';
    return via(async () => {
      const r = await client.complete({
        maxTokens: 380, temperature: 0.5,
        messages: [
          { role: 'system', content: `You write replies on behalf of Global Edutech (Coimbatore). Use ONLY the facts in KNOWLEDGE. Never state fees, discounts, dates or timings that are not in KNOWLEDGE. Be warm and brief: WhatsApp under 70 words; email under 120 words and begin with a line "Subject: ...". Ask for a convenient time for a call. Write in ${LANGUAGES[language] || 'English'}. Sign as "Global Edutech team". Output the message only.\nKNOWLEDGE: ${KNOWLEDGE}` },
          { role: 'user', content: `Channel: ${channel}\nParent first name: ${first}\nDetails: ${JSON.stringify({ program: enquiry.program, studentAge: enquiry.studentAge, mode: enquiry.mode, message: String(enquiry.message || '').slice(0, 500) })}` },
        ],
      });
      return { text: r.text, model: r.model };
    }, async () => ({ text: replyFallback({ name: first, program: enquiry.program, channel, language }) }));
  }

  // ---------- website chatbot ----------
  async function chatReply(messages) {
    const history = messages.slice(-6).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 500) }));
    const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content || '';
    return via(async () => {
      const r = await client.complete({
        maxTokens: 260, temperature: 0.3,
        messages: [
          { role: 'system', content: `You are the website assistant for Global Edutech, a preschool, after-school and home-tuition institute in Coimbatore. Answer ONLY from KNOWLEDGE. If something is not in KNOWLEDGE (fees, exact timings, discounts, admission dates) say you cannot confirm it and suggest the enquiry form or calling ${knowledge.institute.phone}. Keep answers under 80 words, friendly, in the visitor's language (English, Tamil or Hindi). Never ask for or repeat personal details such as phone numbers or addresses.\nKNOWLEDGE: ${KNOWLEDGE}` },
          ...history,
        ],
      });
      const course = findCourse(`${lastUser} ${r.text}`);
      const links = [...(course ? [{ label: `About ${course.title}`, href: `/courses/${course.slug}` }] : []), { label: 'Send an enquiry', href: '/enquiry' }];
      return { reply: r.text.slice(0, 900), links, model: r.model };
    }, async () => chatFallback(lastUser));
  }

  // ---------- reminder translations (placeholders and HTML must survive) ----------
  async function translateTemplates({ templates, language }) {
    if (!TRANSLATIONS[language]) return { translations: null, source: 'fallback', reason: 'unsupported-language' };
    return via(async () => {
      const src = Object.fromEntries(['beforeDue', 'dueToday', 'overdue'].map((k) => [k, { subject: templates[k].subject, html: templates[k].html }]));
      const r = await client.complete({
        json: true, maxTokens: 1800, temperature: 0.2,
        cacheKey: `translate:${language}:${crypto.createHash('md5').update(JSON.stringify(src)).digest('hex')}`, ttlMs: 24 * 3600_000,
        messages: [
          { role: 'system', content: `Translate these fee-reminder email templates into ${LANGUAGES[language]}. Keep every {placeholder} exactly as written (for example {amount_due}), keep all HTML tags unchanged, translate only the visible text, keep a polite parent-facing tone. Return JSON with the same keys: {"beforeDue":{"subject":"","html":""},"dueToday":{...},"overdue":{...}}.` },
          { role: 'user', content: JSON.stringify(src) },
        ],
      });
      const out = parseJson(r.text);
      if (!out) throw new AiUnavailableError('bad-output');
      for (const k of Object.keys(src)) {
        const t = out[k];
        if (!t || typeof t.subject !== 'string' || typeof t.html !== 'string') throw new AiUnavailableError('bad-output');
        for (const field of ['subject', 'html']) {
          for (const ph of placeholders(src[k][field])) if (!placeholders(t[field]).has(ph)) throw new AiUnavailableError('bad-output', `${k}.${field} lost ${ph}`);
        }
        if (Math.abs(tagCount(t.html) - tagCount(src[k].html)) > 1) throw new AiUnavailableError('bad-output');
      }
      return { translations: out, model: r.model };
    }, async () => ({ translations: TRANSLATIONS[language] }));
  }

  // ---------- admin insights (aggregates only: no student names) ----------
  async function snapshot() {
    const today = todayStr();
    const [trend, week, fees, newEnquiries, weekEnquiries] = await Promise.all([
      attendanceTrend({ days: 14 }),
      summarizeStudents({ from: addDays(today, -6), to: today }),
      feeDashboard(today),
      Enquiry.countDocuments({ status: 'NEW' }),
      Enquiry.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 864e5) } }),
    ]);
    const pct = trend.map((d) => d.percentage);
    const byBatch = new Map();
    for (const r of week.rows) {
      const name = r.student.batch?.name || 'No batch';
      const b = byBatch.get(name) || { name, attended: 0, counted: 0, students: 0 };
      b.attended += r.present + r.late; b.counted += r.counted; b.students += 1;
      byBatch.set(name, b);
    }
    const batches = [...byBatch.values()].filter((b) => b.counted > 0).map((b) => ({ name: b.name, percent: Math.round((b.attended / b.counted) * 1000) / 10, students: b.students })).sort((a, b) => a.percent - b.percent);
    return {
      date: today,
      attendance: { last7AvgPercent: avg(pct.slice(-7)), previous7AvgPercent: avg(pct.slice(0, -7)), lowestBatches: batches.slice(0, 3), bestBatch: batches[batches.length - 1] || null, studentsBelowThreshold: week.low.length, threshold: week.threshold },
      fees: { collectedThisMonth: fees.collectedThisMonth, pendingAmount: fees.pending.amount, overdueAmount: fees.overdue.amount, overdueInstalments: fees.overdue.count, dueTodayAmount: fees.dueToday.amount },
      enquiries: { new: newEnquiries, last7Days: weekEnquiries },
    };
  }

  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  function insightsFallback(s) {
    const bullets = [];
    const { last7AvgPercent: now, previous7AvgPercent: before } = s.attendance;
    if (now !== null) {
      const diff = before !== null ? Math.round((now - before) * 10) / 10 : null;
      bullets.push(`Student attendance averaged ${now}% over the last 7 school days${diff === null ? '' : diff === 0 ? ', unchanged from the week before' : `, ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff)} points from the week before`}.`);
    } else bullets.push('No student attendance has been marked in the last 7 school days.');
    const low = s.attendance.lowestBatches[0];
    if (low && s.attendance.lowestBatches.length > 1) bullets.push(`${low.name} has the lowest attendance this week at ${low.percent}%. Worth a word with its teacher.`);
    if (s.attendance.studentsBelowThreshold > 0) bullets.push(`${s.attendance.studentsBelowThreshold} student(s) are below the ${s.attendance.threshold}% attendance threshold. Consider calling their parents.`);
    if (s.fees.overdueInstalments > 0) bullets.push(`${s.fees.overdueInstalments} instalment(s) worth ${inr(s.fees.overdueAmount)} are overdue. Run the overdue reminders from the Reminders page.`);
    if (s.fees.dueTodayAmount > 0) bullets.push(`${inr(s.fees.dueTodayAmount)} falls due today.`);
    bullets.push(`${inr(s.fees.collectedThisMonth)} has been collected this month.`);
    if (s.enquiries.new > 0) bullets.push(`${s.enquiries.new} website enquiry(ies) are still New; ${s.enquiries.last7Days} arrived in the last 7 days. Follow them up quickly.`);
    const headline = s.fees.overdueInstalments > 0 || s.attendance.studentsBelowThreshold > 0 ? 'A few items need your attention' : 'Things look steady this week';
    return { headline, bullets: bullets.slice(0, 6) };
  }

  async function insights() {
    const s = await snapshot();
    const res = await via(async () => {
      const r = await client.complete({
        json: true, maxTokens: 450, temperature: 0.3,
        cacheKey: `insights:${crypto.createHash('md5').update(JSON.stringify(s)).digest('hex')}`, ttlMs: 6 * 3600_000,
        messages: [
          { role: 'system', content: 'You are an analyst for a small institute\'s admin. From DATA write a headline (max 12 words) and 4 to 6 short bullets (max 22 words each) with specific observations or actions. Use only numbers present in DATA, in Indian rupees. Return JSON {"headline": "", "bullets": [""]}.' },
          { role: 'user', content: `DATA: ${JSON.stringify(s)}` },
        ],
      });
      const j = parseJson(r.text);
      if (!j || typeof j.headline !== 'string' || !Array.isArray(j.bullets) || j.bullets.length < 2) throw new AiUnavailableError('bad-output');
      return { headline: j.headline.slice(0, 120), bullets: j.bullets.slice(0, 6).map((b) => String(b).slice(0, 200)), model: r.model };
    }, async () => insightsFallback(s));
    return { ...res, data: s, generatedAt: new Date().toISOString() };
  }

  return { triageEnquiry, draftReply, chatReply, translateTemplates, insights, status: () => client.stats() };
}

export const ai = createAi();
