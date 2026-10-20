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

/** State names are proper nouns, the same in Portuguese and English. */
export const stateNames: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
};
