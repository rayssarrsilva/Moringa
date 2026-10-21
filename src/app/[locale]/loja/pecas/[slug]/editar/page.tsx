import { Badge, Button } from '@rayssarrsilva/ipe';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PieceEditForm } from '@/components/seller/piece-edit-form';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { sellerRepository } from '@/lib/seller';
import { sellerViewer } from '@/lib/seller/viewer';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

export const metadata: Metadata = { robots: { index: false } };

export default async function EditPiecePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const viewer = await sellerViewer();
  if (!viewer) redirect(`/${locale}/loja`);
  const [piece, t] = await Promise.all([
    sellerRepository().getPiece(viewer, slug),
    getTranslations('Seller'),
  ]);
  if (!piece) notFound();
  const viewHref = piece.visibility === 'public' ? `/pecas/${slug}` : `/loja/pecas/${slug}`;

  return (
    <div className="container-page grid max-w-3xl gap-6 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs
          locale={locale}
          items={[
            { label: t('title'), href: '/loja' },
            { label: t('editTitle', { name: piece.name[locale] }) },
          ]}
        />
        <h1 className="text-heading-md">{t('editTitle', { name: piece.name[locale] })}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Badge dot tone={piece.status === 'paused' ? 'neutral' : 'success'}>
            {piece.status === 'paused' ? t('statusPaused') : t('statusPublished')}
          </Badge>
          <Link
            href={viewHref}
            className="text-label min-h-11 content-center underline underline-offset-4"
          >
            {t('seePiece')}
          </Link>
        </div>
      </div>

      {piece.editable ? (
        <>
          <p className="text-text-secondary">{t('editIntro')}</p>
          <PieceEditForm
            slug={slug}
            status={piece.status}
            initial={{
              name: piece.name.pt,
              material: piece.material,
              description: piece.description.pt,
              priceCents: piece.priceCents,
              shippingCents: piece.shippingCents,
              stock: piece.stock,
            }}
          />
        </>
      ) : (
        <section
          aria-labelledby="readonly-title"
          className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-feedback-info p-5"
        >
          <h2 id="readonly-title" className="text-heading-sm">
            {t('readOnlyTitle')}
          </h2>
          <p className="max-w-[64ch]">{t('readOnlyBody')}</p>
          <Button asChild>
            <Link href="/loja/pecas/nova">{t('newPiece')}</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
