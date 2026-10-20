'use client';

import { useEffect } from 'react';
import { useBag } from '@/lib/bag/store';

/** Empties the bag once the order is placed. Rendered only on a successful confirmation. */
export function ClearBag() {
  const clear = useBag((s) => s.clear);
  useEffect(() => clear(), [clear]);
  return null;
}
