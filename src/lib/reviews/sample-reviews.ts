/**
 * Public reviews from made-up buyers, so piece pages show what real reviews look like.
 * Written the way people write: short, specific, sometimes with a small complaint.
 */
export interface SampleReview {
  piece: string;
  buyer: { name: string; email: string };
  rating: number;
  comment: string;
  daysAgo: number;
}

const buyer = (name: string, handle: string) => ({ name, email: `${handle}@demo.moringa.dev` });

export const sampleReviews: SampleReview[] = [
  {
    piece: 'moringa-de-barro-com-tampa',
    buyer: buyer('Helena Duarte', 'helena.duarte'),
    rating: 5,
    comment: 'A água fica geladinha mesmo. Dá pra ver o cuidado em cada detalhe.',
    daysAgo: 12,
  },
  {
    piece: 'moringa-de-barro-com-tampa',
    buyer: buyer('Rafael Costa', 'rafael.costa'),
    rating: 5,
    comment: 'Chegou muito bem embalada, com um bilhete escrito à mão. Ganhou meu dia.',
    daysAgo: 31,
  },
  {
    piece: 'tigela-de-ceramica',
    buyer: buyer('João Pedro Alves', 'joao.alves'),
    rating: 4,
    comment: 'Linda e pesada na medida. O esmalte tem umas variações que deixam ela única.',
    daysAgo: 20,
  },
  {
    piece: 'cesto-de-palha',
    buyer: buyer('Tânia Ribeiro', 'tania.ribeiro'),
    rating: 5,
    comment: 'Firme e com cheirinho de palha. Uso pra guardar o pão da semana.',
    daysAgo: 15,
  },
  {
    piece: 'pano-de-prato-bordado',
    buyer: buyer('Beatriz Nunes', 'beatriz.nunes'),
    rating: 5,
    comment: 'Dei de presente pra minha mãe e ela se emocionou com o bordado.',
    daysAgo: 9,
  },
  {
    piece: 'jogo-de-colheres-de-madeira',
    buyer: buyer('Carla Mendes', 'carla.mendes'),
    rating: 4,
    comment: 'Acabamento ótimo. Só achei a colher menor um pouco curta.',
    daysAgo: 40,
  },
];
