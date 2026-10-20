import '@fontsource/fraunces/400.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '../globals.css';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { QueryProvider } from '@/components/query-provider';
import { SiteHeader } from '@/components/site-header';
import { themeScript } from '@/components/theme-toggle';
import { routing } from '@/i18n/routing';
import { siteUrl } from '@/lib/seo';

const htmlLang = { pt: 'pt-BR', en: 'en' } as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t('title'), template: `%s · Moringa` },
    description: t('description'),
    alternates: { languages: { 'pt-BR': '/pt', en: '/en' } },
    openGraph: {
      type: 'website',
      siteName: 'Moringa',
      title: t('title'),
      description: t('description'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    // The theme script sets data-theme before React loads, hence suppressHydrationWarning.
    <html lang={htmlLang[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <QueryProvider>
            <SiteHeader />
            <main id="content" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <SiteFooter />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
