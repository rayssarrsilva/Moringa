import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Canonical address plus hreflang links for both languages. `path` starts with "/" or is "". */
export function alternates(locale: Locale, path: string): Metadata['alternates'] {
  return {
    canonical: `/${locale}${path}`,
    languages: { 'pt-BR': `/pt${path}`, en: `/en${path}`, 'x-default': `/pt${path}` },
  };
}

export const ogLocale: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' };

/** Cuts text at a word boundary, for meta descriptions. */
export function truncate(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:]$/, '')}…`;
}
