import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('OAuth 2.0 Integration & Dev Simulation Tests', () => {
  describe('GET /api/v1/auth/oauth/:provider/url', () => {
    it('returns a simulated callback URL for Google when client ID is unconfigured', async () => {
      const res = await request(app).get('/api/v1/auth/oauth/google/url');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSimulation).toBe(true);
      expect(res.body.data.url).toContain('/oauth/callback');
      expect(res.body.data.url).toContain('provider=google');
      expect(res.body.data.url).toContain('dev-simulated-google');
    });

    it('returns a simulated callback URL for GitHub when client ID is unconfigured', async () => {
      const res = await request(app).get('/api/v1/auth/oauth/github/url');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isSimulation).toBe(true);
      expect(res.body.data.url).toContain('/oauth/callback');
      expect(res.body.data.url).toContain('provider=github');
      expect(res.body.data.url).toContain('dev-simulated-github');
    });

    it('returns 400 Bad Request for unsupported OAuth provider', async () => {
      const res = await request(app).get('/api/v1/auth/oauth/facebook/url');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Unsupported OAuth provider');
    });
  });

  describe('GET /api/v1/auth/oauth/:provider (Direct Redirect)', () => {
    it('redirects user to the simulated callback URL for Google', async () => {
      const res = await request(app).get('/api/v1/auth/oauth/google');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/oauth/callback');
      expect(res.headers.location).toContain('provider=google');
      expect(res.headers.location).toContain('code=dev-simulated-google');
    });

    it('redirects user to the simulated callback URL for GitHub', async () => {
      const res = await request(app).get('/api/v1/auth/oauth/github');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/oauth/callback');
      expect(res.headers.location).toContain('provider=github');
      expect(res.headers.location).toContain('code=dev-simulated-github');
    });
  });

  describe('POST /api/v1/auth/oauth/callback', () => {
    it('authenticates Google OAuth user with dev fallback store, setting refresh cookie and returning access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/oauth/callback')
        .send({
          provider: 'google',
          code: 'dev-simulated-google-123456789',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('google.user@supportpilot.io');
      expect(res.body.data.user.fullName).toBe('Google Demo User');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=');
    });

    it('authenticates GitHub OAuth user with dev fallback store, setting refresh cookie and returning access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/oauth/callback')
        .send({
          provider: 'github',
          code: 'dev-simulated-github-123456789',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('github.developer@supportpilot.io');
      expect(res.body.data.user.fullName).toBe('GitHub Demo Developer');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=');
    });

    it('rejects request with missing provider', async () => {
      const res = await request(app)
        .post('/api/v1/auth/oauth/callback')
        .send({
          code: 'some-code',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('provider is required');
    });

    it('rejects request with missing code', async () => {
      const res = await request(app)
        .post('/api/v1/auth/oauth/callback')
        .send({
          provider: 'google',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('code is required');
    });

    it('rejects request with unsupported provider', async () => {
      const res = await request(app)
        .post('/api/v1/auth/oauth/callback')
        .send({
          provider: 'twitter',
          code: 'some-code',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain("Unsupported OAuth provider 'twitter'");
    });
  });
});
