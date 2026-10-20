import { Link } from '@/i18n/navigation';

export interface PieceCardProps {
  slug: string;
  name: string;
  maker: string;
  place: string;
  price: string;
  tint: string;
}

/** A piece in a grid. The whole card is a single link, so it is one tab stop. */
export function PieceCard({ slug, name, maker, place, price, tint }: PieceCardProps) {
  return (
    <article className="group">
      <Link href={`/pecas/${slug}`} className="grid gap-1 rounded-lg">
        <div
          aria-hidden="true"
          className="mb-2 aspect-[5/6] rounded-lg transition-transform group-hover:scale-[1.01]"
          style={{ background: tint }}
        />
        <h3 className="text-label text-[15px]">{name}</h3>
        <p className="text-sm text-text-secondary">
          {maker} · {place}
        </p>
        <p className="font-semibold">{price}</p>
      </Link>
    </article>
  );
}
