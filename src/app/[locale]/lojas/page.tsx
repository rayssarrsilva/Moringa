import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { MakerAvatar } from '@/components/maker-avatar';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { catalog } from '@/lib/catalog';
import { alternates } from '@/lib/seo';

type Props = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Shops' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: alternates(locale, '/lojas'),
  };
}

export default async function ShopsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [shops, t, tr] = await Promise.all([
    catalog().listShops(),
    getTranslations('Shops'),
    getTranslations('Regions'),
  ]);

  return (
    <div className="container-page grid gap-8 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs locale={locale} items={[{ label: t('title') }]} />
        <h1 className="text-heading-md md:text-display">{t('title')}</h1>
        <p className="max-w-[60ch] text-lg text-text-secondary">{t('description')}</p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {shops.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/lojas/${s.slug}`}
              className="group grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl border-[1.5px] border-border-subtle p-5 hover:border-text-primary"
            >
              <MakerAvatar name={s.name} region={s.region} />
              <span className="grid gap-1">
                <span className="text-heading-sm underline-offset-4 group-hover:underline">
                  {s.name}
                </span>
                <span className="text-sm text-text-secondary">
                  {s.craft[locale]} · {s.city}, {s.state} · {tr(s.region)}
                </span>
                <span className="text-label text-sm">
                  {t('pieceCount', { count: s.pieceCount })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
