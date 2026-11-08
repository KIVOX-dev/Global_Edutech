import { z } from 'zod';

const PLACEHOLDER = /your_|changeme/i;
export const isPlaceholder = (v) => !v || PLACEHOLDER.test(String(v));

const str = (def = '') => z.string().default(def);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: str('9000'),
  X_ZOHO_CATALYST_LISTEN_PORT: str(''),
  APP_URL: str('http://localhost:5173'),
  ALLOWED_ORIGINS: str(''), // extra browser origins allowed to call the API, comma-separated (e.g. a vercel.app address)
  APP_TIMEZONE: str('Asia/Kolkata'),
  INSTITUTE_NAME: str('Global Edutech'),
  MONGODB_URI: str(''),
  JWT_ACCESS_SECRET: str(''),
  JWT_REFRESH_SECRET: str(''),
  COOKIE_DOMAIN: str(''),
  ADMIN_SEED_EMAIL: str(''),
  ADMIN_SEED_PASSWORD: str(''),
  B2_KEY_ID: str(''),
  B2_APPLICATION_KEY: str(''),
  B2_BUCKET: str(''),
  B2_REGION: str('us-west-004'),
  B2_ENDPOINT: str(''),
  BREVO_API_KEY: str(''),
  BREVO_SENDER_EMAIL: str(''),
  BREVO_SENDER_NAME: str(''),
  GOOGLE_CLIENT_ID: str(''), // OAuth web client id for "Sign in with Google" (public value, optional)
  GROQ_API_KEY: str(''), // one key, or several separated by commas (used as automatic fallbacks)
  GROQ_MODEL: str('llama-3.3-70b-versatile'),
  GROQ_FALLBACK_MODELS: str('llama-3.1-8b-instant'), // tried in order when the main model is rate limited
  GROQ_DAILY_LIMIT: str('400'), // our own cap on AI calls per day (free tiers are limited)
  REMINDER_CRON_TIME: str('10:00'),
  PAYMENT_INSTRUCTIONS: str('Please pay at the institute office or via UPI / bank transfer and share the reference.'),
  STATIC_DIR: str(''),
});

