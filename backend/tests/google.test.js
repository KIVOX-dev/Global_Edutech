import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';

const cred = (name) => `${name}-`.padEnd(140, 'x');
const tokens = {
  [cred('admin')]: { email: 'owner@t.co', emailVerified: true, sub: 'sub-owner' },
  [cred('staff')]: { email: 'staff@t.co', emailVerified: true, sub: 'sub-staff' },
  [cred('unknown')]: { email: 'stranger@gmail.com', emailVerified: true, sub: 'sub-x' },
  [cred('unverified')]: { email: 'owner@t.co', emailVerified: false, sub: 'sub-owner' },
  [cred('othersub')]: { email: 'staff@t.co', emailVerified: true, sub: 'someone-else' },
  [cred('inactive')]: { email: 'gone@t.co', emailVerified: true, sub: 'sub-gone' },
};

// Stand-in for Google: the real service verifies the signed token with Google's public keys
vi.mock('../src/services/google.service.js', async () => {
  const { ApiError } = await import('../src/utils/ApiError.js');
  return {
    verifyGoogleIdToken: async (credential) => {
      const t = tokens[credential];
      if (!t) throw ApiError.unauthorized('Google sign-in failed. Please try again.');
      return t;
    },
  };
});

const { app, startDb, stopDb, resetDb, makeUser } = await import('./helpers.js');
const User = (await import('../src/models/User.js')).default;

beforeAll(startDb);
afterAll(stopDb);

describe('Sign in with Google', () => {
  beforeEach(async () => {
    await resetDb();
    await makeUser('ADMIN', 'owner@t.co');
    await makeUser('STAFF', 'staff@t.co', { mustChangePassword: true });
    await makeUser('STAFF', 'gone@t.co', { isActive: false });
  });

  it('exposes no Google client id until one is configured', async () => {
    const res = await request(app).get('/api/auth/config');
    expect(res.status).toBe(200);
    expect(res.body.data.googleClientId).toBeNull();
  });

  it('signs in a registered user, sets the session cookies and links the Google account', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: cred('admin') });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: 'owner@t.co', role: 'ADMIN' });
    expect(res.headers['set-cookie'].join(';')).toMatch(/access_token=/);
    const me = await request(app).get('/api/auth/me').set('Cookie', res.headers['set-cookie']);
    expect(me.status).toBe(200);
    expect((await User.findOne({ email: 'owner@t.co' })).googleSub).toBe('sub-owner');
  });

  it('clears the temporary-password requirement for staff who sign in with Google', async () => {
    const res = await request(app).post('/api/auth/google').send({ credential: cred('staff') });
    expect(res.status).toBe(200);
    expect(res.body.data.user.mustChangePassword).toBe(false);
  });

  it('never creates accounts: unregistered, unverified, deactivated and mismatched Google accounts are refused', async () => {
    const unknown = await request(app).post('/api/auth/google').send({ credential: cred('unknown') });
    expect(unknown.status).toBe(403);
    expect(unknown.body.code).toBe('GOOGLE_NOT_REGISTERED');
    expect(await User.countDocuments({ email: 'stranger@gmail.com' })).toBe(0);

    expect((await request(app).post('/api/auth/google').send({ credential: cred('unverified') })).status).toBe(401);
    expect((await request(app).post('/api/auth/google').send({ credential: cred('inactive') })).status).toBe(403);

    await request(app).post('/api/auth/google').send({ credential: cred('staff') }); // links sub-staff
    const other = await request(app).post('/api/auth/google').send({ credential: cred('othersub') });
    expect(other.status).toBe(403);
    expect(other.body.code).toBe('GOOGLE_MISMATCH');
  });

  it('rejects forged or malformed tokens', async () => {
    expect((await request(app).post('/api/auth/google').send({ credential: 'forged'.padEnd(150, 'z') })).status).toBe(401);
    expect((await request(app).post('/api/auth/google').send({ credential: 'short' })).status).toBe(400);
    expect((await request(app).post('/api/auth/google').send({})).status).toBe(400);
  });
});
