import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AddToBag } from '@/components/bag/add-to-bag';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { PiecePhoto } from '@/components/material-art';
import { PieceCard } from '@/components/piece-card';
import { Badge } from '@rayssarrsilva/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { toBagPiece } from '@/lib/bag/bag';
import { catalog } from '@/lib/catalog';
import { sampleRepository } from '@/lib/catalog/sample-repository';
import { formatPrice } from '@/lib/format';
import { stateNames } from '@/lib/regions';
import { alternates, ogLocale, siteUrl, truncate } from '@/lib/seo';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

/** Pages are rebuilt at most every 5 minutes, so stock and prices stay fresh. */
export const revalidate = 300;

export async function generateStaticParams() {
  const pieces = await catalog()
    .listPieces({ sort: 'new' })
    .catch(() => sampleRepository.listPieces({ sort: 'new' }));
  return pieces.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const piece = await catalog().getPiece(slug);
  if (!piece) return {};
  const title = `${piece.name[locale]} · ${piece.shop.name}`;
  const description = truncate(piece.description[locale]);
  return {
    title,
    description,
    alternates: alternates(locale, `/pecas/${slug}`),
    openGraph: {
      title,
      description,
      locale: ogLocale[locale],
      siteName: 'Moringa',
      type: 'website',
    },
    other: {
      'product:price:amount': String(piece.priceCents / 100),
      'product:price:currency': 'BRL',
    },
  };
}

export default async function PiecePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const piece = await catalog().getPiece(slug);
  if (!piece) notFound();

  const [shop, t, tc, tm] = await Promise.all([
    catalog().getShop(piece.shop.slug),
    getTranslations('Piece'),
    getTranslations('Catalog'),
    getTranslations('Materials'),
  ]);
  const more = shop?.pieces.filter((p) => p.slug !== piece.slug).slice(0, 4) ?? [];
  const place = `${piece.shop.city}, ${stateNames[piece.shop.state] ?? piece.shop.state}`;
  const url = `${siteUrl()}/${locale}/pecas/${piece.slug}`;

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-12 pb-16 pt-6 md:pt-10">
      <Breadcrumbs
        locale={locale}
        items={[{ label: tc('title'), href: '/pecas' }, { label: piece.name[locale] }]}
      />

      <article className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-2 md:gap-12">
        <PiecePhoto material={piece.material} className="md:sticky md:top-24" />

        <div className="grid content-start gap-6">
          <div className="grid gap-3">
            <h1 className="text-heading-md md:text-display">{piece.name[locale]}</h1>
            <p className="text-text-secondary">
              {t('madeBy')}{' '}
              <Link
                href={`/lojas/${piece.shop.slug}`}
                className="text-label text-text-primary underline underline-offset-4"
              >
                {piece.shop.name}
              </Link>{' '}
              · {place}
            </p>
          </div>

          <div className="grid gap-2">
            <p className="text-heading-md">{formatPrice(piece.priceCents, locale)}</p>
            <p className="text-sm text-text-secondary">
              {t('shipping', { price: formatPrice(piece.shippingCents, locale) })}
            </p>
            <div>
              <Badge
                dot
                tone={piece.stock === 0 ? 'neutral' : piece.stock === 1 ? 'accent' : 'success'}
              >
                {t('stock', { count: piece.stock })}
              </Badge>
            </div>
          </div>

          <AddToBag piece={toBagPiece(piece)} name={piece.name[locale]} />

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-border-subtle py-4 text-sm">
            <dt className="text-text-secondary">{t('material')}</dt>
            <dd>{tm(piece.material)}</dd>
            <dt className="text-text-secondary">{t('origin')}</dt>
            <dd>{place}</dd>
          </dl>

          <section aria-labelledby="details-title" className="grid gap-2">
            <h2 id="details-title" className="text-heading-sm">
              {t('details')}
            </h2>
            <p className="max-w-[60ch] text-lg">{piece.description[locale]}</p>
          </section>

          {shop && (
            <section
              aria-labelledby="maker-title"
              className="grid gap-3 rounded-xl bg-bg-surface p-6"
            >
              <h2 id="maker-title" className="text-caps text-text-secondary">
                {t('aboutMaker')}
              </h2>
              <p className="text-heading-sm">
                {shop.name} · {shop.craft[locale]}
              </p>
              <p className="text-text-secondary">{shop.story[locale]}</p>
              {shop.quote && <blockquote className="text-lg">“{shop.quote[locale]}”</blockquote>}
              <Link
                href={`/lojas/${shop.slug}`}
                className="text-label inline-flex min-h-11 items-center underline underline-offset-4"
              >
                {t('seeShop', { name: shop.name })} <span aria-hidden="true">&nbsp;→</span>
              </Link>
            </section>
          )}
        </div>
      </article>

      {more.length > 0 && (
        <section aria-labelledby="more-title" className="grid gap-6">
          <h2 id="more-title" className="text-heading-sm">
            {t('moreFrom', { name: piece.shop.name })}
          </h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {more.map((p) => (
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
        </section>
      )}

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: piece.name[locale],
          description: piece.description[locale],
          url,
          image: `${url}/opengraph-image`,
          material: tm(piece.material),
          brand: { '@type': 'Brand', name: piece.shop.name },
          offers: {
            '@type': 'Offer',
            url,
            price: (piece.priceCents / 100).toFixed(2),
            priceCurrency: 'BRL',
            availability:
              piece.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Person', name: piece.shop.name },
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: (piece.shippingCents / 100).toFixed(2),
                currency: 'BRL',
              },
              shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BR' },
            },
          },
        }}
      />
    </div>
  );
}