// APP_URL plus its www / non-www twin, plus anything listed in ALLOWED_ORIGINS (all normalised, no trailing slash)
export function buildAllowedOrigins(appUrl, extra = '') {
  const mains = (Array.isArray(appUrl) ? appUrl : String(appUrl || '').split(','));
  const out = new Set();
  const add = (raw, twin = false) => {
    try {
      const u = new URL(String(raw).trim());
      out.add(u.origin);
      if (!twin) return;
      if (u.hostname.startsWith('www.')) out.add(`${u.protocol}//${u.hostname.slice(4)}${u.port ? `:${u.port}` : ''}`);
      else if (u.hostname.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) && u.hostname !== 'localhost') out.add(`${u.protocol}//www.${u.hostname}${u.port ? `:${u.port}` : ''}`);
    } catch { /* ignore malformed entries */ }
  };
  mains.filter((x) => x.trim()).forEach((m) => add(m, true)); // main site addresses get their www / non-www twin
  String(extra || '').split(',').filter((x) => x.trim()).forEach(add);
  return [...out];
}

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  const e = parsed.data;
  const isProd = e.NODE_ENV === 'production';
  const isTest = e.NODE_ENV === 'test';

  const services = {
    mongodb: !isPlaceholder(e.MONGODB_URI),
    jwt: !isPlaceholder(e.JWT_ACCESS_SECRET) && !isPlaceholder(e.JWT_REFRESH_SECRET),
    b2: ![e.B2_KEY_ID, e.B2_APPLICATION_KEY, e.B2_BUCKET, e.B2_ENDPOINT].some(isPlaceholder),
    brevo: !isPlaceholder(e.BREVO_API_KEY) && !isPlaceholder(e.BREVO_SENDER_EMAIL),
  };
  const groqKeys = e.GROQ_API_KEY.split(',').map((k) => k.trim()).filter((k) => k && !isPlaceholder(k));
  services.groq = groqKeys.length > 0;
  services.google = !isPlaceholder(e.GOOGLE_CLIENT_ID) && /\.apps\.googleusercontent\.com$/.test(e.GOOGLE_CLIENT_ID.trim());
  services.email = services.brevo;

  const problems = [];
  if (!services.mongodb) problems.push('MONGODB_URI (database features disabled)');
  if (!services.jwt) problems.push('JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (using insecure dev secrets)');
  if (!services.b2) problems.push('B2_* (file uploads, receipts and CSV exports disabled)');
  if (!services.google) problems.push('GOOGLE_CLIENT_ID (optional: "Sign in with Google" button hidden)');
  if (!services.groq) problems.push('GROQ_API_KEY (optional: AI features use built-in fallbacks)');
  if (!services.brevo) problems.push('BREVO_* (email disabled: no reminders, reset links or credentials emails)');

  if (isProd) {
    const fatal = [];
    if (!services.mongodb) fatal.push('MONGODB_URI');
    if (!services.jwt) fatal.push('JWT_ACCESS_SECRET, JWT_REFRESH_SECRET');
    if (!isPlaceholder(e.JWT_ACCESS_SECRET) && e.JWT_ACCESS_SECRET.length < 32) fatal.push('JWT_ACCESS_SECRET (min 32 chars)');
    if (!isPlaceholder(e.JWT_REFRESH_SECRET) && e.JWT_REFRESH_SECRET.length < 32) fatal.push('JWT_REFRESH_SECRET (min 32 chars)');
    if (isPlaceholder(e.APP_URL) || /localhost/.test(e.APP_URL)) fatal.push('APP_URL (must be the public https URL)');
    if (fatal.length) throw new Error(`Missing or placeholder values in production: ${fatal.join('; ')}`);
  }

  const secrets = services.jwt
    ? { access: e.JWT_ACCESS_SECRET, refresh: e.JWT_REFRESH_SECRET }
    : { access: 'dev-only-access-secret-not-for-production', refresh: 'dev-only-refresh-secret-not-for-production' };

  const [h = '10', m = '00'] = (e.REMINDER_CRON_TIME || '10:00').split(':');
  const cookieDomain = isPlaceholder(e.COOKIE_DOMAIN) || e.COOKIE_DOMAIN === 'localhost' ? undefined : e.COOKIE_DOMAIN;

  return {
    env: e.NODE_ENV,
    isProd,
    isTest,
    port: Number(e.X_ZOHO_CATALYST_LISTEN_PORT || e.PORT || 9000),
    host: '0.0.0.0',
    // APP_URL may list several addresses separated by commas: the first is the main one (used in email links)
    appUrl: e.APP_URL.split(',')[0].trim().replace(/\/$/, ''),
    allowedOrigins: buildAllowedOrigins(e.APP_URL, e.ALLOWED_ORIGINS),
    timezone: e.APP_TIMEZONE,
    instituteName: e.INSTITUTE_NAME,
    paymentInstructions: e.PAYMENT_INSTRUCTIONS,
    mongoUri: e.MONGODB_URI,
    secrets,
    cookieDomain,
    seed: { email: e.ADMIN_SEED_EMAIL, password: e.ADMIN_SEED_PASSWORD },
    b2: { keyId: e.B2_KEY_ID, appKey: e.B2_APPLICATION_KEY, bucket: e.B2_BUCKET, region: e.B2_REGION, endpoint: e.B2_ENDPOINT },
    google: { clientId: e.GOOGLE_CLIENT_ID.trim() },
    groq: {
      keys: groqKeys,
      models: [e.GROQ_MODEL, ...e.GROQ_FALLBACK_MODELS.split(',').map((m) => m.trim()).filter(Boolean)].filter((m, i, a) => m && a.indexOf(m) === i),
      dailyLimit: Number(e.GROQ_DAILY_LIMIT) || 400,
    },
    brevo: { apiKey: e.BREVO_API_KEY, senderEmail: e.BREVO_SENDER_EMAIL, senderName: e.BREVO_SENDER_NAME || e.INSTITUTE_NAME },
    reminderTime: `${h.padStart(2, '0')}:${m.padStart(2, '0')}`,
    staticDir: e.STATIC_DIR,
    services,
    notConfigured: problems,
  };
}

const config = loadConfig();
export default config;
