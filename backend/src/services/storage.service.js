import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const ALLOWED_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

let client;
function s3() {
  if (!config.services.b2) throw ApiError.unavailable('Backblaze B2 storage is not configured');
  if (!client) {
    client = new S3Client({
      region: config.b2.region,
      endpoint: config.b2.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: config.b2.keyId, secretAccessKey: config.b2.appKey },
      // Newer SDK versions add CRC32 checksums by default, which B2 presigned PUTs reject
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return client;
}

export const isStorageConfigured = () => config.services.b2;

export function validateUpload(contentType, size) {
  if (!ALLOWED_TYPES[contentType]) throw ApiError.badRequest('Only JPG, PNG or PDF files are allowed');
  if (!Number.isFinite(size) || size <= 0) throw ApiError.badRequest('File size is required');
  if (size > MAX_FILE_SIZE) throw ApiError.badRequest('File is larger than 5 MB');
}

// Presigned PUT; the browser must send the same Content-Type header
export async function getUploadUrl(key, contentType, maxSize = MAX_FILE_SIZE, expiresIn = 300) {
  validateUpload(contentType, maxSize);
  const url = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: config.b2.bucket, Key: key, ContentType: contentType }), { expiresIn });
  return { url, key, method: 'PUT', headers: { 'Content-Type': contentType }, expiresIn };
}

export async function getDownloadUrl(key, expiresIn = 300, filename) {
  const cmd = new GetObjectCommand({
    Bucket: config.b2.bucket,
    Key: key,
    ...(filename ? { ResponseContentDisposition: `inline; filename="${String(filename).replace(/[^\w.\- ]/g, '_')}"` } : {}),
  });
  return getSignedUrl(s3(), cmd, { expiresIn });
}

export async function deleteObject(key) {
  await s3().send(new DeleteObjectCommand({ Bucket: config.b2.bucket, Key: key }));
}

// Returns { size, contentType } or null when the object does not exist
export async function headObject(key) {
  try {
    const r = await s3().send(new HeadObjectCommand({ Bucket: config.b2.bucket, Key: key }));
    return { size: r.ContentLength, contentType: r.ContentType };
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return null;
    throw err;
  }
}

// Server-side upload (receipts, CSV exports). Nothing is ever written to local disk.
export async function putObject(key, body, contentType) {
  await s3().send(new PutObjectCommand({ Bucket: config.b2.bucket, Key: key, Body: body, ContentType: contentType }));
  return key;
}
