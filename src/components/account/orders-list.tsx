'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { PiecePhoto } from '@/components/material-art';
import { Button } from '@rayssarrsilva/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatDate, formatPrice } from '@/lib/format';
import { fetchOrders, orderKeys } from '@/lib/orders/queries';
import { StatusBadge } from './status-badge';

/** Starts from the data the server already fetched (hydrated), then keeps itself fresh on focus. */
export function OrdersList() {
  const t = useTranslations('Account');
  const locale = useLocale() as Locale;
  const { data, isError, refetch } = useQuery({ queryKey: orderKeys.list(), queryFn: fetchOrders });

  if (isError) {
    return (
      <div role="alert" className="grid justify-items-start gap-3">
        <p>{t('loadError')}</p>
        <Button variant="secondary" onClick={() => refetch()}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-border-subtle p-6">
        <p className="text-heading-sm">{t('noOrders')}</p>
        <p className="text-text-secondary">{t('noOrdersBody')}</p>
        <Button asChild>
          <Link href="/pecas">{t('browse')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {data.map((o) => (
        <li key={o.code}>
          <Link
            href={`/conta/pedidos/${o.code}`}
            className="group grid grid-cols-[64px_1fr] items-center gap-4 rounded-xl border-[1.5px] border-border-subtle p-4 hover:border-text-primary md:grid-cols-[72px_1fr_auto]"
          >
            <PiecePhoto material={o.cover.material} />
            <span className="grid gap-1">
              <span className="text-label underline-offset-4 group-hover:underline">
                {o.cover.name[locale]}
                {o.itemCount > 1 && ` + ${o.itemCount - 1}`}
              </span>
              <span className="text-sm text-text-secondary">
                {o.code} · {o.shop.name} ·{' '}
                {t('placedOn', { date: formatDate(o.createdAt, locale) })}
              </span>
              <span className="flex flex-wrap items-center gap-3 md:hidden">
                <StatusBadge status={o.status} />
                <span className="text-label">{formatPrice(o.totalCents, locale)}</span>
              </span>
            </span>
            <span className="hidden justify-items-end gap-2 md:grid">
              <StatusBadge status={o.status} />
              <span className="text-label">{formatPrice(o.totalCents, locale)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
