import type { AddressSnapshot } from '../../db/schema';
import type { OrderStatus } from '../order-status';

/**
 * Demo orders for Marina, the sample buyer. Used by the seed script (Neon) and by the
 * sample repository (no database). Dates are relative to "now" so the demo never looks stale.
 */
export const demoBuyer = { name: 'Marina', email: 'marina@demo.moringa.dev' } as const;

export const demoAddress: AddressSnapshot = {
  cep: '01310100',
  street: 'Avenida Paulista',
  number: '1578',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
};

export interface SampleOrder {
  code: string;
  shop: string;
  status: OrderStatus;
  items: { piece: string; quantity: number }[];
  trackingCode?: string;
  /** Days ago for each step that was reached. */
  days: {
    created: number;
    paid?: number;
    preparing?: number;
    shipped?: number;
    delivered?: number;
  };
}

export const sampleOrders: SampleOrder[] = [
  {
    code: 'MOR-7KQ2XA',
    shop: 'ceramica-da-lucia',
    status: 'shipped',
    items: [{ piece: 'moringa-de-barro-com-tampa', quantity: 1 }],
    trackingCode: 'QB123456789BR',
    days: { created: 6, paid: 6, preparing: 5, shipped: 2 },
  },
  {
    code: 'MOR-H3P9TZ',
    shop: 'cestaria-do-raimundo',
    status: 'paid',
    items: [{ piece: 'cesto-de-palha', quantity: 1 }],
    days: { created: 1, paid: 1 },
  },
  {
    code: 'MOR-4MWD8C',
    shop: 'bordados-da-ana',
    status: 'delivered',
    items: [{ piece: 'pano-de-prato-bordado', quantity: 2 }],
    trackingCode: 'QB987654321BR',
    days: { created: 24, paid: 24, preparing: 23, shipped: 21, delivered: 17 },
  },
];

const DAY = 86_400_000;
export const daysAgo = (days: number | undefined, now = Date.now()) =>
  days === undefined ? null : new Date(now - days * DAY);
