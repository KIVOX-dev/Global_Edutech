import crypto from 'node:crypto';
import { z } from 'zod';
import Student from '../models/Student.js';
import StaffProfile from '../models/StaffProfile.js';
import User from '../models/User.js';
import { Batch } from '../models/Course.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/http.js';
import { objectId, reqText } from '../validators/common.js';
import * as storage from '../services/storage.service.js';
import { audit } from '../services/audit.service.js';

const ID = '([a-f0-9]{24})';
const KEY_PATTERNS = [
  { type: 'STUDENT_PHOTO', re: new RegExp(`^students/${ID}/photo$`) },
  { type: 'STUDENT_DOC', re: new RegExp(`^students/${ID}/docs/[0-9a-f-]{36}$`) },
  { type: 'STAFF_DOC', re: new RegExp(`^staff/${ID}/docs/[0-9a-f-]{36}$`) },
  { type: 'STAFF_AVATAR', re: new RegExp(`^staff/${ID}/avatar$`) },
  { type: 'RECEIPT', re: new RegExp(`^receipts/${ID}\\.pdf$`) },
  { type: 'EXPORT', re: /^exports\/\d{4}-\d{2}-\d{2}\/[\w.-]+\.csv$/ },
];

export function parseKey(key) {
  for (const { type, re } of KEY_PATTERNS) {
    const m = re.exec(key);
    if (m) return { type, ownerId: m[1], key };
  }
  throw ApiError.badRequest('Invalid file key');
}

export const schemas = {
  upload: z.object({
    purpose: z.enum(['STUDENT_PHOTO', 'STUDENT_DOC', 'STAFF_DOC', 'STAFF_AVATAR']),
    ownerId: objectId,
    fileName: reqText(160),
    contentType: z.string().max(60),
    size: z.coerce.number().int().positive(),
  }),
  confirm: z.object({ key: z.string().max(300), fileName: reqText(160).optional() }),
  key: z.object({ key: z.string().max(300) }),
};

async function staffCanSeeStudent(user, studentId) {
  const student = await Student.findById(studentId).select('batch');
  if (!student?.batch) return false;
  return !!(await Batch.exists({ _id: student.batch, staff: user._id }));
}

// Per-owner authorization. Admins can do everything; staff only touch their own staff files and read their students' files.
async function authorizeKey(user, parsed, action) {
  if (user.role === 'ADMIN') return;
  const { type, ownerId } = parsed;
  if ((type === 'STAFF_DOC' || type === 'STAFF_AVATAR') && ownerId === String(user._id)) return;
  if ((type === 'STUDENT_PHOTO' || type === 'STUDENT_DOC') && action === 'read' && await staffCanSeeStudent(user, ownerId)) return;
  throw ApiError.forbidden();
}

export const uploadUrl = asyncHandler(async (req, res) => {
  const { purpose, ownerId, fileName, contentType, size } = req.body;
  if (purpose === 'STUDENT_PHOTO' && contentType === 'application/pdf') throw ApiError.badRequest('Photo must be a JPG or PNG');
  storage.validateUpload(contentType, size);

  const id = crypto.randomUUID();
  const key = {
    STUDENT_PHOTO: `students/${ownerId}/photo`,
    STUDENT_DOC: `students/${ownerId}/docs/${id}`,
    STAFF_DOC: `staff/${ownerId}/docs/${id}`,
    STAFF_AVATAR: `staff/${ownerId}/avatar`,
  }[purpose];

  await authorizeKey(req.user, parseKey(key), 'write');
  const owner = purpose.startsWith('STUDENT') ? await Student.exists({ _id: ownerId }) : await User.exists({ _id: ownerId, role: 'STAFF' });
  if (!owner) throw ApiError.notFound('Owner record not found');

  const signed = await storage.getUploadUrl(key, contentType, size);
  ok(res, { ...signed, maxSize: storage.MAX_FILE_SIZE, fileName });
});

