import config from '../../config/env.js';
import { escapeHtml } from '../../utils/sanitize.js';

// Replaces {placeholders}; values are HTML-escaped in html mode
export function renderTemplate(template, vars, { html = true } = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (m, key) => {
    if (!(key in vars)) return m;
    return html ? escapeHtml(vars[key]) : String(vars[key]);
  });
}

export function htmlToText(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Institute branded wrapper used by every outgoing email
export function brandedHtml(inner, title = config.instituteName) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1fb;font-family:Arial,Helvetica,sans-serif;color:#222">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#7c4dcc;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold">${escapeHtml(title)}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">${inner}</td></tr>
<tr><td style="padding:14px 24px;background:#faf8ff;color:#777;font-size:12px">This is an automated message from ${escapeHtml(config.instituteName)}. Please do not share this email.</td></tr>
</table></td></tr></table></body></html>`;
}

// Builds a full message (html + text) from a stored template and variables
export function buildMessage({ subject, html }, vars) {
  const body = renderTemplate(html, vars, { html: true });
  return {
    subject: renderTemplate(subject, vars, { html: false }),
    html: brandedHtml(body),
    text: htmlToText(body),
  };
}
