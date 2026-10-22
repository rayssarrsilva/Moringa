'use client';

import { useQuery } from '@tanstack/react-query';
import { type BagChange, toBagPiece } from '@/lib/bag/bag';
import { useBag, useHydrated } from '@/lib/bag/store';
import type { Piece } from '@/lib/catalog/types';

/** Fetches the pieces on sale, updates the saved bag and returns what changed. */
async function syncBag(slugs: string[]): Promise<BagChange[]> {
  const response = await fetch(`/api/pieces?slugs=${slugs.map(encodeURIComponent).join(',')}`);
  if (!response.ok) throw new Error(String(response.status));
  const { pieces } = (await response.json()) as { pieces: Piece[] };
  return useBag.getState().sync(pieces.map(toBagPiece));
}

/**
 * BUG-001: the bag used to show the price of the day a piece was added. Now, whenever the bag
 * or the checkout opens, it is brought up to date with the catalog, and the buyer is told what
 * changed. The server still checks again before charging (see checkout/pricing.ts).
 */
export function useBagSync() {
  const hydrated = useHydrated();
  // Only the list of pieces starts a new check; a quantity change does not.
  const slugs = useBag((s) => s.items.map((i) => i.slug).join(','));
  const query = useQuery({
    queryKey: ['bag', 'sync', slugs],
    queryFn: () => syncBag(slugs.split(',')),
    enabled: hydrated && slugs.length > 0,
    staleTime: 0,
  });
  // Kept in the store, so a notice survives the new check that a removed piece triggers.
  const changes = useBag((s) => s.notices);
  return { changes, refresh: query.refetch };
}
