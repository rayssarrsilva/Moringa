import { beforeEach, describe, expect, it } from 'vitest';
import { sampleRepository } from '../catalog/sample-repository';
import { toBagPiece } from './bag';
import { useBag } from './store';

const moringa = async () =>
  toBagPiece((await sampleRepository.getPiece('moringa-de-barro-com-tampa'))!);

describe('bag store', () => {
  beforeEach(() => {
    localStorage.clear();
    useBag.setState({ items: [] });
  });

  it('saves the bag to localStorage so it survives a reload', async () => {
    useBag.getState().add(await moringa());
    const saved = JSON.parse(localStorage.getItem('moringa:bag')!);
    expect(saved.state.items[0]).toMatchObject({ slug: 'moringa-de-barro-com-tampa', quantity: 1 });
    expect(saved.version).toBe(1);
  });

  it('restores a saved bag', async () => {
    localStorage.setItem(
      'moringa:bag',
      JSON.stringify({ state: { items: [{ ...(await moringa()), quantity: 2 }] }, version: 1 }),
    );
    await useBag.persist.rehydrate();
    expect(useBag.getState().items[0]!.quantity).toBe(2);
  });

  it('reports when stock limited what was added', async () => {
    const result = useBag.getState().add(await moringa(), 3);
    expect(result.limited).toBe(true);
    expect(useBag.getState().items[0]!.quantity).toBe(2);
  });

  it('changes quantities, removes and clears', async () => {
    const { add, setQuantity, remove, clear } = useBag.getState();
    add(await moringa());
    setQuantity('moringa-de-barro-com-tampa', 2);
    expect(useBag.getState().items[0]!.quantity).toBe(2);
    remove('moringa-de-barro-com-tampa');
    expect(useBag.getState().items).toEqual([]);
    add(await moringa());
    clear();
    expect(useBag.getState().items).toEqual([]);
  });
});
