/**
 * Lighthouse CI: runs on every pull request against a production build.
 * Accessibility and SEO are hard gates; performance and best practices too, with a small margin
 * because shared CI machines are slower and noisier than a real phone on 4G.
 */
module.exports = {
  ci: {
    collect: {
      // The canonical and hreflang URLs must match the address Lighthouse visits.
      startServerCommand: 'NEXT_PUBLIC_SITE_URL=http://localhost:3300 npm run start -- -p 3300',
      startServerReadyPattern: 'Ready',
      url: [
        'http://localhost:3300/pt',
        'http://localhost:3300/pt/pecas',
        'http://localhost:3300/pt/pecas/moringa-de-barro-com-tampa',
        'http://localhost:3300/en/lojas/ceramica-da-lucia',
      ],
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 1, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 1, aggregationMethod: 'median-run' }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
