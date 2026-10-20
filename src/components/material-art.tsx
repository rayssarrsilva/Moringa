import type { Material } from '@/lib/catalog/types';

/**
 * Line drawings that stand in for product photos until makers upload their own.
 * Solid Ipê colors, never pastel: urucum, ipê yellow, mata, anil and black.
 * Plain SVG elements only, so the same art renders in pages and in Open Graph images.
 */
export const materialColors: Record<Material, { bg: string; ink: string }> = {
  ceramics: { bg: '#B8431F', ink: '#FFFFFF' },
  straw: { bg: '#F7C531', ink: '#0A0A0A' },
  wood: { bg: '#1F5A3A', ink: '#FFFFFF' },
  fabric: { bg: '#264B8F', ink: '#FFFFFF' },
  lace: { bg: '#0A0A0A', ink: '#FFFFFF' },
};

const drawings: Record<Material, React.ReactNode> = {
  ceramics: (
    <>
      <path d="M50 30h20v8c0 6 20 12 20 38 0 24-13 38-30 38S30 100 30 76c0-26 20-32 20-38v-8Z" />
      <path d="M46 30h28M55 22h10v8" />
      <path d="M36 84c8 4 40 4 48 0" />
      <path d="M40 112h40" />
    </>
  ),
  straw: (
    <>
      <path d="M40 62c0-26 40-26 40 0" />
      <path d="M26 62h68l-9 50H35l-9-50Z" />
      <path d="M29 78h62M32 95h56" />
      <path d="M44 62l3 50M60 62v50M76 62l-3 50" />
    </>
  ),
  wood: (
    <>
      <ellipse cx="40" cy="44" rx="10" ry="14" />
      <path d="M40 58v54" />
      <ellipse cx="60" cy="38" rx="10" ry="14" />
      <path d="M60 52v60" />
      <path d="M80 30c6 0 10 6 10 14s-4 14-10 14-10-6-10-14 4-14 10-14ZM80 58v54" />
    </>
  ),
  fabric: (
    <>
      <path d="M28 36h64v76H28z" />
      <path d="M28 52h64" />
      <circle cx="60" cy="84" r="5" />
      <path d="M60 79c-3-8 3-12 0-14M65 84c8-3 12 3 14 0M60 89c3 8-3 12 0 14M55 84c-8 3-12-3-14 0" />
    </>
  ),
  lace: (
    <>
      <circle cx="60" cy="72" r="34" />
      <circle cx="60" cy="72" r="20" />
      <circle cx="60" cy="72" r="6" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <circle key={i} cx={60 + Math.cos(a) * 34} cy={72 + Math.sin(a) * 34} r="5" />;
      })}
    </>
  ),
};

export function MaterialArt({
  material,
  size = '100%',
  strokeWidth = 2.5,
}: {
  material: Material;
  size?: number | string;
  strokeWidth?: number;
}) {
  const { ink } = materialColors[material];
  return (
    <svg
      viewBox="0 0 120 144"
      width={size}
      height={size}
      fill="none"
      stroke={ink}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {drawings[material]}
    </svg>
  );
}

/** The image slot of a piece: a solid color block with the material drawing. */
export function PiecePhoto({
  material,
  className = '',
}: {
  material: Material;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`grid aspect-[5/6] place-items-center overflow-hidden rounded-lg ${className}`}
      style={{ backgroundColor: materialColors[material].bg }}
    >
      <div className="w-1/2">
        <MaterialArt material={material} />
      </div>
    </div>
  );
}
