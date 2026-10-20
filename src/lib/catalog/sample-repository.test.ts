import { describe, expect, it } from 'vitest';
import { parseCatalogQuery } from './query';
import { normalize, sampleRepository } from './sample-repository';

const list = (params: Record<string, string>) =>
  sampleRepository.listPieces(parseCatalogQuery(params)).then((ps) => ps.map((p) => p.slug));

describe('sample catalog repository', () => {
  it('filters by state and material together (US-01)', async () => {
    expect(await list({ estado: 'SP', material: 'ceramica' })).toEqual([
      'moringa-de-barro-com-tampa',
      'tigela-de-ceramica',
    ]);
    expect(await list({ estado: 'PE', material: 'ceramica' })).toEqual([]);
  });

  it('filters by region', async () => {
    expect(await list({ regiao: 'nordeste' })).toEqual([
      'cesto-de-palha',
      'jogo-de-colheres-de-madeira',
    ]);
  });

  it('filters by an inclusive price range', async () => {
    expect(await list({ preco_min: '65', preco_max: '120' })).toEqual([
      'tigela-de-ceramica',
      'cesto-de-palha',
      'pano-de-prato-bordado',
    ]);
  });

  it('searches names, descriptions and makers without caring about accents or case', async () => {
    expect(await list({ q: 'CERAMICA' })).toEqual(['tigela-de-ceramica']);
    expect(await list({ q: 'lúcia' })).toEqual([
      'moringa-de-barro-com-tampa',
      'tigela-de-ceramica',
    ]);
    expect(await list({ q: 'spoon' })).toEqual(['jogo-de-colheres-de-madeira']);
  });

  it('sorts by price both ways', async () => {
    const asc = await sampleRepository.listPieces(parseCatalogQuery({ ordem: 'menor-preco' }));
    const prices = asc.map((p) => p.priceCents);
    expect(prices).toEqual(prices.toSorted((a, b) => a - b));
    const desc = await sampleRepository.listPieces(parseCatalogQuery({ ordem: 'maior-preco' }));
    expect(desc.map((p) => p.priceCents)).toEqual(prices.toReversed());
  });

  it('finds a shop with its pieces, and returns null for unknown slugs', async () => {
    const shop = await sampleRepository.getShop('ceramica-da-lucia');
    expect(shop?.name).toBe('Dona Lúcia');
    expect(shop?.pieces).toHaveLength(2);
    expect(await sampleRepository.getShop('nao-existe')).toBeNull();
    expect(await sampleRepository.getPiece('nao-existe')).toBeNull();
  });

  it('counts the pieces of every shop', async () => {
    const shops = await sampleRepository.listShops();
    expect(shops.map((s) => s.pieceCount)).toEqual([2, 1, 1, 1]);
  });
});

describe('normalize', () => {
  it('drops accents and case', () => {
    expect(normalize('Cerâmica São João')).toBe('ceramica sao joao');
  });
});
