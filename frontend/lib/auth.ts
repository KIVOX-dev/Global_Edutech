import * as jose from 'jose';

// Only verifies the admin cookie issued by the backend (used by middleware.ts).
// JWT_SECRET must match the backend's value.
const isDev = process.env.NODE_ENV !== 'production';
const secret = process.env.JWT_SECRET || (isDev ? 'dev-only-insecure-secret' : '');

export async function verifyToken(token: string) {
  if (!secret) return null;
  try {
    const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
    return payload;
  } catch {
    return null;
  }
}
