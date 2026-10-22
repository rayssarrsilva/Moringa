'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { BagChange } from '@/lib/bag/bag';
import { formatPrice } from '@/lib/format';

/** Tells the buyer, before paying, what changed in the bag since the pieces were added. */
export function BagChanges({ changes }: { changes: BagChange[] }) {
  const t = useTranslations('Bag');
  const locale = useLocale() as Locale;
  return (
    <div role="status" className="empty:hidden">
      {changes.length > 0 && (
        <div className="grid gap-2 rounded-lg border-[1.5px] border-feedback-info p-4">
          <p className="text-label">{t('changesTitle')}</p>
          <ul className="grid list-disc gap-1 pl-5 text-sm">
            {changes.map((c, i) => {
              const name = c.name[locale];
              return (
                <li key={`${c.slug}-${c.kind}-${i}`}>
                  {c.kind === 'removed'
                    ? t('changeRemoved', { name })
                    : c.kind === 'stock'
                      ? t('changeStock', { name, count: c.to })
                      : t(c.kind === 'price' ? 'changePrice' : 'changeShipping', {
                          name,
                          from: formatPrice(c.from, locale),
                          to: formatPrice(c.to, locale),
                        })}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
