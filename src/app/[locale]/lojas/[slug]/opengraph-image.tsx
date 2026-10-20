import { ImageResponse } from 'next/og';
import { initials } from '@/components/maker-avatar';
import type { Locale } from '@/i18n/routing';
import { catalog } from '@/lib/catalog';
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
  const shop = await catalog().getShop(slug);
  if (!shop) return new ImageResponse(<OgFrame eyebrow="Moringa" title="Moringa" />, size);

  return new ImageResponse(
    <OgFrame
      eyebrow={`${shop.craft[locale]} · ${shop.city}, ${shop.state}`}
      title={shop.name}
      subtitle={shop.quote ? `“${shop.quote[locale]}”` : undefined}
      aside={
        <div
          style={{
            display: 'flex',
            width: 300,
            height: 300,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1F5A3A',
            borderRadius: 999,
            fontSize: 140,
            fontWeight: 700,
          }}
        >
          {initials(shop.name)}
        </div>
      }
    />,
    size,
  );
}
