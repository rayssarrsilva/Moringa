import { describe, expect, it } from 'vitest';
import { activeFilters, parseCatalogQuery, toSearchParams, withoutFilter } from './query';

describe('parseCatalogQuery', () => {
  it('reads the Portuguese URL params into a query', () => {
    expect(
      parseCatalogQuery({
        q: ' cesto ',
        regiao: 'nordeste',
        estado: 'pe',
        material: 'palha',
        preco_min: '50',
        preco_max: '150,90',
        ordem: 'menor-preco',
      }),
    ).toEqual({
      q: 'cesto',
      region: 'nordeste',
      state: 'PE',
      material: 'straw',
      minPriceCents: 5000,
      maxPriceCents: 15090,
      sort: 'price-asc',
    });
  });

  it('starts with no filters and the newest pieces first', () => {
    expect(parseCatalogQuery({})).toEqual({ sort: 'new' });
  });

  it('ignores values it does not know instead of failing', () => {
    const query = parseCatalogQuery({
      regiao: 'atlantida',
      estado: 'XX',
      material: 'plastico',
      preco_min: 'barato',
      preco_max: '-10',
      ordem: 'aleatorio',
    });
    expect(query).toEqual({ sort: 'new' });
  });

  it('treats empty fields from the filter form as "no filter"', () => {
    expect(parseCatalogQuery({ q: '', regiao: '', preco_min: '' })).toEqual({ sort: 'new' });
  });

  it('swaps the price range when the minimum is above the maximum', () => {
    const query = parseCatalogQuery({ preco_min: '200', preco_max: '100' });
    expect(query.minPriceCents).toBe(10000);
    expect(query.maxPriceCents).toBe(20000);
  });

  it('uses the first value when a param is repeated', () => {
    expect(parseCatalogQuery({ regiao: ['sul', 'norte'] }).region).toBe('sul');
  });

  it('rejects searches that are too long', () => {
    expect(parseCatalogQuery({ q: 'a'.repeat(81) }).q).toBeUndefined();
  });
});

describe('toSearchParams', () => {
  it('round-trips a query through the URL', () => {
    const params = {
      q: 'tigela',
      regiao: 'sudeste',
      estado: 'SP',
      material: 'ceramica',
      preco_min: '10',
      preco_max: '99.5',
      ordem: 'maior-preco',
    };
    const query = parseCatalogQuery(params);
    expect(toSearchParams(query)).toEqual(params);
    expect(parseCatalogQuery(toSearchParams(query))).toEqual(query);
  });

  it('leaves the default sort out of the URL', () => {
    expect(toSearchParams({ sort: 'new' })).toEqual({});
  });
});

describe('active filters', () => {
  it('lists only the filters in use, not the sort', () => {
    const query = parseCatalogQuery({ regiao: 'sul', preco_max: '80', ordem: 'menor-preco' });
    expect(activeFilters(query)).toEqual(['region', 'maxPriceCents']);
  });

  it('removes one filter and keeps the rest', () => {
    const query = parseCatalogQuery({ regiao: 'sul', material: 'madeira' });
    expect(toSearchParams(withoutFilter(query, 'region'))).toEqual({ material: 'madeira' });
  });
});
