// Strips keys starting with "$" or containing "." (NoSQL operator injection) and null bytes
export function sanitizeValue(v) {
  if (Array.isArray(v)) return v.map(sanitizeValue);
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = sanitizeValue(val);
    }
    return out;
  }
  if (typeof v === 'string') return v.replace(/\0/g, '');
  return v;
}

export const stripTags = (s) => String(s).replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim();

export const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
