import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt', 'en'],
  defaultLocale: 'pt',
  localePrefix: 'always',
  // hreflang comes from each page's metadata (pt-BR, en, x-default → /pt). The automatic Link
  // header would add a second, conflicting set ("pt", and x-default pointing to a redirect).
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
