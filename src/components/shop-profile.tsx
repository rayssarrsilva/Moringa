import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import type { Piece, Shop } from '@/lib/catalog/types';
import { formatPrice } from '@/lib/format';
import { stateNames } from '@/lib/regions';
import { MakerAvatar } from './maker-avatar';
import { PieceCard } from './piece-card';

/** A maker's page body. Shared by the public shop page and the maker's preview. */
export async function ShopProfile({
  shop,
  pieces,
  locale,
  pieceHref,
  empty,
}: {
  shop: Shop;
  pieces: Piece[];
  locale: Locale;
  /** Where each piece links to. Public pages link to the catalog; the preview to the maker's area. */
  pieceHref?: (slug: string) => string;
  empty?: ReactNode;
}) {
  const [t, tr] = await Promise.all([getTranslations('Shops'), getTranslations('Regions')]);

  return (
    <>
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
        {pieces.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {pieces.map((p) => (
              <li key={p.slug}>
                <PieceCard
                  slug={p.slug}
                  href={pieceHref?.(p.slug)}
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
          (empty ?? <p className="text-text-secondary">{t('empty', { name: shop.name })}</p>)
        )}
      </section>
    </>
  );
}
