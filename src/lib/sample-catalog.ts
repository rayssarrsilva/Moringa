/**
 * Demo catalog shared by the seed script and by pages before the database is connected.
 * Makers and pieces are fictional. Prices are in cents (BRL).
 */
import type { Region } from './regions';

export type Material = 'ceramics' | 'straw' | 'wood' | 'fabric' | 'lace';

export interface SampleMaker {
  slug: string;
  name: string;
  craft: { pt: string; en: string };
  city: string;
  state: string;
  region: Region;
  story: { pt: string; en: string };
  quote: { pt: string; en: string };
  tint: string;
}

export interface SamplePiece {
  slug: string;
  maker: string;
  name: { pt: string; en: string };
  description: { pt: string; en: string };
  material: Material;
  priceCents: number;
  shippingCents: number;
  stock: number;
  tint: string;
}

export const makers: SampleMaker[] = [
  {
    slug: 'ceramica-da-lucia',
    name: 'Dona Lúcia',
    craft: { pt: 'Ceramista', en: 'Ceramist' },
    city: 'Cunha',
    state: 'SP',
    region: 'sudeste',
    story: {
      pt: 'Trabalha com barro há 32 anos. Queima as peças num forno a lenha atrás de casa.',
      en: 'Has worked with clay for 32 years. Fires her pieces in a wood kiln behind her house.',
    },
    quote: {
      pt: 'Gosto de conversar com quem compra minhas peças. Cada moringa passa três dias no forno.',
      en: 'I like talking to people who buy my pieces. Each moringa takes three days in the kiln.',
    },
    tint: '#E8C3A6',
  },
  {
    slug: 'cestaria-do-raimundo',
    name: 'Seu Raimundo',
    craft: { pt: 'Cesteiro', en: 'Basket weaver' },
    city: 'Petrolina',
    state: 'PE',
    region: 'nordeste',
    story: {
      pt: 'Aprendeu a trançar palha de carnaúba com o pai, na beira do São Francisco.',
      en: 'Learned to weave carnauba straw from his father, on the banks of the São Francisco river.',
    },
    quote: {
      pt: 'Um cesto bem feito dura mais que quem fez.',
      en: 'A well-made basket outlives the person who made it.',
    },
    tint: '#EDDCA8',
  },
  {
    slug: 'bordados-da-ana',
    name: 'Ana',
    craft: { pt: 'Bordadeira', en: 'Embroiderer' },
    city: 'Diamantina',
    state: 'MG',
    region: 'sudeste',
    story: {
      pt: 'Borda à mão flores do cerrado em linho e algodão cru.',
      en: 'Hand-embroiders cerrado flowers on linen and raw cotton.',
    },
    quote: {
      pt: 'Cada ponto é uma conversa com a minha avó.',
      en: 'Every stitch is a conversation with my grandmother.',
    },
    tint: '#E9E1D3',
  },
  {
    slug: 'marcenaria-do-tiao',
    name: 'Tião',
    craft: { pt: 'Marceneiro', en: 'Woodworker' },
    city: 'Trancoso',
    state: 'BA',
    region: 'nordeste',
    story: {
      pt: 'Entalha colheres e tábuas com madeira de demolição.',
      en: 'Carves spoons and boards from reclaimed wood.',
    },
    quote: {
      pt: 'A madeira já teve uma vida. Eu só dou a próxima.',
      en: 'The wood already had a life. I just give it the next one.',
    },
    tint: '#D8BF9E',
  },
];

export const pieces: SamplePiece[] = [
  {
    slug: 'moringa-de-barro-com-tampa',
    maker: 'ceramica-da-lucia',
    name: { pt: 'Moringa de barro com tampa', en: 'Clay moringa with lid' },
    description: {
      pt: 'Modelada à mão com argila local e queimada em forno a lenha. Mantém a água fresca por horas.',
      en: 'Shaped by hand from local clay and fired in a wood kiln. Keeps water cool for hours.',
    },
    material: 'ceramics',
    priceCents: 14000,
    shippingCents: 2000,
    stock: 2,
    tint: '#E8C3A6',
  },
  {
    slug: 'tigela-de-ceramica',
    maker: 'ceramica-da-lucia',
    name: { pt: 'Tigela de cerâmica', en: 'Ceramic bowl' },
    description: {
      pt: 'Tigela rústica para servir, com esmalte natural.',
      en: 'A rustic serving bowl with a natural glaze.',
    },
    material: 'ceramics',
    priceCents: 8900,
    shippingCents: 2000,
    stock: 5,
    tint: '#E8C3A6',
  },
  {
    slug: 'cesto-de-palha',
    maker: 'cestaria-do-raimundo',
    name: { pt: 'Cesto de palha', en: 'Straw basket' },
    description: {
      pt: 'Trançado em palha de carnaúba, com alças reforçadas.',
      en: 'Woven from carnauba straw, with reinforced handles.',
    },
    material: 'straw',
    priceCents: 12000,
    shippingCents: 2000,
    stock: 3,
    tint: '#EDDCA8',
  },
  {
    slug: 'pano-de-prato-bordado',
    maker: 'bordados-da-ana',
    name: { pt: 'Pano de prato bordado', en: 'Embroidered tea towel' },
    description: {
      pt: 'Linho cru com flores do cerrado bordadas à mão.',
      en: 'Raw linen with hand-embroidered cerrado flowers.',
    },
    material: 'fabric',
    priceCents: 6500,
    shippingCents: 1500,
    stock: 8,
    tint: '#E9E1D3',
  },
  {
    slug: 'jogo-de-colheres-de-madeira',
    maker: 'marcenaria-do-tiao',
    name: { pt: 'Jogo de colheres de madeira', en: 'Wooden spoon set' },
    description: {
      pt: 'Três colheres entalhadas em madeira de demolição.',
      en: 'Three spoons carved from reclaimed wood.',
    },
    material: 'wood',
    priceCents: 4800,
    shippingCents: 1500,
    stock: 6,
    tint: '#D8BF9E',
  },
];

export const findMaker = (slug: string) => makers.find((m) => m.slug === slug);
