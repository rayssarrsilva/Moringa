'use client';

import { Badge, Button } from '@rayssarrsilva/ipe';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { PiecePhoto } from '@/components/material-art';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { useHydrated } from '@/lib/bag/store';
import type { Piece } from '@/lib/catalog/types';
import { useFavorites } from '@/lib/favorites/store';
import { formatPrice } from '@/lib/format';

const fetchAvailable = (slugs: string[]) =>
  fetch(`/api/pieces?slugs=${slugs.map(encodeURIComponent).join(',')}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((body: { pieces: Piece[] }) => body.pieces);

/**
 * Shows the saved snapshot right away, then checks the current price and availability.
 * A piece that was paused or sold out stays in the list as "Unavailable" (US-15).
 */
export function FavoritesList() {
  const t = useTranslations('Favorites');
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const items = useFavorites((s) => s.items);
  const remove = useFavorites((s) => s.remove);
  const slugs = items.map((i) => i.slug);

  const { data: live, isSuccess } = useQuery({
    queryKey: ['favorites', 'availability', slugs],
    queryFn: () => fetchAvailable(slugs),
    enabled: hydrated && slugs.length > 0,
  });

  if (!hydrated) return <p className="text-text-secondary">{t('loading')}</p>;

  if (items.length === 0) {
    return (
      <div className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-border-subtle p-6 md:p-10">
        <p className="text-heading-sm">{t('empty')}</p>
        <p className="text-text-secondary">{t('emptyBody')}</p>
        <Button asChild>
          <Link href="/pecas">{t('browse')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-text-secondary">{t('count', { count: items.length })}</p>
      <ul className="grid gap-3">
        {items.map((f) => {
          const current = live?.find((p) => p.slug === f.slug);
          const unavailable = isSuccess && (!current || current.stock === 0);
          return (
            <li
              key={f.slug}
              className="grid grid-cols-[72px_1fr] gap-4 rounded-xl border-[1.5px] border-border-subtle p-4 sm:grid-cols-[88px_1fr_auto]"
            >
              <PiecePhoto material={f.material} className={unavailable ? 'opacity-50' : ''} />
              <div className="grid content-start gap-1">
                {unavailable ? (
                  <span className="text-label">{f.name[locale]}</span>
                ) : (
                  <Link
                    href={`/pecas/${f.slug}`}
                    className="text-label underline-offset-4 hover:underline"
                  >
                    {f.name[locale]}
                  </Link>
                )}
                <span className="text-sm text-text-secondary">
                  {f.shop.name} · {f.shop.city}, {f.shop.state}
                </span>
                {unavailable ? (
                  <div className="grid justify-items-start gap-1">
                    <Badge tone="neutral" dot>
                      {t('unavailable')}
                    </Badge>
                    <p className="text-sm text-text-secondary">
                      {t('unavailableBody')}{' '}
                      <Link href={`/lojas/${f.shop.slug}`} className="underline underline-offset-4">
                        {f.shop.name}
                      </Link>
                    </p>
                  </div>
                ) : (
                  <span className="text-label">
                    {formatPrice(current?.priceCents ?? f.priceCents, locale)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(f.slug)}
                aria-label={t('remove', { name: f.name[locale] })}
                className="text-label col-start-2 min-h-11 justify-self-start text-sm underline underline-offset-4 sm:col-start-auto"
              >
                {t('removeShort')}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-text-secondary">{t('note')}</p>
    </div>
  );
}
