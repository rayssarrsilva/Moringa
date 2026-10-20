import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { currentViewer } from '@/auth';
import { ClearBag } from '@/components/bag/clear-bag';
import { Button } from '@rayssarrsilva/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatPrice } from '@/lib/format';
import { ordersBySession, ordersEnabled } from '@/lib/orders/repository';
import { stripe, stripeEnabled } from '@/lib/stripe';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ session_id?: string; demo?: string }>;
};

type State = 'paid' | 'pix' | 'demo' | 'open';

export const metadata: Metadata = { robots: { index: false } };

async function readState(sessionId?: string, demo?: string): Promise<State> {
  if (!stripeEnabled()) return demo ? 'demo' : 'open';
  if (!sessionId?.startsWith('cs_')) return 'open';
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') return 'paid';
    if (session.status === 'complete') return 'pix';
    return 'open';
  } catch {
    return 'open';
  }
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { session_id, demo } = await searchParams;
  const state = await readState(session_id, demo);
  const orders =
    state !== 'open' && session_id && ordersEnabled() ? await ordersBySession(session_id) : [];
  const viewer = await currentViewer();
  const t = await getTranslations('Order');

  const copy = {
    paid: [t('paidTitle'), t('paidBody', { count: Math.max(orders.length, 1) })],
    pix: [t('pixTitle'), t('pixBody')],
    // With a database the demo order is real, only the payment is simulated.
    demo:
      orders.length > 0
        ? [t('paidTitle'), t('paidBody', { count: orders.length })]
        : [t('demoTitle'), t('demoBody')],
    open: [t('openTitle'), t('openBody')],
  }[state];

  return (
    <div className="container-page grid max-w-3xl gap-6 pb-16 pt-10 md:pt-16">
      {state !== 'open' && <ClearBag />}
      <h1 className="text-heading-md md:text-display">{copy[0]}</h1>
      <p className="max-w-[60ch] text-lg text-text-secondary">{copy[1]}</p>
      {state === 'demo' && orders.length > 0 && (
        <p className="text-sm text-text-secondary">{t('demoBody')}</p>
      )}

      {orders.length > 0 && (
        <section
          aria-labelledby="codes-title"
          className="grid gap-3 rounded-xl border-[1.5px] border-border-subtle p-6"
        >
          <h2 id="codes-title" className="text-heading-sm">
            {t('codes')}
          </h2>
          <ul className="grid gap-2">
            {orders.map((o) => (
              <li key={o.code} className="text-label">
                {t('orderLine', {
                  code: o.code,
                  shop: o.shopName,
                  total: formatPrice(o.totalCents, locale),
                })}
              </li>
            ))}
          </ul>
        </section>
      )}

      {state !== 'open' && <p className="text-lg">{t('thanks')}</p>}

      <div className="flex flex-wrap gap-3">
        {state === 'open' && (
          <Button asChild>
            <Link href="/sacola">{t('backToBag')}</Link>
          </Button>
        )}
        {state !== 'open' && viewer && orders.length > 0 && (
          <Button asChild>
            <Link href={`/conta/pedidos/${orders[0]!.code}`}>{t('follow')}</Link>
          </Button>
        )}
        <Button
          asChild
          variant={state === 'open' || (viewer && orders.length > 0) ? 'ghost' : 'primary'}
        >
          <Link href="/pecas">{t('keepBrowsing')}</Link>
        </Button>
      </div>
    </div>
  );
}
