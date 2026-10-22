import { expect, test } from '@playwright/test';

/** OWASP Secure Headers Project. The same checks the Mozilla Observatory runs on the live site. */
test.describe('security headers', () => {
  test('pages allow only scripts that carry this response’s nonce', async ({ request }) => {
    const first = await request.get('/pt');
    const second = await request.get('/pt');
    const csp = first.headers()['content-security-policy'] ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

    expect(nonce, 'the policy has a nonce').toBeTruthy();
    expect(second.headers()['content-security-policy']).not.toContain(nonce!);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain(`style-src 'self' 'nonce-${nonce}';`);

    // Every executable script on the page carries the nonce; JSON-LD is data and never runs.
    const html = await first.text();
    const scripts = [...html.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>/g)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const [tag] of scripts) expect(tag).toContain(`nonce="${nonce}"`);
  });

  test('sends the transport, framing and privacy headers everywhere', async ({ request }) => {
    for (const path of ['/pt', '/api/pieces', '/icon.svg']) {
      const headers = (await request.get(path)).headers();
      expect(headers['strict-transport-security'], path).toBe(
        'max-age=63072000; includeSubDomains; preload',
      );
      expect(headers['x-content-type-options'], path).toBe('nosniff');
      expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
      expect(headers['x-frame-options'], path).toBe('DENY');
      expect(headers['permissions-policy'], path).toContain('camera=()');
      expect(headers['cross-origin-opener-policy'], path).toBe('same-origin');
      expect(headers['x-powered-by'], path).toBeUndefined();
    }
  });

  test('API responses can never run as a page', async ({ request }) => {
    const headers = (await request.get('/api/pieces')).headers();
    expect(headers['content-security-policy']).toBe(
      "default-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'",
    );
  });

  test('the browser reports no policy violation while using the site', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (m) => {
      if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
    });
    for (const path of [
      '/pt',
      '/pt/pecas/moringa-de-barro-com-tampa',
      '/en/lojas/ceramica-da-lucia',
    ]) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    // React hydrated under the policy: the theme toggle answers a click.
    await page.goto('/pt');
    await page.getByRole('button', { name: 'Ativar tema escuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(violations).toEqual([]);
  });
});
