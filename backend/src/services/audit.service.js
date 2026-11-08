import { AuditLog } from '../models/System.js';
import logger from '../config/logger.js';

const plain = (v) => (v && typeof v.toObject === 'function' ? v.toObject() : v);

// Strip secrets before persisting a snapshot
function scrub(v) {
  const o = plain(v);
  if (!o || typeof o !== 'object') return o;
  const copy = JSON.parse(JSON.stringify(o));
  for (const k of ['passwordHash', 'sessions', 'resetTokenHash', 'resetTokenExpires', 'failedLogins', 'lockUntil']) delete copy[k];
  return copy;
}

// Never throws: auditing must not break the business operation
export async function audit(req, { action, entity, entityId, before, after }) {
  try {
    await AuditLog.create({
      actor: req?.user?._id,
      actorName: req?.user?.name,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      before: scrub(before),
      after: scrub(after),
      ip: req?.ip,
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to write audit log');
  }
}
