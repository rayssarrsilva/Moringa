import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { MakerAvatar } from '@/components/maker-avatar';
import { PieceCard } from '@/components/piece-card';
import type { Locale } from '@/i18n/routing';
import { catalog } from '@/lib/catalog';
import { sampleRepository } from '@/lib/catalog/sample-repository';
import { formatPrice } from '@/lib/format';
import { stateNames } from '@/lib/regions';
import { alternates, ogLocale, siteUrl, truncate } from '@/lib/seo';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const shops = await catalog()
    .listShops()
    .catch(() => sampleRepository.listShops());
  return shops.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const shop = await catalog().getShop(slug);
  if (!shop) return {};
  const t = await getTranslations({ locale, namespace: 'Shops' });
  const description = truncate(
    t('shopDescription', {
      craft: shop.craft[locale],
      city: shop.city,
      state: shop.state,
      story: shop.story[locale],
    }),
  );
  return {
    title: shop.name,
    description,
    alternates: alternates(locale, `/lojas/${slug}`),
    openGraph: { title: shop.name, description, locale: ogLocale[locale], siteName: 'Moringa' },
  };
}

export default async function ShopPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const shop = await catalog().getShop(slug);
  if (!shop) notFound();
  const [t, tr] = await Promise.all([getTranslations('Shops'), getTranslations('Regions')]);

  return (
    <div className="container-page grid gap-12 pb-16 pt-6 md:pt-10">
      <Breadcrumbs
        locale={locale}
        items={[{ label: t('title'), href: '/lojas' }, { label: shop.name }]}
      />

      <header className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center md:gap-10">
        <MakerAvatar name={shop.name} region={shop.region} size="lg" />
        <div className="grid gap-3">
          <p className="text-caps text-text-secondary">
            {shop.craft[locale]} · {shop.city}, {stateNames[shop.state]} · {tr(shop.region)}
          </p>
          <h1 className="text-heading-md md:text-display">{shop.name}</h1>
          {shop.quote && (
            <blockquote className="max-w-[48ch] text-xl">“{shop.quote[locale]}”</blockquote>
          )}
        </div>
      </header>

      <section aria-labelledby="story-title" className="grid max-w-[68ch] gap-2">
        <h2 id="story-title" className="text-heading-sm">
          {t('story')}
        </h2>
        <p className="text-lg">{shop.story[locale]}</p>
      </section>

      <section aria-labelledby="pieces-title" className="grid gap-6">
        <h2 id="pieces-title" className="text-heading-sm">
          {t('piecesTitle', { name: shop.name })}
        </h2>
        {shop.pieces.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {shop.pieces.map((p) => (
              <li key={p.slug}>
                <PieceCard
                  slug={p.slug}
                  name={p.name[locale]}
                  maker={p.shop.name}
                  place={`${p.shop.city}, ${p.shop.state}`}
                  price={formatPrice(p.priceCents, locale)}
                  material={p.material}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary">{t('empty', { name: shop.name })}</p>
        )}
      </section>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: shop.name,
          jobTitle: shop.craft[locale],
          description: shop.story[locale],
          url: `${siteUrl()}/${locale}/lojas/${shop.slug}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: shop.city,
            addressRegion: shop.state,
            addressCountry: 'BR',
          },
        }}
      />
    </div>
  );
}
