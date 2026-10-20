import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { currentViewer } from '@/auth';
import { isDemoEmail } from '@/lib/orders/demo-orders';
import { CheckoutForm } from '@/components/bag/checkout-form';
import { Breadcrumbs } from '@/components/breadcrumbs';
import type { Locale } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Checkout' });
  return { title: t('title'), robots: { index: false } };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, tb, viewer] = await Promise.all([
    getTranslations('Checkout'),
    getTranslations('Bag'),
    currentViewer(),
  ]);
  return (
    <div className="container-page grid gap-8 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs
          locale={locale}
          items={[{ label: tb('title'), href: '/sacola' }, { label: t('title') }]}
        />
        <h1 className="text-heading-md md:text-display">{t('title')}</h1>
      </div>
      <CheckoutForm
        account={
          viewer
            ? { name: viewer.name, email: viewer.email, demo: isDemoEmail(viewer.email) }
            : undefined
        }
      />
    </div>
  );
}