export const confirm = asyncHandler(async (req, res) => {
  const parsed = parseKey(req.body.key);
  if (!['STUDENT_PHOTO', 'STUDENT_DOC', 'STAFF_DOC', 'STAFF_AVATAR'].includes(parsed.type)) throw ApiError.badRequest('This key cannot be confirmed');
  await authorizeKey(req.user, parsed, 'write');

  const head = await storage.headObject(parsed.key);
  if (!head) throw ApiError.badRequest('File was not uploaded');
  if (!storage.ALLOWED_TYPES[head.contentType] || head.size > storage.MAX_FILE_SIZE) {
    await storage.deleteObject(parsed.key).catch(() => {});
    throw ApiError.badRequest('Uploaded file has an invalid type or is larger than 5 MB; it was removed');
  }
  const doc = { key: parsed.key, name: req.body.fileName || parsed.key.split('/').pop(), contentType: head.contentType, size: head.size, uploadedAt: new Date() };

  if (parsed.type === 'STUDENT_PHOTO') {
    await Student.updateOne({ _id: parsed.ownerId }, { photoKey: parsed.key });
  } else if (parsed.type === 'STUDENT_DOC') {
    await Student.updateOne({ _id: parsed.ownerId, 'documents.key': { $ne: parsed.key } }, { $push: { documents: doc } });
  } else if (parsed.type === 'STAFF_DOC') {
    await StaffProfile.updateOne({ user: parsed.ownerId, 'documents.key': { $ne: parsed.key } }, { $push: { documents: doc } });
  } else {
    await User.updateOne({ _id: parsed.ownerId }, { avatarKey: parsed.key });
  }
  await audit(req, { action: 'FILE_UPLOAD', entity: parsed.type, entityId: parsed.ownerId, after: { key: parsed.key } });
  ok(res, doc);
});

// The key must be recorded on its owner record, so guessed or stale keys are never signed
async function isRecorded(parsed) {
  const { type, ownerId, key } = parsed;
  if (type === 'STUDENT_PHOTO') return !!(await Student.exists({ _id: ownerId, photoKey: key }));
  if (type === 'STUDENT_DOC') return !!(await Student.exists({ _id: ownerId, 'documents.key': key }));
  if (type === 'STAFF_DOC') return !!(await StaffProfile.exists({ user: ownerId, 'documents.key': key }));
  if (type === 'STAFF_AVATAR') return !!(await User.exists({ _id: ownerId, avatarKey: key }));
  return true;
}

export const downloadUrl = asyncHandler(async (req, res) => {
  const parsed = parseKey(req.query.key);
  if (parsed.type === 'RECEIPT' || parsed.type === 'EXPORT') {
    if (req.user.role !== 'ADMIN') throw ApiError.forbidden();
  } else {
    await authorizeKey(req.user, parsed, 'read');
  }
  if (!(await isRecorded(parsed))) throw ApiError.notFound('File not found');
  ok(res, { url: await storage.getDownloadUrl(parsed.key, 300), expiresIn: 300 });
});

export const remove = asyncHandler(async (req, res) => {
  const key = req.body?.key || req.query?.key;
  const parsed = parseKey(key);
  if (!['STUDENT_PHOTO', 'STUDENT_DOC', 'STAFF_DOC', 'STAFF_AVATAR'].includes(parsed.type)) throw ApiError.badRequest('This file cannot be deleted here');
  await authorizeKey(req.user, parsed, 'write');

  if (parsed.type === 'STUDENT_PHOTO') await Student.updateOne({ _id: parsed.ownerId }, { $unset: { photoKey: 1 } });
  else if (parsed.type === 'STUDENT_DOC') await Student.updateOne({ _id: parsed.ownerId }, { $pull: { documents: { key } } });
  else if (parsed.type === 'STAFF_DOC') await StaffProfile.updateOne({ user: parsed.ownerId }, { $pull: { documents: { key } } });
  else await User.updateOne({ _id: parsed.ownerId }, { $unset: { avatarKey: 1 } });

  if (storage.isStorageConfigured()) await storage.deleteObject(key).catch(() => {});
  await audit(req, { action: 'FILE_DELETE', entity: parsed.type, entityId: parsed.ownerId, before: { key } });
  ok(res, { deleted: true });
});
