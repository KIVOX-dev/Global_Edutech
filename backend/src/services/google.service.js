import { OAuth2Client } from 'google-auth-library';
import config from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

let client;

/**
 * Verifies a Google Sign-In ID token (signature, expiry, issuer and that it was issued for OUR client id).
 * Returns the facts we rely on; never trusts anything sent by the browser except the signed token itself.
 */
export async function verifyGoogleIdToken(credential) {
  if (!config.services.google) throw ApiError.unavailable('Google sign-in is not configured');
  client ??= new OAuth2Client(config.google.clientId);
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: config.google.clientId });
    const p = ticket.getPayload();
    return { email: String(p.email || '').toLowerCase(), emailVerified: p.email_verified === true, sub: p.sub, name: p.name };
  } catch {
    throw ApiError.unauthorized('Google sign-in failed. Please try again.');
  }
}
