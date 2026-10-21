import { Button } from '@rayssarrsilva/ipe';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatPrice } from '@/lib/format';
import type { ShopSummary } from '@/lib/seller/summary';
import { SalesChart } from './sales-chart';

/** US-13: what the maker needs to know today, at a glance. */
export async function ShopOverview({ summary, locale }: { summary: ShopSummary; locale: Locale }) {
  const t = await getTranslations('ShopOrders');
  const stats = [
    { label: t('sales'), value: String(summary.sales) },
    {
      label: t('revenue'),
      value: formatPrice(summary.revenueCents, locale),
      hint: t('revenueHint'),
    },
    { label: t('average'), value: formatPrice(summary.averageCents, locale) },
  ];

  return (
    <section aria-labelledby="overview-title" className="grid gap-4">
      <h2 id="overview-title" className="text-heading-sm">
        {t('overviewTitle')}
      </h2>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-xl bg-action-primary p-5 text-text-on-accent">
            <p className="text-label">{t('toShip')}</p>
            <p className="text-display leading-none">{summary.toShip}</p>
            <p>{t('toShipHint', { count: summary.toShip })}</p>
            <div>
              <Button asChild variant="secondary">
                <Link href="/loja/pedidos">{t('seeOrders')}</Link>
              </Button>
            </div>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="grid content-start gap-1 rounded-xl border-[1.5px] border-border-subtle p-4"
              >
                <dt className="text-sm text-text-secondary">{s.label}</dt>
                <dd className="text-label text-xl">{s.value}</dd>
                {s.hint && <dd className="text-xs text-text-secondary">{s.hint}</dd>}
              </div>
            ))}
          </dl>
        </div>
        <SalesChart weeks={summary.weeks} />
      </div>
    </section>
  );
}
