import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { ShopProfile } from '@/components/shop-profile';
import type { Locale } from '@/i18n/routing';
import { catalog } from '@/lib/catalog';
import { alternates, ogLocale, siteUrl, truncate } from '@/lib/seo';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const shop = await catalog().getShop(slug);
  if (!shop) return {};
  const t = await getTranslations({ locale, namespace: 'Shops' });
  const description = truncate(
    t('shopDescription', {
      craft: shop.craft[locale],
      city: shop.city,
      state: shop.state,
      story: shop.story[locale],
    }),
  );
  return {
    title: shop.name,
    description,
    alternates: alternates(locale, `/lojas/${slug}`),
    openGraph: { title: shop.name, description, locale: ogLocale[locale], siteName: 'Moringa' },
  };
}

export default async function ShopPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const shop = await catalog().getShop(slug);
  if (!shop) notFound();
  const t = await getTranslations('Shops');

  return (
    <div className="container-page grid gap-12 pb-16 pt-6 md:pt-10">
      <Breadcrumbs
        locale={locale}
        items={[{ label: t('title'), href: '/lojas' }, { label: shop.name }]}
      />

      <ShopProfile shop={shop} pieces={shop.pieces} locale={locale} />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: shop.name,
          jobTitle: shop.craft[locale],
          description: shop.story[locale],
          url: `${siteUrl()}/${locale}/lojas/${shop.slug}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: shop.city,
            addressRegion: shop.state,
            addressCountry: 'BR',
          },
        }}
      />
    </div>
  );
}
