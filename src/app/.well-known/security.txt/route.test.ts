import { describe, expect, it } from 'vitest';
import { GET, securityTxtExpires } from './route';

describe('security.txt (RFC 9116)', () => {
  it('has the required fields', async () => {
    const text = await GET().text();
    expect(text).toMatch(/^Contact: https:\/\//m);
    expect(text).toMatch(/^Expires: /m);
    expect(text).toMatch(/^Canonical: .*\/\.well-known\/security\.txt$/m);
  });

  it('expires in the future, and less than a year from now (a reminder to renew it)', () => {
    const days = (Date.parse(securityTxtExpires) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(366);
  });
});
