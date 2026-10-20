import { Link } from '@/i18n/navigation';
import type { Material } from '@/lib/catalog/types';
import { PiecePhoto } from './material-art';

export interface PieceCardProps {
  slug: string;
  name: string;
  maker: string;
  place: string;
  price: string;
  material: Material;
}

/** A piece in a grid. The whole card is a single link, so it is one tab stop. */
export function PieceCard({ slug, name, maker, place, price, material }: PieceCardProps) {
  return (
    <article className="group">
      <Link href={`/pecas/${slug}`} className="grid gap-1 rounded-lg">
        <PiecePhoto
          material={material}
          className="mb-2 transition-transform duration-200 group-hover:scale-[1.01]"
        />
        <h3 className="text-label text-[15px] underline-offset-4 group-hover:underline">{name}</h3>
        <p className="text-sm text-text-secondary">
          {maker} · {place}
        </p>
        <p className="font-semibold">{price}</p>
      </Link>
    </article>
  );
}
