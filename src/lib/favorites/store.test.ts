import { beforeEach, describe, expect, it } from 'vitest';
import { sampleRepository } from '../catalog/sample-repository';
import { favoriteOf, useFavorites } from './store';

const piece = async (slug: string) => favoriteOf((await sampleRepository.getPiece(slug))!);

describe('favorites (US-03)', () => {
  beforeEach(() => {
    localStorage.clear();
    useFavorites.setState({ items: [] });
  });

  it('saves and un-saves with the same toggle, newest first', async () => {
    const { toggle } = useFavorites.getState();
    expect(toggle(await piece('cesto-de-palha'))).toBe(true);
    toggle(await piece('tigela-de-ceramica'));
    expect(useFavorites.getState().items.map((i) => i.slug)).toEqual([
      'tigela-de-ceramica',
      'cesto-de-palha',
    ]);
    expect(toggle(await piece('cesto-de-palha'))).toBe(false);
    expect(useFavorites.getState().items.map((i) => i.slug)).toEqual(['tigela-de-ceramica']);
  });

  it('keeps them in the browser, so they survive signing in', async () => {
    useFavorites.getState().toggle(await piece('cesto-de-palha'));
    const saved = JSON.parse(localStorage.getItem('moringa:favorites')!);
    expect(saved.state.items[0].slug).toBe('cesto-de-palha');
  });
});
