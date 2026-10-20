'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';
import { bagTotals, type BagItem } from '@/lib/bag/bag';
import { formatPrice } from '@/lib/format';

export function BagSummary({ items, children }: { items: BagItem[]; children?: ReactNode }) {
  const t = useTranslations('Bag');
  const locale = useLocale() as Locale;
  const totals = bagTotals(items);

  return (
    <section
      aria-labelledby="summary-title"
      className="grid gap-4 rounded-xl border-[1.5px] border-border-subtle p-6 lg:sticky lg:top-24"
    >
      <h2 id="summary-title" className="text-heading-sm">
        {t('summary')}
      </h2>
      <dl className="grid grid-cols-[1fr_auto] gap-y-2">
        <dt className="text-text-secondary">{t('subtotal')}</dt>
        <dd>{formatPrice(totals.subtotalCents, locale)}</dd>
        <dt className="text-text-secondary">{t('shipping')}</dt>
        <dd>{formatPrice(totals.shippingCents, locale)}</dd>
        <dt className="text-label border-t border-border-subtle pt-3 text-lg">{t('total')}</dt>
        <dd className="text-label border-t border-border-subtle pt-3 text-lg">
          {formatPrice(totals.totalCents, locale)}
        </dd>
      </dl>
      {children}
    </section>
  );
}
