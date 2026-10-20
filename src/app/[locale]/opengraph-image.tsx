import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { MaterialArt, materialColors } from '@/components/material-art';
import { OgFrame, ogSize } from '@/lib/og';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Moringa';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });
  return new ImageResponse(
    <OgFrame
      eyebrow={t('eyebrow')}
      title={t('title')}
      aside={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 300 }}>
          {(['ceramics', 'straw', 'fabric'] as const).map((m) => (
            <div
              key={m}
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                background: materialColors[m].bg,
                borderRadius: 16,
              }}
            >
              <MaterialArt material={m} size={120} strokeWidth={4} />
            </div>
          ))}
        </div>
      }
    />,
    size,
  );
}
