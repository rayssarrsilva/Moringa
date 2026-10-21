'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@rayssarrsilva/ipe';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useRef, useState } from 'react';
import { StatusBadge } from '@/components/account/status-badge';
import { PiecePhoto } from '@/components/material-art';
import type { Locale } from '@/i18n/routing';
import { formatDate, formatPrice } from '@/lib/format';
import { normalizeTrackingCode, trackingCodePattern } from '@/lib/order-status';
import type { ShopOrder } from '@/lib/seller/orders-types';
import {
  fetchShopOrders,
  markShipped,
  ShopOrderError,
  shopOrderKeys,
  startPreparing,
} from '@/lib/seller/queries';

type Tab = 'toShip' | 'shipped' | 'done';
const tabOf = (o: ShopOrder): Tab =>
  o.status === 'paid' || o.status === 'preparing'
    ? 'toShip'
    : o.status === 'shipped'
      ? 'shipped'
      : 'done';

/**
 * US-14. Orders hydrated from the server into TanStack Query; actions update the list
 * optimistically and roll back if the server says no. A shipped order leaves "To ship".
 */
export function ShopOrdersBoard() {
  const t = useTranslations('ShopOrders');
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const {
    data = [],
    isError,
    refetch,
  } = useQuery({ queryKey: shopOrderKeys.all, queryFn: fetchShopOrders });

  const patch = (code: string, change: Partial<ShopOrder>) =>
    queryClient.setQueryData<ShopOrder[]>(shopOrderKeys.all, (list) =>
      list?.map((o) => (o.code === code ? { ...o, ...change } : o)),
    );

  function mutationFor<V>(
    run: (v: V) => Promise<ShopOrder>,
    optimistic: (v: V) => [string, Partial<ShopOrder>],
    done: (o: ShopOrder) => string,
  ) {
    return {
      mutationFn: run,
      onMutate: async (v: V) => {
        setMessage('');
        await queryClient.cancelQueries({ queryKey: shopOrderKeys.all });
        const previous = queryClient.getQueryData<ShopOrder[]>(shopOrderKeys.all);
        patch(...optimistic(v));
        return { previous };
      },
      onError: (error: Error, v: V, context?: { previous?: ShopOrder[] }) => {
        if (context?.previous) queryClient.setQueryData(shopOrderKeys.all, context.previous);
        const [code] = optimistic(v);
        const conflict = error instanceof ShopOrderError && error.reason === 'not_allowed';
        setMessage(conflict ? t('conflict', { code }) : t('actionError', { code }));
        if (conflict) void queryClient.invalidateQueries({ queryKey: shopOrderKeys.all });
      },
      onSuccess: (order: ShopOrder) => {
        patch(order.code, order);
        setMessage(done(order));
        listRef.current?.focus();
      },
    };
  }

  const prepare = useMutation(
    mutationFor(
      (code: string) => startPreparing(code),
      (code) => [code, { status: 'preparing' }],
      (o) => t('preparingDone', { code: o.code }),
    ),
  );
  const ship = useMutation(
    mutationFor(
      ({ code, tracking }: { code: string; tracking: string }) => markShipped(code, tracking),
      ({ code, tracking }) => [
        code,
        { status: 'shipped', trackingCode: tracking, shippedAt: new Date().toISOString() },
      ],
      (o) => t('shippedDone', { code: o.code, buyer: o.buyerName.split(' ')[0]! }),
    ),
  );

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

  const groups: Record<Tab, ShopOrder[]> = { toShip: [], shipped: [], done: [] };
  for (const o of data) groups[tabOf(o)].push(o);
  const empty: Record<Tab, string> = {
    toShip: t('emptyToShip'),
    shipped: t('emptyShipped'),
    done: t('emptyDone'),
  };
  const label: Record<Tab, string> = {
    toShip: t('tabToShip', { count: groups.toShip.length }),
    shipped: t('tabShipped', { count: groups.shipped.length }),
    done: t('tabDone', { count: groups.done.length }),
  };

  return (
    <div className="grid gap-4">
      <div role="status" className="min-h-6">
        {message}
      </div>
      <Tabs defaultValue="toShip">
        <TabsList>
          {(Object.keys(groups) as Tab[]).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {label[tab]}
            </TabsTrigger>
          ))}
        </TabsList>
        {(Object.keys(groups) as Tab[]).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div
              ref={tab === 'toShip' ? listRef : undefined}
              tabIndex={-1}
              className="grid gap-3 pt-4 focus:outline-none"
            >
              {groups[tab].length === 0 ? (
                <p className="rounded-xl border-[1.5px] border-border-subtle p-6 text-text-secondary">
                  {empty[tab]}
                </p>
              ) : (
                <ul className="grid gap-3">
                  {groups[tab].map((o) => (
                    <li key={o.code}>
                      <OrderCard
                        order={o}
                        busy={
                          (prepare.isPending && prepare.variables === o.code) ||
                          (ship.isPending && ship.variables?.code === o.code)
                        }
                        onPrepare={() => prepare.mutate(o.code)}
                        onShip={(tracking) => ship.mutate({ code: o.code, tracking })}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function OrderCard({
  order,
  busy,
  onPrepare,
  onShip,
}: {
  order: ShopOrder;
  busy: boolean;
  onPrepare: () => void;
  onShip: (tracking: string) => void;
}) {
  const t = useTranslations('ShopOrders');
  const locale = useLocale() as Locale;
  const a = order.address;
  const titleId = `order-${order.code}`;

  return (
    <article
      aria-labelledby={titleId}
      className="grid gap-4 rounded-xl border-[1.5px] border-border-subtle p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 id={titleId} className="text-label">
            {t('orderTitle', { code: order.code })}
          </h3>
          <p className="text-sm text-text-secondary">
            {t('placed', { date: formatDate(order.createdAt, locale) })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid content-start gap-2">
          <p className="text-caps text-xs text-text-secondary">{t('items')}</p>
          <ul className="grid gap-2">
            {order.items.map((i) => (
              <li key={i.slug} className="grid grid-cols-[40px_1fr] items-center gap-3">
                <PiecePhoto material={i.material} />
                <span>
                  {i.quantity} × {i.name[locale]}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-label">
            {t('total', { total: formatPrice(order.totalCents, locale) })}
          </p>
        </div>
        <div className="grid content-start gap-1">
          <p className="text-caps text-xs text-text-secondary">{t('shipTo')}</p>
          <address className="not-italic">
            <span className="text-label">{order.buyerName}</span>
            <br />
            {a.street}, {a.number}
            {a.complement ? ` · ${a.complement}` : ''}
            <br />
            {a.neighborhood} · {a.city}, {a.state}
            <br />
            CEP {a.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
          </address>
          {order.trackingCode && (
            <p className="mt-2 text-sm">{t('tracking', { code: order.trackingCode })}</p>
          )}
        </div>
      </div>

      {order.status === 'paid' && (
        <div>
          <Button onClick={onPrepare} loading={busy}>
            {t('startPreparing')}
          </Button>
        </div>
      )}
      {order.status === 'preparing' && <ShipDialog order={order} busy={busy} onShip={onShip} />}
    </article>
  );
}

function ShipDialog({
  order,
  busy,
  onShip,
}: {
  order: ShopOrder;
  busy: boolean;
  onShip: (tracking: string) => void;
}) {
  const t = useTranslations('ShopOrders');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const tracking = normalizeTrackingCode(value);
    if (!trackingCodePattern.test(tracking)) return setError(true);
    setOpen(false);
    onShip(tracking);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setError(false);
      }}
    >
      <div>
        <Button onClick={() => setOpen(true)} loading={busy}>
          {t('markShipped')}
        </Button>
      </div>
      <DialogContent
        title={t('shipDialogTitle', { code: order.code })}
        description={t('shipDialogBody', { buyer: order.buyerName.split(' ')[0]! })}
        closeLabel={t('close')}
        // Start where the maker types, not on the close button.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <form noValidate onSubmit={submit} className="grid gap-4">
          <Input
            ref={inputRef}
            label={t('trackingLabel')}
            hint={t('trackingHint')}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(!trackingCodePattern.test(normalizeTrackingCode(e.target.value)));
            }}
            error={error ? t('trackingError') : undefined}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit">{t('confirmShip')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
