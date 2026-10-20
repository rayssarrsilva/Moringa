import type { ReactNode } from 'react';

export const ogSize = { width: 1200, height: 630 };

/** Shared frame for Open Graph images: solid black, white type, one strong color block. */
export function OgFrame({
  eyebrow,
  title,
  subtitle,
  aside,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  footer?: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#000000',
        color: '#FFFFFF',
        padding: 64,
        gap: 56,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 4, color: '#A3A3A3' }}>
          {eyebrow.toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 28 ? 64 : 80,
              lineHeight: 1.05,
              fontWeight: 700,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ display: 'flex', fontSize: 32, color: '#D4D4D4' }}>{subtitle}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 30 }}>
          <div style={{ display: 'flex', fontWeight: 700 }}>Moringa</div>
          {footer && (
            <div
              style={{
                display: 'flex',
                background: '#1F5A3A',
                padding: '10px 22px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
      {aside}
    </div>
  );
}
