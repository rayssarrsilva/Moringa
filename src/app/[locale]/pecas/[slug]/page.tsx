import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AddToBag } from '@/components/bag/add-to-bag';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { PieceDetails } from '@/components/piece-details';
import { PieceReviews } from '@/components/reviews/piece-reviews';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { PieceCard } from '@/components/piece-card';
import type { Locale } from '@/i18n/routing';
import { toBagPiece } from '@/lib/bag/bag';
import { catalog } from '@/lib/catalog';
import { favoriteOf } from '@/lib/favorites/store';
import { reviewsRepository } from '@/lib/reviews';
import { ratingSummary } from '@/lib/reviews/rules';
import { sampleRepository } from '@/lib/catalog/sample-repository';
import { formatPrice } from '@/lib/format';
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

  const [shop, reviews, t, tc, tm] = await Promise.all([
    catalog().getShop(piece.shop.slug),
    reviewsRepository().forPiece(piece.slug),
    getTranslations('Piece'),
    getTranslations('Catalog'),
    getTranslations('Materials'),
  ]);
  const more = shop?.pieces.filter((p) => p.slug !== piece.slug).slice(0, 4) ?? [];
  const url = `${siteUrl()}/${locale}/pecas/${piece.slug}`;

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-12 pb-16 pt-6 md:pt-10">
      <Breadcrumbs
        locale={locale}
        items={[{ label: tc('title'), href: '/pecas' }, { label: piece.name[locale] }]}
      />

      <PieceDetails
        piece={piece}
        shop={shop}
        locale={locale}
        action={
          <div className="grid gap-3">
            <AddToBag piece={toBagPiece(piece)} name={piece.name[locale]} />
            <FavoriteButton piece={favoriteOf(piece)} />
          </div>
        }
      />

      <PieceReviews reviews={reviews} locale={locale} />

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
          ...(reviews.length > 0 && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: ratingSummary(reviews.map((r) => r.rating)).average,
              reviewCount: reviews.length,
            },
            review: reviews.slice(0, 5).map((r) => ({
              '@type': 'Review',
              author: { '@type': 'Person', name: r.author },
              datePublished: r.createdAt.slice(0, 10),
              reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
              ...(r.comment && { reviewBody: r.comment }),
            })),
          }),
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
