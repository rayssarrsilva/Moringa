'use client';

import { useTranslations } from 'next-intl';
import { useHydrated } from '@/lib/bag/store';
import { type FavoritePiece, useFavorites } from '@/lib/favorites/store';

/** A toggle button: aria-pressed tells screen readers whether the piece is saved. */
export function FavoriteButton({ piece }: { piece: FavoritePiece }) {
  const t = useTranslations('Favorites');
  const hydrated = useHydrated();
  const saved = useFavorites((s) => s.items.some((i) => i.slug === piece.slug));
  const toggle = useFavorites((s) => s.toggle);
  const pressed = hydrated && saved;

  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => toggle(piece)}
      className="text-label inline-flex min-h-11 items-center gap-2 justify-self-start rounded-pill border-[1.5px] border-border-control px-4 hover:border-text-primary aria-pressed:border-text-primary"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        fill={pressed ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        <path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.3 3.6 4 7 4c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.8C19.5 15.4 12 20 12 20Z" />
      </svg>
      {/* Same name in both states: aria-pressed and the filled heart say whether it is saved. */}
      {t('save')}
    </button>
  );
}
