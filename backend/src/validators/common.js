import { z } from 'zod';
import { stripTags } from '../utils/sanitize.js';
import { isValidDate, MONTH_RE } from '../utils/dates.js';

export const text = (max = 200) => z.string().trim().max(max).transform(stripTags);
export const reqText = (max = 200) => z.string().trim().min(1, 'Required').max(max).transform(stripTags);
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const email = z.string().trim().toLowerCase().email('Invalid email').max(160);
export const optEmail = z.union([email, z.literal('')]).optional().transform((v) => v || undefined);
export const phone = z.string().trim().regex(/^[+\d][\d\s-]{6,17}$/, 'Invalid phone number');
export const optPhone = z.union([phone, z.literal('')]).optional().transform((v) => v || undefined);
export const dateStr = z.string().refine(isValidDate, 'Use YYYY-MM-DD');
export const monthStr = z.string().regex(MONTH_RE, 'Use YYYY-MM');
export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');
export const money = z.coerce.number().finite().min(0).max(10_000_000);
export const password = z.string().min(8, 'At least 8 characters').max(128)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Use letters and numbers');

export const idParams = z.object({ id: objectId });
export const pagingQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: text(80).optional(),
  sort: z.string().max(40).optional(),
  order: z.enum(['asc', 'desc']).optional(),
}).passthrough();

export const dateRangeQuery = z.object({ from: dateStr.optional(), to: dateStr.optional() }).passthrough();
