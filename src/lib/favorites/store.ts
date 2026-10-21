import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Localized, Material, Piece } from '../catalog/types';

/** A snapshot to show the list instantly; price and availability are checked again online. */
export interface FavoritePiece {
  slug: string;
  name: Localized;
  material: Material;
  priceCents: number;
  shop: { slug: string; name: string; city: string; state: string };
}

export const favoriteOf = (p: Piece): FavoritePiece => ({
  slug: p.slug,
  name: p.name,
  material: p.material,
  priceCents: p.priceCents,
  shop: { slug: p.shop.slug, name: p.shop.name, city: p.shop.city, state: p.shop.state },
});

interface FavoritesState {
  items: FavoritePiece[];
  toggle: (piece: FavoritePiece) => boolean;
  remove: (slug: string) => void;
}

/**
 * Favorites live in the browser (US-03): saved before signing in, still there after.
 * Newest first.
 */
export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (piece) => {
        const saved = get().items.some((i) => i.slug === piece.slug);
        set({
          items: saved ? get().items.filter((i) => i.slug !== piece.slug) : [piece, ...get().items],
        });
        return !saved;
      },
      remove: (slug) => set({ items: get().items.filter((i) => i.slug !== slug) }),
    }),
    { name: 'moringa:favorites', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
