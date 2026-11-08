import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import config from '../config/env.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const TZ = config.timezone;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_RE = /^\d{4}-\d{2}$/;

export const now = () => dayjs().tz(TZ);
export const todayStr = () => now().format('YYYY-MM-DD');
export const nowHHmm = () => now().format('HH:mm');
export const isValidDate = (s) => typeof s === 'string' && DATE_RE.test(s) && dayjs(s, 'YYYY-MM-DD', true).isValid();

// Pure calendar-date arithmetic on "YYYY-MM-DD" strings (no timezone involved)
export const addDays = (s, n) => dayjs.utc(s).add(n, 'day').format('YYYY-MM-DD');
export const diffDays = (a, b) => dayjs.utc(a).diff(dayjs.utc(b), 'day'); // a - b
export const dayOfWeek = (s) => dayjs.utc(s).day(); // 0 = Sunday
export const monthRange = (ym) => {
  const start = `${ym}-01`;
  return { from: start, to: dayjs.utc(start).endOf('month').format('YYYY-MM-DD') };
};

export function eachDate(from, to) {
  const out = [];
  for (let d = from; d <= to && out.length < 800; d = addDays(d, 1)) out.push(d);
  return out;
}

// Converts an instant to "HH:mm" in the institute timezone
export const toHHmm = (date) => dayjs(date).tz(TZ).format('HH:mm');
export const minutesOf = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const formatDisplayDate = (s) => dayjs.utc(s).format('DD MMM YYYY');

export { dayjs };
