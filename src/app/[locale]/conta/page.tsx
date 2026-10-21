import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { auth, currentViewer } from '@/auth';
import { OrdersList } from '@/components/account/orders-list';
import { Button } from '@rayssarrsilva/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { buyerOrders } from '@/lib/orders/buyer';
import { orderKeys } from '@/lib/orders/queries';
import { signInDemo, signOutAction } from './actions';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Account' });
  return { title: t('title'), robots: { index: false } };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [session, viewer, t] = await Promise.all([
    auth(),
    currentViewer(),
    getTranslations('Account'),
  ]);

  if (viewer?.role === 'seller') redirect(`/${locale}/loja`);

  if (!session || !viewer) {
    return (
      <div className="container-page grid max-w-3xl gap-8 pb-16 pt-10 md:pt-16">
        <div className="grid gap-3">
          <h1 className="text-heading-md md:text-display">{t('signInTitle')}</h1>
          <p className="max-w-[60ch] text-lg text-text-secondary">{t('signInBody')}</p>
        </div>
        <section
          aria-labelledby="demo-title"
          className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-border-subtle p-6 md:p-8"
        >
          <h2 id="demo-title" className="text-heading-sm">
            {t('demoTitle')}
          </h2>
          <p className="max-w-[56ch] text-text-secondary">{t('demoBody')}</p>
          <form action={signInDemo}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" size="lg">
              {t('demoButton')}
            </Button>
          </form>
        </section>
      </div>
    );
  }

  const tf = await getTranslations('Favorites');
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: orderKeys.list(),
    queryFn: () => buyerOrders().listForBuyer(viewer),
  });

  return (
    <div className="container-page grid max-w-4xl gap-8 pb-16 pt-10 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-caps text-text-secondary">{t('title')}</p>
          <h1 className="text-heading-md md:text-display">{t('hello', { name: viewer.name })}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/favoritos">{tf('title')}</Link>
          </Button>
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="ghost">
              {t('signOut')}
            </Button>
          </form>
        </div>
      </div>
      <section aria-labelledby="orders-title" className="grid gap-4">
        <h2 id="orders-title" className="text-heading-sm">
          {t('ordersTitle')}
        </h2>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <OrdersList />
        </HydrationBoundary>
      </section>
    </div>
  );
}
