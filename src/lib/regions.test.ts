import { describe, expect, it } from 'vitest';
import { regionOf, statesByRegion } from './regions';

describe('regions', () => {
  it('covers all 27 federative units exactly once', () => {
    const all = Object.values(statesByRegion).flat();
    expect(all).toHaveLength(27);
    expect(new Set(all).size).toBe(27);
  });

  it('finds the region of a state, ignoring case and spaces', () => {
    expect(regionOf('pe')).toBe('nordeste');
    expect(regionOf(' SP ')).toBe('sudeste');
    expect(regionOf('XX')).toBeUndefined();
  });
});
