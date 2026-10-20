import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MakerAvatar } from '@/components/maker-avatar';
import { PieceCard } from '@/components/piece-card';
import { Button } from '@/components/ui/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { catalog } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { alternates } from '@/lib/seo';
import { regions } from '@/lib/regions';

type Props = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return { alternates: alternates(locale, '') };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [pieces, makers, t, tr] = await Promise.all([
    catalog().listPieces({ sort: 'new' }),
    catalog().listShops(),
    getTranslations('Home'),
    getTranslations('Regions'),
  ]);
  const spotlight = makers.find((m) => m.slug === 'ceramica-da-lucia') ?? makers[0];
  const states = new Set(makers.map((m) => m.state)).size;

  return (
    <>
      <section aria-labelledby="hero-title" className="container-page grid gap-6 pt-10 md:pt-16">
        <p className="text-caps text-action-secondary">{t('eyebrow')}</p>
        <h1 id="hero-title" className="text-heading-md max-w-[18ch] md:text-display">
          {t('title')}
        </h1>
        <p className="max-w-[52ch] text-lg text-text-secondary">
          {t('intro', { makers: makers.length, states })}
        </p>

        <form
          role="search"
          action={`/${locale}/pecas`}
          className="flex max-w-xl flex-wrap items-end gap-3"
        >
          <label className="grid flex-1 basis-64 gap-1.5">
            <span className="text-label">{t('searchLabel')}</span>
            <input
              type="search"
              name="q"
              placeholder={t('searchPlaceholder')}
              className="min-h-12 rounded-md border-[1.5px] border-border-control bg-bg-canvas px-4 placeholder:text-text-secondary"
            />
          </label>
          <Button type="submit" size="lg">
            {t('searchButton')}
          </Button>
        </form>

        <nav aria-label={t('regionsLabel')}>
          <ul className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <li key={r}>
                <Button asChild variant="ghost" size="sm">
                  <Link href={{ pathname: '/pecas', query: { regiao: r } }}>{tr(r)}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section aria-labelledby="new-title" className="container-page mt-16 grid gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="new-title" className="text-heading-sm">
            {t('newThisWeek')}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pecas">{t('seeAll')}</Link>
          </Button>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-5">
          {pieces.slice(0, 10).map((p) => (
            <li key={p.slug}>
              <PieceCard
                slug={p.slug}
                name={p.name[locale]}
                maker={p.shop.name}
                place={p.shop.state}
                price={formatPrice(p.priceCents, locale)}
                material={p.material}
              />
            </li>
          ))}
        </ul>
      </section>

      {spotlight && (
        <section
          aria-labelledby="maker-title"
          className="container-page mt-16 grid gap-4 rounded-xl bg-bg-surface p-6 md:grid-cols-[auto_1fr] md:items-center md:gap-8 md:p-10"
        >
          <MakerAvatar name={spotlight.name} region={spotlight.region} size="lg" />
          <div className="grid gap-3">
            <h2 id="maker-title" className="text-heading-sm">
              {t('makerTitle', { name: spotlight.name })}
            </h2>
            <p className="text-sm text-text-secondary">
              {spotlight.craft[locale]} · {spotlight.city}, {spotlight.state}
            </p>
            {spotlight.quote && (
              <blockquote className="max-w-[60ch] text-lg">“{spotlight.quote[locale]}”</blockquote>
            )}
            <div>
              <Button asChild variant="secondary">
                <Link href={`/lojas/${spotlight.slug}`}>{t('visitShop')}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
