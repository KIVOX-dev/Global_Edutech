import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { GroqClient, AiUnavailableError } from '../src/services/ai/groq.service.js';
import { createAi } from '../src/services/ai/ai.service.js';
import { triageByRules, chatFallback, replyFallback } from '../src/services/ai/fallbacks.js';
import { pickTemplate, runDailyReminders } from '../src/services/reminders/reminder.service.js';
import { TRANSLATIONS } from '../src/services/reminders/defaults.js';
import { app, startDb, stopDb, resetDb, makeUser, loginAs, makeBatchWithStudents } from './helpers.js';
import { StudentFee } from '../src/models/Fees.js';
import { ReminderSetting } from '../src/models/System.js';
import Student from '../src/models/Student.js';
import { addDays, todayStr } from '../src/utils/dates.js';

const silent = { info() {}, warn() {} };
const ok = (text) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }], usage: {} }), headers: new Headers() });
const fail = (status, headers = {}) => ({ ok: false, status, json: async () => ({}), headers: new Headers(headers) });
const client = (responses, opts = {}) => {
  let t = 0;
  const fetchImpl = vi.fn(async (url, init) => {
    const body = JSON.parse(init.body);
    const key = init.headers.Authorization.replace('Bearer ', '');
    const r = typeof responses === 'function' ? responses({ key, model: body.model, body }) : responses.shift();
    return r;
  });
  return { c: new GroqClient({ keys: ['k1', 'k2'], models: ['big', 'small'], fetchImpl, now: () => t, log: silent, ...opts }), fetchImpl, tick: (ms) => { t += ms; } };
};
const msgs = [{ role: 'user', content: 'hi' }];

