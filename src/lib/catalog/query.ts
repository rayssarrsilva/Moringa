import { z } from 'zod';
import { regions, statesByRegion } from '../regions';
import { type CatalogQuery, type Material, materials, type SortOrder } from './types';

/**
 * Catalog filters live in the URL, in Portuguese, so a filtered page can be shared:
 * /pt/pecas?regiao=nordeste&material=ceramica&preco_max=150&ordem=menor-preco
 */
export const materialSlugs: Record<Material, string> = {
  ceramics: 'ceramica',
  straw: 'palha',
  wood: 'madeira',
  fabric: 'tecido',
  lace: 'renda',
};

export const sortSlugs: Record<SortOrder, string> = {
  new: 'recentes',
  'price-asc': 'menor-preco',
  'price-desc': 'maior-preco',
};

const allStates = Object.values(statesByRegion).flat();

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const blankToUndefined = (v: unknown) => {
  const value = first(v);
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
};

/** Reais in the URL ("150" or "150,50"), cents in the app. Invalid values are ignored. */
const reaisToCents = z.preprocess(
  (v) => {
    const value = blankToUndefined(v);
    return value === undefined ? undefined : Number(value.replace(',', '.'));
  },
  z
    .number()
    .finite()
    .nonnegative()
    .transform((reais) => Math.round(reais * 100))
    .optional()
    .catch(undefined),
);

const fromSlug = <T extends string>(map: Record<T, string>) =>
  z.preprocess(
    blankToUndefined,
    z
      .string()
      .transform((slug) => (Object.keys(map) as T[]).find((key) => map[key] === slug))
      .optional()
      .catch(undefined),
  );

const schema = z.object({
  q: z.preprocess(blankToUndefined, z.string().max(80).optional().catch(undefined)),
  regiao: z.preprocess(blankToUndefined, z.enum(regions).optional().catch(undefined)),
  estado: z.preprocess(
    (v) => blankToUndefined(v)?.toUpperCase(),
    z
      .enum(allStates as [string, ...string[]])
      .optional()
      .catch(undefined),
  ),
  material: fromSlug(materialSlugs),
  preco_min: reaisToCents,
  preco_max: reaisToCents,
  ordem: fromSlug(sortSlugs),
});

/** Turns URL search params into a safe query. Unknown or malformed values are dropped, never thrown. */
export function parseCatalogQuery(params: RawParams): CatalogQuery {
  const p = schema.parse(params);
  let min = p.preco_min;
  let max = p.preco_max;
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];

  return {
    q: p.q,
    region: p.regiao,
    state: p.estado,
    material: p.material && materials.includes(p.material) ? p.material : undefined,
    minPriceCents: min,
    maxPriceCents: max,
    sort: p.ordem ?? 'new',
  };
}

/** The inverse of parseCatalogQuery: builds the URL params for a query. */
export function toSearchParams(query: Partial<CatalogQuery>): Record<string, string> {
  const out: Record<string, string> = {};
  if (query.q) out.q = query.q;
  if (query.region) out.regiao = query.region;
  if (query.state) out.estado = query.state;
  if (query.material) out.material = materialSlugs[query.material];
  if (query.minPriceCents !== undefined) out.preco_min = String(query.minPriceCents / 100);
  if (query.maxPriceCents !== undefined) out.preco_max = String(query.maxPriceCents / 100);
  if (query.sort && query.sort !== 'new') out.ordem = sortSlugs[query.sort];
  return out;
}

export type FilterKey = 'q' | 'region' | 'state' | 'material' | 'minPriceCents' | 'maxPriceCents';

/** The filters currently applied, in display order. Sorting is not a filter. */
export function activeFilters(query: CatalogQuery): FilterKey[] {
  const keys: FilterKey[] = ['q', 'region', 'state', 'material', 'minPriceCents', 'maxPriceCents'];
  return keys.filter((k) => query[k] !== undefined);
}

/** Same query without one filter, for "remove this filter" links. */
export function withoutFilter(query: CatalogQuery, key: FilterKey): CatalogQuery {
  return { ...query, [key]: undefined };
}
