import { z } from 'zod';
import { materials } from '../catalog/types';
import { regionOf, statesByRegion } from '../regions';

const states = Object.values(statesByRegion).flat() as [string, ...string[]];

/** Messages are translation keys under Seller.errors. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'tooLong')
    .optional()
    .transform((v) => (v ? v : undefined));

/** US-11: what a maker tells buyers about themselves. */
export const shopSchema = z.object({
  name: z.string().trim().min(2, 'shopName').max(60, 'tooLong'),
  craft: z.string().trim().min(2, 'craft').max(40, 'tooLong'),
  city: z.string().trim().min(2, 'required').max(80, 'tooLong'),
  state: z.enum(states, { message: 'state' }),
  story: z.string().trim().min(40, 'story').max(600, 'tooLong'),
  quote: optionalText(160),
  craftEn: optionalText(40),
  storyEn: optionalText(600),
});

export type ShopForm = z.input<typeof shopSchema>;
export type ShopInput = z.output<typeof shopSchema>;

/** Reais typed by a person: "140", "140,50", "1.250,00" or "R$ 89,90". */
export function parseReais(text: string): number | null {
  const cleaned = text.replace(/R\$|\s/g, '');
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(cleaned)) return null;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isFinite(cents) ? cents : null;
}

const reais = (required: string, { min }: { min: number }) =>
  z
    .string()
    .trim()
    // abort: stop at the first failed check, so an empty field says "required", not "invalid".
    .min(1, { message: required, abort: true })
    .refine((v) => parseReais(v) !== null, { message: 'money', abort: true })
    .refine((v) => (parseReais(v) ?? 0) >= min, min > 0 ? 'pricePositive' : 'money')
    .refine((v) => (parseReais(v) ?? 0) <= 10_000_000, 'priceTooHigh');

/** US-12, one schema per wizard step, so "Continue" only checks what is on screen. */
export const pieceSteps = {
  details: z.object({
    name: z.string().trim().min(3, 'pieceName').max(80, 'tooLong'),
    material: z.enum(materials, { message: 'material' }),
    description: z.string().trim().min(20, 'description').max(600, 'tooLong'),
  }),
  pricing: z.object({
    price: reais('priceRequired', { min: 1 }),
    shipping: reais('shippingRequired', { min: 0 }),
    stock: z
      .string()
      .trim()
      .min(1, { message: 'stockRequired', abort: true })
      .regex(/^\d{1,3}$/, 'stock'),
  }),
};

export const pieceSchema = pieceSteps.details.extend(pieceSteps.pricing.shape);
export type PieceForm = z.input<typeof pieceSchema>;

export interface PieceInput {
  name: string;
  material: (typeof materials)[number];
  description: string;
  priceCents: number;
  shippingCents: number;
  stock: number;
}

/** What the server stores, from what the person typed. */
export function toPieceInput(form: z.output<typeof pieceSchema>): PieceInput {
  return {
    name: form.name,
    material: form.material,
    description: form.description,
    priceCents: parseReais(form.price)!,
    shippingCents: parseReais(form.shipping)!,
    stock: Number(form.stock),
  };
}

export const regionForState = (state: string) => regionOf(state)!;

/** "Moringa de barro com tampa" → "moringa-de-barro-com-tampa" */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}
