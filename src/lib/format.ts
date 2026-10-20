import type { Locale } from '@/i18n/routing';

const intlLocale: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US' };

/** Formats an amount in cents as Brazilian reais, in the reader's language. */
export function formatPrice(cents: number, locale: Locale): string {
  if (!Number.isInteger(cents)) throw new TypeError('Price must be an integer number of cents');
  return new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
