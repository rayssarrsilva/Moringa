import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ShopOrdersBoard } from '@/components/seller/shop-orders-board';
import type { Locale } from '@/i18n/routing';
import { sellerRepository, shopOrders } from '@/lib/seller';
import { shopOrderKeys } from '@/lib/seller/queries';
import { isDemoAccount } from '@/lib/seller/types';
import { sellerViewer } from '@/lib/seller/viewer';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ShopOrders' });
  return { title: t('ordersTitle'), robots: { index: false } };
}

export default async function ShopOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await sellerViewer();
  if (!viewer) redirect(`/${locale}/loja`);
  if (!(await sellerRepository().getShop(viewer))) redirect(`/${locale}/loja/comecar`);

  const [t, ts] = await Promise.all([getTranslations('ShopOrders'), getTranslations('Seller')]);
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: shopOrderKeys.all,
    queryFn: () => shopOrders().list(viewer),
  });

  return (
    <div className="container-page grid max-w-5xl gap-6 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs
          locale={locale}
          items={[{ label: ts('title'), href: '/loja' }, { label: t('ordersTitle') }]}
        />
        <h1 className="text-heading-md md:text-display">{t('ordersTitle')}</h1>
        {isDemoAccount(viewer.email) && (
          <p className="max-w-[64ch] text-sm text-text-secondary">{t('demoOrders')}</p>
        )}
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ShopOrdersBoard />
      </HydrationBoundary>
    </div>
  );
}
