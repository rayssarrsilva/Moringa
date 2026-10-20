export const regions = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'] as const;
export type Region = (typeof regions)[number];

/** Brazilian states (UF) grouped by IBGE region. */
export const statesByRegion: Record<Region, readonly string[]> = {
  norte: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
  nordeste: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'centro-oeste': ['DF', 'GO', 'MS', 'MT'],
  sudeste: ['ES', 'MG', 'RJ', 'SP'],
  sul: ['PR', 'RS', 'SC'],
};

export function regionOf(state: string): Region | undefined {
  const uf = state.trim().toUpperCase();
  return regions.find((r) => statesByRegion[r].includes(uf));
}
