// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { guardPost, isSameOrigin } from './guard';

vi.mock('../../db', () => ({ db: () => ({}), schema: {} }));

const post = (headers: Record<string, string>) =>
  new Request('https://moringa.example/api/orders/lookup', {
    method: 'POST',
    headers: { host: 'moringa.example', ...headers },
  });

describe('isSameOrigin', () => {
  it('accepts a write from the site itself', () => {
    expect(isSameOrigin(post({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
    expect(isSameOrigin(post({ origin: 'https://moringa.example' }))).toBe(true);
  });

  it('refuses a write a browser sends from another site', () => {
    expect(isSameOrigin(post({ 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(isSameOrigin(post({ 'sec-fetch-site': 'same-site' }))).toBe(false);
    expect(isSameOrigin(post({ origin: 'https://evil.example' }))).toBe(false);
    expect(isSameOrigin(post({ origin: 'null' }))).toBe(false);
  });
});

describe('guardPost', () => {
  it('answers 403 to another site, before counting anything', async () => {
    const response = await guardPost(post({ origin: 'https://evil.example' }));
    expect(response?.status).toBe(403);
  });

  it('answers 429 with Retry-After once the guest lookup limit is reached', async () => {
    const from = { 'sec-fetch-site': 'same-origin', 'x-real-ip': '198.51.100.23' };
    for (let i = 0; i < 10; i++) expect(await guardPost(post(from), 'lookup')).toBeNull();
    const blocked = await guardPost(post(from), 'lookup');
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await blocked?.json()).toEqual({ error: 'rate_limited' });
  });
});
