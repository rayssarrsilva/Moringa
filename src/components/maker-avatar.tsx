import type { Region } from '@/lib/regions';

/** Solid Ipê colors per region, so each shop has a recognizable mark until makers upload a photo. */
const regionColors: Record<Region, { bg: string; ink: string }> = {
  norte: { bg: '#1F5A3A', ink: '#FFFFFF' },
  nordeste: { bg: '#B8431F', ink: '#FFFFFF' },
  'centro-oeste': { bg: '#F7C531', ink: '#0A0A0A' },
  sudeste: { bg: '#264B8F', ink: '#FFFFFF' },
  sul: { bg: '#0A0A0A', ink: '#FFFFFF' },
};

export const initials = (name: string) =>
  name
    .replace(/^(Dona|Seu|Sr\.?|Sra\.?)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export function MakerAvatar({
  name,
  region,
  size = 'md',
}: {
  name: string;
  region: Region;
  size?: 'md' | 'lg';
}) {
  const { bg, ink } = regionColors[region];
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-pill font-semibold ${
        size === 'lg' ? 'size-28 text-4xl md:size-36 md:text-5xl' : 'size-16 text-xl'
      }`}
      style={{ backgroundColor: bg, color: ink, fontFamily: 'Fraunces, serif' }}
    >
      {initials(name)}
    </span>
  );
}
