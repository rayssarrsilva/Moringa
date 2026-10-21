import type { AddressSnapshot } from '../../db/schema';
import type { OrderStatus } from '../order-status';

/**
 * Orders Dona Lúcia received, for her demo panel. Buyers and addresses are made up.
 * Two paid and one being prepared: three to ship today.
 */
export interface SampleShopOrder {
  buyer: { name: string; email: string; address: AddressSnapshot };
  status: OrderStatus;
  items: { piece: string; quantity: number }[];
  trackingCode?: string;
  days: {
    created: number;
    paid?: number;
    preparing?: number;
    shipped?: number;
    delivered?: number;
  };
}

const buyer = (name: string, email: string, address: AddressSnapshot) => ({
  name,
  email: `${email}@demo.moringa.dev`,
  address,
});

const carla = buyer('Carla Mendes', 'carla.mendes', {
  cep: '50030230',
  street: 'Rua do Bom Jesus',
  number: '183',
  neighborhood: 'Recife Antigo',
  city: 'Recife',
  state: 'PE',
});
const joao = buyer('João Pedro Alves', 'joao.alves', {
  cep: '80010010',
  street: 'Rua XV de Novembro',
  number: '940',
  complement: 'Apto 52',
  neighborhood: 'Centro',
  city: 'Curitiba',
  state: 'PR',
});
const beatriz = buyer('Beatriz Nunes', 'beatriz.nunes', {
  cep: '30130010',
  street: 'Avenida Afonso Pena',
  number: '1500',
  neighborhood: 'Centro',
  city: 'Belo Horizonte',
  state: 'MG',
});
const tania = buyer('Tânia Ribeiro', 'tania.ribeiro', {
  cep: '40020000',
  street: 'Rua Chile',
  number: '22',
  neighborhood: 'Centro Histórico',
  city: 'Salvador',
  state: 'BA',
});
const rafael = buyer('Rafael Costa', 'rafael.costa', {
  cep: '90010150',
  street: 'Rua dos Andradas',
  number: '736',
  neighborhood: 'Centro Histórico',
  city: 'Porto Alegre',
  state: 'RS',
});
const helena = buyer('Helena Duarte', 'helena.duarte', {
  cep: '74003010',
  street: 'Avenida Goiás',
  number: '310',
  neighborhood: 'Setor Central',
  city: 'Goiânia',
  state: 'GO',
});

export const sampleShop = 'ceramica-da-lucia';

export const sampleShopOrders: SampleShopOrder[] = [
  {
    buyer: carla,
    status: 'paid',
    items: [{ piece: 'moringa-de-barro-com-tampa', quantity: 1 }],
    days: { created: 0, paid: 0 },
  },
  {
    buyer: joao,
    status: 'paid',
    items: [{ piece: 'tigela-de-ceramica', quantity: 2 }],
    days: { created: 1, paid: 1 },
  },
  {
    buyer: beatriz,
    status: 'preparing',
    items: [{ piece: 'tigela-de-ceramica', quantity: 1 }],
    days: { created: 2, paid: 2, preparing: 1 },
  },
  {
    buyer: tania,
    status: 'shipped',
    items: [{ piece: 'moringa-de-barro-com-tampa', quantity: 1 }],
    trackingCode: 'QB234567891BR',
    days: { created: 5, paid: 5, preparing: 4, shipped: 3 },
  },
  {
    buyer: rafael,
    status: 'delivered',
    items: [{ piece: 'tigela-de-ceramica', quantity: 3 }],
    trackingCode: 'QB345678912BR',
    days: { created: 11, paid: 11, preparing: 10, shipped: 9, delivered: 6 },
  },
  {
    buyer: helena,
    status: 'delivered',
    items: [{ piece: 'moringa-de-barro-com-tampa', quantity: 1 }],
    trackingCode: 'QB456789123BR',
    days: { created: 17, paid: 17, preparing: 16, shipped: 15, delivered: 12 },
  },
  {
    buyer: carla,
    status: 'delivered',
    items: [{ piece: 'tigela-de-ceramica', quantity: 2 }],
    trackingCode: 'QB567891234BR',
    days: { created: 26, paid: 26, preparing: 25, shipped: 24, delivered: 20 },
  },
  {
    buyer: joao,
    status: 'delivered',
    items: [
      { piece: 'moringa-de-barro-com-tampa', quantity: 1 },
      { piece: 'tigela-de-ceramica', quantity: 1 },
    ],
    trackingCode: 'QB678912345BR',
    days: { created: 44, paid: 44, preparing: 43, shipped: 41, delivered: 37 },
  },
];
