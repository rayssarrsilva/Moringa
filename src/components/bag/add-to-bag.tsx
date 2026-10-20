'use client';

import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { Button } from '@rayssarrsilva/ipe';
import { Link } from '@/i18n/navigation';
import type { BagPiece } from '@/lib/bag/bag';
import { useBag } from '@/lib/bag/store';

type Message = { kind: 'added' } | { kind: 'limited'; count: number };

export function AddToBag({ piece, name }: { piece: BagPiece; name: string }) {
  const t = useTranslations('Piece');
  const add = useBag((s) => s.add);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<Message | null>(null);

  if (piece.stock === 0) {
    return (
      <Button size="lg" fullWidth disabled>
        {t('soldOut')}
      </Button>
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = add(piece, quantity);
    setMessage(result.limited ? { kind: 'limited', count: result.available } : { kind: 'added' });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5">
          <span className="text-label">{t('quantity')}</span>
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="min-h-[52px] w-24 rounded-md border-[1.5px] border-border-control bg-bg-canvas px-3"
          >
            {Array.from({ length: Math.min(piece.stock, 10) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="min-w-48 flex-1">
          <Button type="submit" size="lg" fullWidth>
            {t('addToBag')}
          </Button>
        </div>
      </div>

      {/* Always in the DOM, so screen readers pick up the change. */}
      <div role="status" className="min-h-6 text-sm">
        {message && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {message.kind === 'added'
                ? t('added', { name })
                : t('limited', { count: message.count })}
            </span>
            <Link href="/sacola" className="text-label underline underline-offset-4">
              {t('viewBag')}
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}
