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
<tr><td height="8" bgcolor="#763dcb" style="height:8px;line-height:8px;font-size:0;background:#763dcb;background-image:linear-gradient(90deg,#ff73ad,#763dcb)">&nbsp;</td></tr>
<tr><td align="center" style="background:#ffffff;padding:22px 24px 6px"><a href="${config.appUrl}" target="_blank"><img src="${config.appUrl}/images/logo-banner.png" width="240" alt="${escapeHtml(title)}" style="display:block;width:240px;max-width:100%;height:auto;border:0"></a></td></tr>
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

// Password reset email: branded layout, big button, plain link fallback, expiry and safety note
export function passwordResetMessage({ name, link, minutes = 60 }) {
  const safeName = escapeHtml(String(name || 'there').trim().split(/\s+/)[0] || 'there');
  const safeLink = escapeHtml(link);
  const inner = `<h2 style="margin:0 0 12px;font-size:24px;color:#2d1466">Reset your password</h2>
<p style="margin:0 0 14px">Hello ${safeName},</p>
<p style="margin:0 0 20px">We received a request to reset the password for your ${escapeHtml(config.instituteName)} account. Press the button below to choose a new one. This link works for <strong>${minutes} minutes</strong> and can be used once.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px"><tr><td align="center" bgcolor="#763dcb" style="border-radius:12px;background:#763dcb"><a href="${safeLink}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px">Reset password</a></td></tr></table>
<p style="margin:0 0 6px;font-size:13px;color:#666">Button not working? Copy this address into your browser:</p>
<p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="${safeLink}" style="color:#763dcb">${safeLink}</a></p>
<div style="background:#fff7e6;border-left:4px solid #f5a524;padding:12px 14px;border-radius:8px;font-size:14px;color:#5a4300">
<strong>Did not ask for this?</strong> You can safely ignore this email: your password will stay the same. If it keeps happening, tell us on ${escapeHtml(config.contactPhone || '+91 93630 42019')}.</div>`;
  const text = `Hello ${String(name || 'there').trim().split(/\s+/)[0] || 'there'},\n\nWe received a request to reset your ${config.instituteName} password. Open this link to choose a new one (valid for ${minutes} minutes, one use):\n\n${link}\n\nIf you did not ask for this, ignore this email and your password stays the same.\n\n- ${config.instituteName} team`;
  return { subject: `Reset your ${config.instituteName} password`, html: brandedHtml(inner), text };
}
