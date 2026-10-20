import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { siteUrl } from '@/lib/seo';
import { JsonLd } from './json-ld';

export interface Crumb {
  label: string;
  /** Path without the locale, e.g. "/pecas". The last crumb has none: it is the current page. */
  href?: string;
}

export function Breadcrumbs({ items, locale }: { items: Crumb[]; locale: string }) {
  const t = useTranslations('Piece');
  const all: Crumb[] = [{ label: t('home'), href: '/' }, ...items];

  return (
    <nav aria-label={t('breadcrumb')} className="text-sm text-text-secondary">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {all.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href ? (
              <Link href={c.href} className="underline underline-offset-4 hover:text-text-primary">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-text-primary">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: `${siteUrl()}/${locale}${c.href === '/' ? '' : c.href}` } : {}),
          })),
        }}
      />
    </nav>
  );
}
