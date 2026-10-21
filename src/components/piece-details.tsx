import { Badge } from '@rayssarrsilva/ipe';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { Piece, Shop } from '@/lib/catalog/types';
import { formatPrice } from '@/lib/format';
import { stateNames } from '@/lib/regions';
import { PiecePhoto } from './material-art';

/**
 * The body of a piece page. Shared by the public page and the maker's preview,
 * so the preview shows exactly what buyers will see.
 */
export async function PieceDetails({
  piece,
  shop,
  locale,
  action,
  shopHref = `/lojas/${piece.shop.slug}`,
}: {
  piece: Piece;
  shop: Shop | null;
  locale: Locale;
  /** What sits under the price: "Add to bag" on the public page, a note in the preview. */
  action: ReactNode;
  shopHref?: string;
}) {
  const [t, tm] = await Promise.all([getTranslations('Piece'), getTranslations('Materials')]);
  const place = `${piece.shop.city}, ${stateNames[piece.shop.state] ?? piece.shop.state}`;

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-2 md:gap-12">
      <PiecePhoto material={piece.material} className="md:sticky md:top-24" />

      <div className="grid content-start gap-6">
        <div className="grid gap-3">
          <h1 className="text-heading-md md:text-display">{piece.name[locale]}</h1>
          <p className="text-text-secondary">
            {t('madeBy')}{' '}
            <Link
              href={shopHref}
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

        {action}

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
              href={shopHref}
              className="text-label inline-flex min-h-11 items-center underline underline-offset-4"
            >
              {t('seeShop', { name: shop.name })} <span aria-hidden="true">&nbsp;→</span>
            </Link>
          </section>
        )}
      </div>
    </article>
  );
}
