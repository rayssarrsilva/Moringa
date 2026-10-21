'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import type { Locale } from '@/i18n/routing';
import { formatPrice } from '@/lib/format';
import type { WeekSummary } from '@/lib/seller/summary';

const intl: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US' };

/**
 * Revenue per week as bars. The SVG is decorative for screen readers: a text summary
 * says the key number, and "Show as a table" gives every value (design rule: charts have a table).
 */
export function SalesChart({ weeks }: { weeks: WeekSummary[] }) {
  const t = useTranslations('ShopOrders');
  const locale = useLocale() as Locale;
  const [table, setTable] = useState(false);
  const tableId = useId();

  const day = (iso: string) =>
    new Intl.DateTimeFormat(intl[locale], {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(iso));
  const max = Math.max(...weeks.map((w) => w.revenueCents), 1);
  const best = weeks.reduce((a, b) => (b.revenueCents > a.revenueCents ? b : a), weeks[0]!);
  const hasSales = weeks.some((w) => w.revenueCents > 0);

  const width = 320;
  const height = 150;
  const gap = 8;
  const bar = (width - gap * (weeks.length - 1)) / weeks.length;

  return (
    <figure
      aria-labelledby={`${tableId}-title`}
      className="grid gap-3 rounded-xl border-[1.5px] border-border-subtle p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`${tableId}-title`} className="text-label">
          {t('chartTitle')}
        </h3>
        <button
          type="button"
          aria-expanded={table}
          aria-controls={tableId}
          onClick={() => setTable((v) => !v)}
          className="text-label min-h-11 text-sm underline underline-offset-4"
        >
          {table ? t('hideTable') : t('showTable')}
        </button>
      </div>
      <figcaption className="text-sm text-text-secondary">
        {hasSales
          ? t('chartSummary', {
              best: formatPrice(best.revenueCents, locale),
              date: day(best.start),
            })
          : t('chartEmpty')}
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height + 22}`}
        className="w-full"
        aria-hidden="true"
        focusable="false"
      >
        <line x1="0" x2={width} y1={height} y2={height} stroke="var(--ipe-border-subtle)" />
        {weeks.map((w, i) => {
          const h = Math.max((w.revenueCents / max) * (height - 8), w.revenueCents ? 3 : 0);
          const x = i * (bar + gap);
          return (
            <g key={w.start}>
              <rect
                x={x}
                y={height - h}
                width={bar}
                height={h}
                rx="4"
                fill="var(--ipe-action-primary)"
              />
              <text
                x={x + bar / 2}
                y={height + 16}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ipe-text-secondary)"
              >
                {day(w.start)}
              </text>
            </g>
          );
        })}
      </svg>

      <div id={tableId} hidden={!table}>
        <table className="w-full text-sm">
          <caption className="sr-only">{t('chartTitle')}</caption>
          <thead>
            <tr className="border-b border-border-subtle text-left">
              <th scope="col" className="py-2 font-semibold">
                {t('weekOf')}
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                {t('weekSales')}
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                {t('weekRevenue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.start} className="border-b border-border-subtle">
                <th scope="row" className="py-2 text-left font-normal">
                  {day(w.start)}
                </th>
                <td className="py-2 text-right">{w.sales}</td>
                <td className="py-2 text-right">{formatPrice(w.revenueCents, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
