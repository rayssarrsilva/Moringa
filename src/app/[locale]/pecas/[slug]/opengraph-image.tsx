import { ImageResponse } from 'next/og';
import { MaterialArt, materialColors } from '@/components/material-art';
import type { Locale } from '@/i18n/routing';
import { catalog } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { OgFrame, ogSize } from '@/lib/og';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Moringa';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const piece = await catalog().getPiece(slug);
  if (!piece) return new ImageResponse(<OgFrame eyebrow="Moringa" title="Moringa" />, size);

  return new ImageResponse(
    <OgFrame
      eyebrow={`${piece.shop.city}, ${piece.shop.state}`}
      title={piece.name[locale]}
      subtitle={`${locale === 'pt' ? 'por' : 'by'} ${piece.shop.name}`}
      footer={formatPrice(piece.priceCents, locale)}
      aside={
        <div
          style={{
            display: 'flex',
            width: 420,
            alignItems: 'center',
            justifyContent: 'center',
            background: materialColors[piece.material].bg,
            borderRadius: 24,
          }}
        >
          <MaterialArt material={piece.material} size={260} strokeWidth={3} />
        </div>
      }
    />,
    size,
  );
}
