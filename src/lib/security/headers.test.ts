import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, createNonce } from './headers';

describe('contentSecurityPolicy', () => {
  it('only runs scripts with the nonce, and never eval or inline code in production', () => {
    const csp = contentSecurityPolicy('abc', false);
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).toContain("style-src 'self' 'nonce-abc';");
  });

  it('allows eval only in development, for React’s error overlay', () => {
    expect(contentSecurityPolicy('abc', true)).toContain("'unsafe-eval'");
  });
});

describe('createNonce', () => {
  it('is 128 random bits, different every time', () => {
    const nonces = new Set(Array.from({ length: 100 }, createNonce));
    expect(nonces.size).toBe(100);
    for (const n of nonces) expect(atob(n)).toHaveLength(16);
  });
});
