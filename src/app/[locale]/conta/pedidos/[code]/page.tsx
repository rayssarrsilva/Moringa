import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { currentViewer } from '@/auth';
import { OrderView } from '@/components/account/order-view';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { Locale } from '@/i18n/routing';
import { buyerOrders } from '@/lib/orders/buyer';
import { orderKeys } from '@/lib/orders/queries';

type Props = { params: Promise<{ locale: Locale; code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: 'OrderPage' });
  return { title: t('title', { code }), robots: { index: false } };
}

export default async function OrderPage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const viewer = await currentViewer();
  if (!viewer) redirect(`/${locale}/conta`);

  const order = await buyerOrders().getForBuyer(viewer, code);
  if (!order) notFound();

  const [t, ta] = await Promise.all([getTranslations('OrderPage'), getTranslations('Account')]);
  const queryClient = new QueryClient();
  queryClient.setQueryData(orderKeys.detail(code), order);

  return (
    <div className="container-page grid gap-8 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs
          locale={locale}
          items={[{ label: ta('title'), href: '/conta' }, { label: code }]}
        />
        <h1 className="text-heading-md md:text-display">{t('title', { code })}</h1>
        <p className="text-text-secondary">{t('from', { name: order.shop.name })}</p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OrderView code={code} />
      </HydrationBoundary>
    </div>
  );
}
