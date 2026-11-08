import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildAllowedOrigins } from '../src/config/env.js';
import { app } from './helpers.js';

describe('allowed origins', () => {
  it('accepts APP_URL with and without www, plus extra origins', () => {
    expect(buildAllowedOrigins('https://www.globaledutech.co.in/').sort()).toEqual(['https://globaledutech.co.in', 'https://www.globaledutech.co.in']);
    expect(buildAllowedOrigins('https://globaledutech.co.in').sort()).toEqual(['https://globaledutech.co.in', 'https://www.globaledutech.co.in']);
    expect(buildAllowedOrigins('http://localhost:5173')).toEqual(['http://localhost:5173']);
    // APP_URL may list several addresses
    expect(buildAllowedOrigins('https://x.vercel.app,https://www.globaledutech.co.in').sort()).toContain('https://www.globaledutech.co.in');
    expect(buildAllowedOrigins('https://x.vercel.app,https://www.globaledutech.co.in')).toContain('https://x.vercel.app');
    expect(buildAllowedOrigins('https://a.example.com', 'https://b.vercel.app, not a url').sort()).toEqual(['https://a.example.com', 'https://b.vercel.app', 'https://www.a.example.com']);
  });

  it('blocks unknown origins and lets the app origin through', async () => {
    const bad = await request(app).post('/api/auth/login').set('Origin', 'https://evil.example').send({ email: 'a@b.co', password: 'x' });
    expect(bad.status).toBe(403);
    expect(bad.body.code).toBe('CORS_NOT_ALLOWED');
    const good = await request(app).post('/api/auth/login').set('Origin', 'http://localhost:5173').send({ email: 'a@b.co', password: 'x' });
    expect(good.status).not.toBe(403);
  });
});