describe('GroqClient fallbacks (free-tier limits)', () => {
  it('is unavailable without a key', async () => {
    const c = new GroqClient({ keys: [], models: ['big'], log: silent });
    await expect(c.complete({ messages: msgs })).rejects.toMatchObject({ code: 'not-configured' });
  });

  it('moves to the next key when the first is rate limited, and remembers the cooldown', async () => {
    const { c, fetchImpl } = client(({ key }) => (key === 'k1' ? fail(429, { 'retry-after': '40' }) : ok('hello')));
    expect((await c.complete({ messages: msgs })).text).toBe('hello');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    await c.complete({ messages: msgs });
    expect(fetchImpl).toHaveBeenCalledTimes(3); // k1 skipped while cooling down
  });

  it('falls back to the smaller model when the big one is limited on every key', async () => {
    const { c } = client(({ model }) => (model === 'big' ? fail(429) : ok('from small')));
    const r = await c.complete({ messages: msgs });
    expect(r).toMatchObject({ text: 'from small', model: 'small' });
  });

  it('gives GPT-OSS models low reasoning effort and extra token headroom', async () => {
    const { c, fetchImpl } = client(() => ok('answer'), { models: ['openai/gpt-oss-120b', 'llama-3.1-8b-instant'] });
    await c.complete({ messages: msgs, maxTokens: 200 });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body).toMatchObject({ model: 'openai/gpt-oss-120b', reasoning_effort: 'low', max_tokens: 900 });
  });

  it('switches off a rejected key but keeps using the others', async () => {
    const { c } = client(({ key }) => (key === 'k1' ? fail(401) : ok('fine')));
    await c.complete({ messages: msgs });
    expect(c.stats().keysUsable).toBe(1);
  });

  it('treats timeouts and 5xx as soft failures and tries on', async () => {
    let n = 0;
    const { c } = client(() => { n += 1; if (n === 1) throw Object.assign(new Error('x'), { name: 'AbortError' }); return n === 2 ? fail(503) : ok('ok'); });
    expect((await c.complete({ messages: msgs })).text).toBe('ok');
  });

  it('throws when everything fails, then the circuit breaker fails fast without calling the API', async () => {
    const { c, fetchImpl, tick } = client(() => fail(500));
    for (let i = 0; i < 3; i += 1) { await expect(c.complete({ messages: msgs })).rejects.toMatchObject({ code: 'all-failed' }); tick(25_000); }
    const calls = fetchImpl.mock.calls.length;
    await expect(c.complete({ messages: msgs })).rejects.toMatchObject({ code: 'circuit-open' });
    expect(fetchImpl.mock.calls.length).toBe(calls);
    tick(61_000); // breaker closes again
    await expect(c.complete({ messages: msgs })).rejects.toMatchObject({ code: 'all-failed' });
  });

  it('enforces our own daily cap', async () => {
    const { c } = client(() => ok('x'), { dailyLimit: 2 });
    await c.complete({ messages: msgs });
    await c.complete({ messages: msgs });
    await expect(c.complete({ messages: msgs })).rejects.toMatchObject({ code: 'daily-limit' });
  });

  it('serves repeated questions from the cache without another call', async () => {
    const { c, fetchImpl } = client(() => ok('cached answer'));
    await c.complete({ messages: msgs, cacheKey: 'q1', ttlMs: 60_000 });
    const again = await c.complete({ messages: msgs, cacheKey: 'q1', ttlMs: 60_000 });
    expect(again.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('rule-based fallbacks', () => {
  it('triage rules: category, urgency and spam', () => {
    expect(triageByRules({ message: 'Need home tuition for class 8, please call today' })).toMatchObject({ category: 'Home Tuition', urgency: 'high' });
    expect(triageByRules({ program: 'Pre-School', message: 'admission for my 3 year old' }).category).toBe('Preschool');
    expect(triageByRules({ message: 'cheap SEO backlink http://a.com http://b.com' }).category).toBe('Spam');
  });
  it('chatbot answers from course data and links to the course', () => {
    const r = chatFallback('Do you teach abacus? what age?');
    expect(r.reply).toMatch(/5-12 years/);
    expect(r.links.map((l) => l.href)).toContain('/courses/abacus');
    expect(chatFallback('what is the fee?').reply).toMatch(/can't quote/);
    expect(chatFallback('my son is 4 years old').reply).toMatch(/Global Kids/);
  });
  it('reply drafts exist in English, Tamil and Hindi', () => {
    expect(replyFallback({ name: 'Asha Kumar', program: 'Abacus', language: 'en' })).toMatch(/Hello Asha/);
    expect(replyFallback({ name: 'Asha', language: 'ta' })).toMatch(/வணக்கம்/);
    expect(replyFallback({ name: 'Asha', language: 'hi', channel: 'email' })).toMatch(/^Subject:/);
  });
});

describe('ai service always falls back', () => {
  const down = { complete: async () => { throw new AiUnavailableError('all-failed'); }, stats: () => ({}) };

  it('chat, triage and drafts return fallback content when Groq is down', async () => {
    const ai = createAi(down);
    expect(await ai.chatReply([{ role: 'user', content: 'tell me about chess' }])).toMatchObject({ source: 'fallback', reason: 'all-failed' });
    expect((await ai.triageEnquiry({ message: 'urgent tuition class 6' }))).toMatchObject({ source: 'fallback', category: 'Home Tuition' });
    expect((await ai.draftReply({ enquiry: { name: 'Ravi K', program: 'Chess' } })).text).toMatch(/Hello Ravi/);
  });

  it('uses the AI answer when it is valid, and rejects malformed AI output', async () => {
    const good = createAi({ complete: async () => ({ text: JSON.stringify({ category: 'Preschool', urgency: 'low', summary: 'Wants admission' }), model: 'big' }) });
    expect(await good.triageEnquiry({ message: 'x' })).toMatchObject({ source: 'ai', category: 'Preschool' });
    const bad = createAi({ complete: async () => ({ text: JSON.stringify({ category: 'Nonsense' }), model: 'big' }) });
    expect(await bad.triageEnquiry({ message: 'need tuition' })).toMatchObject({ source: 'fallback', reason: 'bad-output', category: 'Home Tuition' });
  });

  it('translation keeps placeholders, otherwise falls back to the built-in Tamil', async () => {
    const templates = { beforeDue: { subject: 'Due {due_date}', html: '<p>Hi {parent_name}</p>' }, dueToday: { subject: 'Today {amount_due}', html: '<p>{amount_due}</p>' }, overdue: { subject: 'Late {amount_due}', html: '<p>{due_date}</p>' } };
    const lost = createAi({ complete: async () => ({ text: JSON.stringify({ beforeDue: { subject: 'x', html: '<p>x</p>' }, dueToday: { subject: 'x', html: '<p>x</p>' }, overdue: { subject: 'x', html: '<p>x</p>' } }), model: 'm' }) });
    const r1 = await lost.translateTemplates({ templates, language: 'ta' });
    expect(r1.source).toBe('fallback');
    expect(r1.translations).toEqual(TRANSLATIONS.ta);
    const keep = createAi({ complete: async () => ({ text: JSON.stringify({ beforeDue: { subject: 'கட்டணம் {due_date}', html: '<p>வணக்கம் {parent_name}</p>' }, dueToday: { subject: 'இன்று {amount_due}', html: '<p>{amount_due}</p>' }, overdue: { subject: 'நிலுவை {amount_due}', html: '<p>{due_date}</p>' } }), model: 'm' }) });
    expect((await keep.translateTemplates({ templates, language: 'ta' })).source).toBe('ai');
  });
});

describe('AI endpoints and reminder language', () => {
  beforeAll(startDb);
  afterAll(stopDb);
  beforeEach(async () => { await resetDb(); await makeUser('ADMIN', 'admin@t.co'); });

  it('public chatbot works with no Groq key and validates input', async () => {
    const res = await request(app).post('/api/chat').send({ messages: [{ role: 'user', content: 'Do you have online classes?' }] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ source: 'fallback' });
    expect(res.body.data.reply).toMatch(/online and offline/i);
    expect((await request(app).post('/api/chat').send({ messages: [] })).status).toBe(400);
    expect((await request(app).post('/api/chat').send({ messages: [{ role: 'assistant', content: 'x' }] })).status).toBe(400);
  });

  it('new enquiries get triaged, and admins can draft replies in three languages', async () => {
    await request(app).post('/api/submit-form').send({ name: 'Meena S', email: 'm@t.co', phone: '9876543210', program: 'Home Tuition', message: 'Need tuition for class 7 urgently' });
    await new Promise((r) => setTimeout(r, 300));
    const admin = await loginAs('admin@t.co');
    const list = await admin.get('/api/admin/enquiries');
    expect(list.body.data[0].ai).toMatchObject({ category: 'Home Tuition', urgency: 'high', source: 'fallback' });
    const id = list.body.data[0]._id;
    const en = await admin.post(`/api/admin/enquiries/${id}/draft-reply`).send({ channel: 'whatsapp', language: 'en' });
    expect(en.body.data).toMatchObject({ source: 'fallback' });
    expect(en.body.data.text).toMatch(/Hello Meena/);
    expect((await admin.post(`/api/admin/enquiries/${id}/draft-reply`).send({ language: 'ta' })).body.data.text).toMatch(/வணக்கம்/);
    expect((await request(app).post(`/api/admin/enquiries/${id}/draft-reply`).send({})).status).toBe(401);
  });

  it('insights fall back to computed bullets', async () => {
    const admin = await loginAs('admin@t.co');
    const r = await admin.get('/api/admin/ai/insights');
    expect(r.status).toBe(200);
    expect(r.body.data.source).toBe('fallback');
    expect(r.body.data.bullets.length).toBeGreaterThan(1);
    expect((await admin.get('/api/admin/ai/status')).body.data.configured).toBe(false);
  });

  it('reminders go out in the chosen language', async () => {
    const admin = await loginAs('admin@t.co');
    expect((await admin.post('/api/admin/reminders/translate').send({ language: 'hi' })).body.data.translations).toBeTruthy();
    await admin.patch('/api/admin/reminders/settings').send({ language: 'ta' });
    const settings = await ReminderSetting.findOne();
    expect(pickTemplate(settings, 'overdue').subject).toBe(TRANSLATIONS.ta.overdue.subject);

    const { course, students } = await makeBatchWithStudents(null, 1);
    await Student.updateMany({}, { email: 's@t.co', parentName: 'P' });
    await StudentFee.create({ student: students[0]._id, course: course._id, installmentLabel: 'I1', amountDue: 1000, dueDate: addDays(todayStr(), 3) });
    const channel = { name: 'EMAIL', isConfigured: () => true, send: vi.fn(async () => ({ provider: 'BREVO' })) };
    await runDailyReminders({ channel, sendSummary: false });
    expect(channel.send.mock.calls[0][0].subject).toMatch(/கட்டண நினைவூட்டல்/);
  });
});
