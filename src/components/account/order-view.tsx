'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { PiecePhoto } from '@/components/material-art';
import { Button } from '@rayssarrsilva/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatDate, formatPrice } from '@/lib/format';
import { confirmDelivery, fetchOrder, orderKeys } from '@/lib/orders/queries';
import { buildTimeline, correiosTrackingUrl, isOpen } from '@/lib/orders/timeline';
import type { OrderDetail, OrderSummary } from '@/lib/orders/types';
import { StatusBadge } from './status-badge';

/** How often an open order checks for news, so the timeline moves without a refresh (US-08). */
export const POLL_MS = 15_000;

export function OrderView({ code }: { code: string }) {
  const t = useTranslations('OrderPage');
  const locale = useLocale() as Locale;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data: order } = useQuery({
    queryKey: orderKeys.detail(code),
    queryFn: () => fetchOrder(code),
    refetchInterval: (query) =>
      query.state.data && isOpen(query.state.data.status) ? POLL_MS : false,
  });

  const confirm = useMutation({
    mutationFn: () => confirmDelivery(code),
    // Optimistic: show "Delivered" right away, roll back if the server says no.
    onMutate: async () => {
      setMessage('');
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(code) });
      const previous = queryClient.getQueryData<OrderDetail>(orderKeys.detail(code));
      if (previous) {
        queryClient.setQueryData<OrderDetail>(orderKeys.detail(code), {
          ...previous,
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(orderKeys.detail(code), context.previous);
      setMessage(t('confirmError'));
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(orderKeys.detail(code), updated);
      queryClient.setQueryData<OrderSummary[]>(orderKeys.list(), (list) =>
        list?.map((o) => (o.code === code ? { ...o, status: updated.status } : o)),
      );
      setMessage(t('confirmed', { maker: updated.shop.name }));
    },
  });

  if (!order) return null;
  const maker = order.shop.name;
  const timeline = buildTimeline(order);

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_340px]">
      <div className="grid gap-8">
        <section aria-labelledby="timeline-title" className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="timeline-title" className="text-heading-sm">
              {t('timeline')}
            </h2>
            <StatusBadge status={order.status} />
          </div>

          {order.status === 'pending' && (
            <p className="text-text-secondary">{t('pendingNote', { maker })}</p>
          )}
          {order.status === 'canceled' ? (
            <p className="text-text-secondary">{t('canceledNote')}</p>
          ) : (
            <ol className="grid">
              {timeline.map((entry, i) => (
                <li
                  key={entry.step}
                  aria-current={entry.state === 'current' ? 'step' : undefined}
                  className="grid grid-cols-[28px_1fr] gap-x-4"
                >
                  <span className="flex flex-col items-center" aria-hidden="true">
                    <span
                      className={`mt-1 size-4 rounded-pill border-2 ${
                        entry.state === 'upcoming'
                          ? 'border-border-control bg-bg-canvas'
                          : 'border-action-primary bg-action-primary'
                      } ${entry.state === 'current' ? 'ring-4 ring-action-primary/25' : ''}`}
                    />
                    {i < timeline.length - 1 && (
                      <span
                        className={`w-0.5 flex-1 ${
                          timeline[i + 1]!.state === 'upcoming'
                            ? 'bg-border-subtle'
                            : 'bg-action-primary'
                        }`}
                      />
                    )}
                  </span>
                  <div className="grid gap-1 pb-6">
                    <p
                      className={
                        entry.state === 'upcoming' ? 'text-label text-text-secondary' : 'text-label'
                      }
                    >
                      <StatusLabel step={entry.step} />
                      {entry.state === 'upcoming' && (
                        <span className="sr-only">, {t('upcoming')}</span>
                      )}
                    </p>
                    {entry.state !== 'upcoming' && (
                      <p className="text-sm text-text-secondary">{t(entry.step, { maker })}</p>
                    )}
                    {entry.at && (
                      <p className="text-sm text-text-secondary">
                        <time dateTime={entry.at}>{formatDate(entry.at, locale, true)}</time>
                      </p>
                    )}
                    {entry.step === 'shipped' &&
                      entry.state !== 'upcoming' &&
                      order.trackingCode && <Tracking code={order.trackingCode} />}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {order.status === 'shipped' && (
            <div className="grid justify-items-start gap-2">
              <Button onClick={() => confirm.mutate()} loading={confirm.isPending}>
                {confirm.isPending ? t('confirming') : t('confirm')}
              </Button>
            </div>
          )}
          <p role="status" className="min-h-6 text-sm">
            {message}
          </p>
          {isOpen(order.status) && <p className="text-sm text-text-secondary">{t('liveNote')}</p>}
        </section>

        <section aria-labelledby="items-title" className="grid gap-4">
          <h2 id="items-title" className="text-heading-sm">
            {t('items')}
          </h2>
          <ul className="grid gap-4">
            {order.items.map((item) => (
              <li key={item.slug} className="grid grid-cols-[72px_1fr_auto] items-center gap-4">
                <PiecePhoto material={item.material} />
                <Link
                  href={`/pecas/${item.slug}`}
                  className="text-label underline-offset-4 hover:underline"
                >
                  {item.quantity} × {item.name[locale]}
                </Link>
                <span>{formatPrice(item.unitPriceCents * item.quantity, locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="grid gap-6 rounded-xl border-[1.5px] border-border-subtle p-6 lg:sticky lg:top-24">
        <dl className="grid grid-cols-[1fr_auto] gap-y-2">
          <dt className="text-text-secondary">{t('subtotal')}</dt>
          <dd>{formatPrice(order.subtotalCents, locale)}</dd>
          <dt className="text-text-secondary">{t('shipping')}</dt>
          <dd>{formatPrice(order.shippingCents, locale)}</dd>
          <dt className="text-label border-t border-border-subtle pt-3">{t('total')}</dt>
          <dd className="text-label border-t border-border-subtle pt-3">
            {formatPrice(order.totalCents, locale)}
          </dd>
        </dl>
        <div className="grid gap-1 text-sm">
          <h2 className="text-label">{t('address')}</h2>
          <p className="text-text-secondary">
            {order.address.street}, {order.address.number}
            {order.address.complement ? ` · ${order.address.complement}` : ''}
            <br />
            {order.address.neighborhood} · {order.address.city}, {order.address.state}
            <br />
            CEP {order.address.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
          </p>
        </div>
      </aside>
    </div>
  );
}

function StatusLabel({ step }: { step: 'paid' | 'preparing' | 'shipped' | 'delivered' }) {
  const t = useTranslations('OrderStatus');
  return <>{t(step)}</>;
}

function Tracking({ code }: { code: string }) {
  const t = useTranslations('OrderPage');
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 grid justify-items-start gap-2 rounded-lg bg-bg-surface p-4">
      <p className="text-sm text-text-secondary">{t('tracking')}</p>
      <p className="text-label font-mono text-lg tracking-wider">{code}</p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="text-label min-h-11 text-sm underline underline-offset-4"
          onClick={async () => {
            await navigator.clipboard?.writeText(code);
            setCopied(true);
          }}
        >
          {t('copy')}
        </button>
        <a
          href={correiosTrackingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-label min-h-11 content-center text-sm underline underline-offset-4"
        >
          {t('track')}
        </a>
        <span role="status" className="text-sm">
          {copied ? t('copied') : ''}
        </span>
      </div>
    </div>
  );
}
