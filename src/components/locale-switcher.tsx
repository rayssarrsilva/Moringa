'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const labels = { pt: { short: 'PT', name: 'Português' }, en: { short: 'EN', name: 'English' } };

export function LocaleSwitcher() {
  const t = useTranslations('Header');
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t('language')}>
      <ul className="flex items-center sm:gap-1">
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              lang={locale === 'pt' ? 'pt-BR' : 'en'}
              hrefLang={locale === 'pt' ? 'pt-BR' : 'en'}
              aria-current={locale === current ? 'true' : undefined}
              className="text-label inline-flex min-h-10 min-w-9 items-center sm:min-h-11 sm:min-w-11 justify-center rounded-pill px-2 text-text-secondary hover:text-text-primary aria-[current=true]:text-text-primary aria-[current=true]:underline aria-[current=true]:underline-offset-4"
            >
              <span aria-hidden="true">{labels[locale].short}</span>
              <span className="sr-only">{labels[locale].name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
