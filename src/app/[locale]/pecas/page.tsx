import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { FiltersDisclosure } from '@/components/filters-disclosure';
import { PieceCard } from '@/components/piece-card';
import { Button } from '@/components/ui/ipe';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { catalog, materials, type CatalogQuery } from '@/lib/catalog';
import {
  activeFilters,
  type FilterKey,
  materialSlugs,
  parseCatalogQuery,
  sortSlugs,
  toSearchParams,
  withoutFilter,
} from '@/lib/catalog/query';
import { formatPrice } from '@/lib/format';
import { regions, stateNames, statesByRegion } from '@/lib/regions';
import { alternates } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Catalog' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: alternates(locale, '/pecas'),
  };
}

const control =
  'min-h-12 w-full rounded-md border-[1.5px] border-border-control bg-bg-canvas px-3 text-text-primary';

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = parseCatalogQuery(await searchParams);
  const [pieces, t, tm, tr] = await Promise.all([
    catalog().listPieces(query),
    getTranslations('Catalog'),
    getTranslations('Materials'),
    getTranslations('Regions'),
  ]);
  const filters = activeFilters(query);

  const chipLabel: Record<FilterKey, () => string> = {
    q: () => t('searchChip', { q: query.q! }),
    region: () => tr(query.region!),
    state: () => stateNames[query.state!]!,
    material: () => tm(query.material!),
    minPriceCents: () => t('priceFrom', { price: formatPrice(query.minPriceCents!, locale) }),
    maxPriceCents: () => t('priceTo', { price: formatPrice(query.maxPriceCents!, locale) }),
  };

  return (
    <div className="container-page grid gap-8 pb-16 pt-6 md:pt-10">
      <div className="grid gap-3">
        <Breadcrumbs locale={locale} items={[{ label: t('title') }]} />
        <h1 className="text-heading-md md:text-display">{t('title')}</h1>
        <p className="max-w-[60ch] text-lg text-text-secondary">{t('description')}</p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[280px_1fr]">
        <FiltersDisclosure
          label={filters.length ? `${t('filters')} (${filters.length})` : t('filters')}
        >
          <FilterForm query={query} locale={locale} />
        </FiltersDisclosure>

        <section aria-labelledby="results-count" className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-count" className="text-heading-sm">
              {t('count', { count: pieces.length })}
            </h2>
          </div>

          {filters.length > 0 && (
            <div className="grid gap-2">
              <h3 className="sr-only">{t('active')}</h3>
              <ul className="flex flex-wrap gap-2">
                {filters.map((key) => {
                  const label = chipLabel[key]();
                  return (
                    <li key={key}>
                      <Link
                        href={{
                          pathname: '/pecas',
                          query: toSearchParams(withoutFilter(query, key)),
                        }}
                        aria-label={t('remove', { label })}
                        className="text-label inline-flex min-h-11 items-center gap-2 rounded-pill border-[1.5px] border-text-primary px-4 text-sm hover:bg-text-primary hover:text-bg-canvas"
                      >
                        {label}
                        <span aria-hidden="true">×</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {pieces.length > 0 ? (
            <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3">
              {pieces.map((p) => (
                <li key={p.slug}>
                  <PieceCard
                    slug={p.slug}
                    name={p.name[locale]}
                    maker={p.shop.name}
                    place={`${p.shop.city}, ${p.shop.state}`}
                    price={formatPrice(p.priceCents, locale)}
                    material={p.material}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid justify-items-start gap-3 rounded-xl border-[1.5px] border-border-subtle p-6 md:p-10">
              <p className="text-heading-sm">{t('emptyTitle')}</p>
              <p className="max-w-[52ch] text-text-secondary">{t('emptyBody')}</p>
              <Button asChild variant="secondary">
                <Link href="/pecas">{t('clear')}</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

async function FilterForm({ query, locale }: { query: CatalogQuery; locale: Locale }) {
  const [t, tm, tr] = await Promise.all([
    getTranslations('Catalog'),
    getTranslations('Materials'),
    getTranslations('Regions'),
  ]);
  const reais = (cents?: number) => (cents === undefined ? '' : String(cents / 100));

  return (
    <form action={`/${locale}/pecas`} method="get" className="grid gap-5">
      <label className="grid gap-1.5">
        <span className="text-label">{t('search')}</span>
        <input
          type="search"
          name="q"
          defaultValue={query.q ?? ''}
          placeholder={t('searchPlaceholder')}
          maxLength={80}
          className={`${control} placeholder:text-text-secondary`}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-label">{t('region')}</span>
        <select name="regiao" defaultValue={query.region ?? ''} className={control}>
          <option value="">{t('anyRegion')}</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {tr(r)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-label">{t('state')}</span>
        <select name="estado" defaultValue={query.state ?? ''} className={control}>
          <option value="">{t('anyState')}</option>
          {regions.map((r) => (
            <optgroup key={r} label={tr(r)}>
              {statesByRegion[r].map((uf) => (
                <option key={uf} value={uf}>
                  {stateNames[uf]} ({uf})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-label">{t('material')}</span>
        <select
          name="material"
          defaultValue={query.material ? materialSlugs[query.material] : ''}
          className={control}
        >
          <option value="">{t('anyMaterial')}</option>
          {materials.map((m) => (
            <option key={m} value={materialSlugs[m]}>
              {tm(m)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-1.5">
        <legend className="text-label mb-1.5">{t('price')}</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-text-secondary">{t('minPrice')}</span>
            <input
              type="number"
              name="preco_min"
              inputMode="decimal"
              min={0}
              step="any"
              defaultValue={reais(query.minPriceCents)}
              className={control}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-text-secondary">{t('maxPrice')}</span>
            <input
              type="number"
              name="preco_max"
              inputMode="decimal"
              min={0}
              step="any"
              defaultValue={reais(query.maxPriceCents)}
              className={control}
            />
          </label>
        </div>
      </fieldset>

      <label className="grid gap-1.5">
        <span className="text-label">{t('sort')}</span>
        <select name="ordem" defaultValue={sortSlugs[query.sort]} className={control}>
          <option value={sortSlugs.new}>{t('sortNew')}</option>
          <option value={sortSlugs['price-asc']}>{t('sortPriceAsc')}</option>
          <option value={sortSlugs['price-desc']}>{t('sortPriceDesc')}</option>
        </select>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit">{t('apply')}</Button>
        <Link href="/pecas" className="text-label underline underline-offset-4">
          {t('clear')}
        </Link>
      </div>
    </form>
  );
}
