import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  addItem,
  type AddResult,
  type BagItem,
  type BagPiece,
  removeItem,
  setQuantity,
} from './bag';

interface BagState {
  items: BagItem[];
  add: (piece: BagPiece, quantity?: number) => AddResult;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

/** The bag lives in localStorage, so it survives a reload (US-05). Prices are checked again on the server at checkout. */
export const useBag = create<BagState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (piece, quantity = 1) => {
        const result = addItem(get().items, piece, quantity);
        set({ items: result.items });
        return result;
      },
      setQuantity: (slug, quantity) => set({ items: setQuantity(get().items, slug, quantity) }),
      remove: (slug) => set({ items: removeItem(get().items, slug) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'moringa:bag',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

const noop = () => () => {};

/**
 * False during server rendering and the first client render, true after.
 * Components that read the saved bag wait for it, so server and client HTML match.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
