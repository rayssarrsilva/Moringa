import { Badge, Button } from '@rayssarrsilva/ipe';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { currentViewer } from '@/auth';
import { PiecePhoto } from '@/components/material-art';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { formatPrice } from '@/lib/format';
import { RateLimitNotice } from '@/components/rate-limit-notice';
import { ShopOverview } from '@/components/seller/shop-overview';
import { sellerRepository, shopOrders } from '@/lib/seller';
import { summarize } from '@/lib/seller/summary';
import { signInDemo, signOutAction } from '../conta/actions';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ publicada?: string; nome?: string; loja?: string; limite?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Seller' });
  return { title: t('title'), robots: { index: false } };
}

export default async function SellerHome({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [viewer, t, tr] = await Promise.all([
    currentViewer(),
    getTranslations('Seller'),
    getTranslations('Reviews'),
  ]);

  if (!viewer || viewer.role !== 'seller')
    return (
      <Landing
        locale={locale}
        buyer={Boolean(viewer)}
        limited={Boolean((await searchParams).limite)}
      />
    );

  const repo = sellerRepository();
  const shop = await repo.getShop(viewer);
  if (!shop) redirect(`/${locale}/loja/comecar`);

  const [pieces, orders, notice] = await Promise.all([
    repo.listPieces(viewer),
    shopOrders().list(viewer),
    searchParams,
  ]);
  const shopHref = shop.visibility === 'public' ? `/lojas/${shop.slug}` : '/loja/previa';

  return (
    <div className="container-page grid max-w-5xl gap-10 pb-16 pt-10 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-caps text-text-secondary">{t('title')}</p>
          <h1 className="text-heading-md md:text-display">{t('hello', { name: shop.name })}</h1>
          <p className="text-text-secondary">
            {shop.craft[locale]} · {shop.city}, {shop.state}
          </p>
        </div>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="back" value="loja" />
          <Button type="submit" variant="ghost">
            {t('signOut')}
          </Button>
        </form>
      </div>

      {notice.loja === 'criada' && (
        <div
          role="status"
          className="grid gap-1 rounded-xl border-[1.5px] border-feedback-success p-5"
        >
          <p className="text-label">{t('shopCreated')}</p>
          <p className="text-text-secondary">{t('shopCreatedBody')}</p>
        </div>
      )}
      {notice.publicada && (
        <div
          role="status"
          className="grid justify-items-start gap-1 rounded-xl border-[1.5px] border-feedback-success p-5"
        >
          <p className="text-label">{t('published', { name: notice.nome ?? '' })}</p>
          <p className="text-text-secondary">{t('publishedDemo')}</p>
          <Link
            href={`/loja/pecas/${notice.publicada}`}
            className="text-label underline underline-offset-4"
          >
            {t('seePiece')}
          </Link>
        </div>
      )}

      <ShopOverview summary={summarize(orders)} locale={locale} />

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/loja/pecas/nova">{t('newPiece')}</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href={shopHref}>{t('viewShop')}</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/loja/avaliacoes">{tr('seeReviews')}</Link>
        </Button>
      </div>

      <section aria-labelledby="pieces-title" className="grid gap-4">
        <h2 id="pieces-title" className="text-heading-sm">
          {t('piecesTitle')}
        </h2>
        {pieces.length === 0 ? (
          <div className="grid gap-1 rounded-xl border-[1.5px] border-border-subtle p-6">
            <p className="text-label">{t('noPieces')}</p>
            <p className="text-text-secondary">{t('noPiecesBody')}</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {pieces.map((p) => (
              <li
                key={p.slug}
                className="grid grid-cols-[56px_1fr] items-center gap-4 rounded-xl border-[1.5px] border-border-subtle p-3 sm:grid-cols-[64px_1fr_auto]"
              >
                <PiecePhoto
                  material={p.material}
                  className={p.status === 'paused' ? 'opacity-50' : ''}
                />
                <div className="grid gap-1">
                  <Link
                    href={p.visibility === 'public' ? `/pecas/${p.slug}` : `/loja/pecas/${p.slug}`}
                    className="text-label underline-offset-4 hover:underline"
                  >
                    {p.name[locale]}
                  </Link>
                  <span className="text-sm text-text-secondary">
                    {formatPrice(p.priceCents, locale)} · {t('inStock', { count: p.stock })}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <Badge tone={p.visibility === 'public' ? 'success' : 'info'} dot>
                      {t(`visibility.${p.visibility}`)}
                    </Badge>
                    {p.status === 'paused' && (
                      <Badge tone="neutral" dot>
                        {t('statusPaused')}
                      </Badge>
                    )}
                  </span>
                </div>
                <Link
                  href={`/loja/pecas/${p.slug}/editar`}
                  aria-label={`${t('edit')}: ${p.name[locale]}`}
                  className="text-label col-start-2 min-h-11 content-center text-sm underline underline-offset-4 sm:col-start-auto"
                >
                  {t('edit')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

async function Landing({
  locale,
  buyer,
  limited,
}: {
  locale: Locale;
  buyer: boolean;
  limited: boolean;
}) {
  const t = await getTranslations('Seller');
  const accounts = [
    {
      account: 'lucia',
      label: t('demoLucia'),
      hint: t('demoLuciaHint'),
      variant: 'primary' as const,
    },
    { account: 'nova', label: t('demoNew'), hint: t('demoNewHint'), variant: 'secondary' as const },
  ];

  return (
    <div className="container-page grid max-w-3xl gap-8 pb-16 pt-10 md:pt-16">
      <div className="grid gap-3">
        <h1 className="text-heading-md md:text-display">{t('landingTitle')}</h1>
        <p className="max-w-[60ch] text-lg text-text-secondary">{t('landingBody')}</p>
      </div>
      {limited && <RateLimitNotice />}
      {buyer && (
        <p role="status" className="rounded-lg bg-bg-surface p-4">
          {t('buyerSignedIn')}
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2">
        {accounts.map((a) => (
          <li
            key={a.account}
            className="grid content-between gap-4 rounded-xl border-[1.5px] border-border-subtle p-6"
          >
            <p className="text-text-secondary">{a.hint}</p>
            <form action={signInDemo}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="account" value={a.account} />
              <Button type="submit" variant={a.variant} fullWidth>
                {a.label}
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <p className="text-sm text-text-secondary">{t('demoNote')}</p>
    </div>
  );
}
