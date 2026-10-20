'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { PiecePhoto } from '@/components/material-art';
import { Button } from '@/components/ui/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { type BagItem, groupByShop } from '@/lib/bag/bag';
import { useBag, useHydrated } from '@/lib/bag/store';
import { formatPrice } from '@/lib/format';
import { BagSummary } from './bag-summary';

export function BagView() {
  const t = useTranslations('Bag');
  const hydrated = useHydrated();
  const items = useBag((s) => s.items);
  const [status, setStatus] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const heading = (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className="text-heading-md focus:outline-none md:text-display"
    >
      {t('title')}
    </h1>
  );

  if (!hydrated) {
    return (
      <div className="grid gap-6">
        {heading}
        <p className="text-text-secondary">{t('loading')}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid gap-6">
        {heading}
        <div className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-border-subtle p-6 md:p-10">
          <p className="text-heading-sm">{t('emptyTitle')}</p>
          <p className="max-w-[52ch] text-text-secondary">{t('emptyBody')}</p>
          <Button asChild>
            <Link href="/pecas">{t('browse')}</Link>
          </Button>
        </div>
        <div role="status" className="sr-only">
          {status}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      {heading}
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-8">
          {groupByShop(items).map((group) => (
            <ShopPackage
              key={group.shop.slug}
              group={group}
              onChange={setStatus}
              onRemoved={(name) => {
                setStatus(t('removed', { name }));
                headingRef.current?.focus();
              }}
            />
          ))}
          <p className="text-sm text-text-secondary">{t('packageNote')}</p>
        </div>
        <BagSummary items={items}>
          <Button asChild size="lg" fullWidth>
            <Link href="/finalizar">{t('checkout')}</Link>
          </Button>
          <Link
            href="/pecas"
            className="text-label justify-self-center underline underline-offset-4"
          >
            {t('keepBrowsing')}
          </Link>
        </BagSummary>
      </div>
      <div role="status" className="sr-only">
        {status}
      </div>
    </div>
  );
}

function ShopPackage({
  group,
  onChange,
  onRemoved,
}: {
  group: ReturnType<typeof groupByShop>[number];
  onChange: (message: string) => void;
  onRemoved: (name: string) => void;
}) {
  const t = useTranslations('Bag');
  const locale = useLocale() as Locale;

  return (
    <section aria-labelledby={`shop-${group.shop.slug}`} className="grid gap-4">
      <h2 id={`shop-${group.shop.slug}`} className="text-caps text-text-secondary">
        {t('from', { name: group.shop.name })}
      </h2>
      <ul className="grid gap-4">
        {group.items.map((item) => (
          <BagLine key={item.slug} item={item} onChange={onChange} onRemoved={onRemoved} />
        ))}
      </ul>
      <p className="flex justify-between border-t border-border-subtle pt-3 text-sm">
        <span className="text-text-secondary">{t('shippingFrom', { name: group.shop.name })}</span>
        <span>{formatPrice(group.shippingCents, locale)}</span>
      </p>
    </section>
  );
}

const stepButton =
  'inline-flex size-11 items-center justify-center rounded-pill text-xl hover:bg-bg-surface disabled:opacity-40 disabled:hover:bg-transparent';

function BagLine({
  item,
  onChange,
  onRemoved,
}: {
  item: BagItem;
  onChange: (message: string) => void;
  onRemoved: (name: string) => void;
}) {
  const t = useTranslations('Bag');
  const locale = useLocale() as Locale;
  const setQuantity = useBag((s) => s.setQuantity);
  const remove = useBag((s) => s.remove);
  const name = item.name[locale];

  const change = (quantity: number) => {
    setQuantity(item.slug, quantity);
    onChange(`${t('quantityOf', { name })}: ${quantity}`);
  };

  return (
    <li className="grid grid-cols-[88px_1fr] gap-4 md:grid-cols-[112px_1fr_auto]">
      <PiecePhoto material={item.material} />
      <div className="grid content-start gap-1">
        <Link
          href={`/pecas/${item.slug}`}
          className="text-label underline-offset-4 hover:underline"
        >
          {name}
        </Link>
        <p className="text-sm text-text-secondary">{formatPrice(item.priceCents, locale)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div
            role="group"
            aria-label={t('quantityOf', { name })}
            className="inline-flex items-center rounded-pill border-[1.5px] border-border-control"
          >
            <button
              type="button"
              className={stepButton}
              aria-label={t('decrease', { name })}
              disabled={item.quantity <= 1}
              onClick={() => change(item.quantity - 1)}
            >
              <span aria-hidden="true">−</span>
            </button>
            <span className="text-label min-w-8 text-center">{item.quantity}</span>
            <button
              type="button"
              className={stepButton}
              aria-label={t('increase', { name })}
              disabled={item.quantity >= item.stock}
              onClick={() => change(item.quantity + 1)}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <button
            type="button"
            className="text-label min-h-11 text-sm underline underline-offset-4"
            aria-label={t('remove', { name })}
            onClick={() => {
              remove(item.slug);
              onRemoved(name);
            }}
          >
            {t('removeShort')}
          </button>
        </div>
      </div>
      <p className="text-label col-start-2 md:col-start-auto md:text-right">
        {formatPrice(item.priceCents * item.quantity, locale)}
      </p>
    </li>
  );
}
