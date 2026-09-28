import { describe, expect, it, afterEach } from 'vitest';
import { createTestApp } from '../helpers/app.js';
import { extractCsrf } from '../e2e/auth.test.js';

describe('csrf and open redirects', () => {
  let ctx;
  afterEach(async () => {
    if (ctx) await ctx.close();
  });

  it('rejects state-changing posts without a CSRF token', async () => {
    ctx = await createTestApp();
    const res = await ctx.request.post('/auth/login').type('form').send({
      username: 'alice',
      password: 'correct-horse-battery',
    });
    expect(res.status).toBe(403);
  });

  it('does not redirect to an external URL', async () => {
    ctx = await createTestApp();
    const { default: request } = await import('supertest');
    const agent = request.agent(ctx.app);
    const page = await agent.get('/auth/register');
    const csrf = extractCsrf(page.text);
    await agent.post('/auth/register').type('form').send({
      _csrf: csrf,
      username: 'bob',
      email: 'bob@example.test',
      password: 'correct-horse-battery',
      displayName: 'Bob',
    });
    const loginPage = await agent.get('/auth/login');
    const loginCsrf = extractCsrf(loginPage.text);
    const login = await agent.post('/auth/login').type('form').send({
      _csrf: loginCsrf,
      username: 'bob',
      password: 'correct-horse-battery',
      next: 'https://evil.example/phish',
    });
    expect(login.headers.location).toBe('/');
  });
});
