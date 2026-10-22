import { z } from 'zod';
import { statesByRegion } from '../regions';

const states = Object.values(statesByRegion).flat() as [string, ...string[]];

/**
 * One schema for the browser (React Hook Form) and the server action.
 * Messages are translation keys under Checkout.errors.
 */
export const addressSchema = z.object({
  name: z.string().trim().min(2, 'name').max(80, 'tooLong'),
  email: z.string().trim().email('email'),
  cep: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, 'cep'),
  street: z.string().trim().min(2, 'required').max(120, 'tooLong'),
  number: z.string().trim().min(1, 'required').max(10, 'tooLong'),
  complement: z.string().trim().max(60, 'tooLong').optional(),
  neighborhood: z.string().trim().min(2, 'required').max(80, 'tooLong'),
  city: z.string().trim().min(2, 'required').max(80, 'tooLong'),
  state: z.enum(states, { message: 'required' }),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const cartSchema = z
  .array(
    z.object({
      slug: z.string().min(1).max(120),
      quantity: z.number().int().min(1).max(99),
      // What the buyer saw. The server never charges from these; it only checks they still hold.
      priceCents: z.number().int().min(0).optional(),
      shippingCents: z.number().int().min(0).optional(),
    }),
  )
  .min(1)
  .max(30);

export type CartLine = z.infer<typeof cartSchema>[number];

export const checkoutSchema = z.object({
  locale: z.enum(['pt', 'en']),
  items: cartSchema,
  address: addressSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** "01310-100" or "01310100" → "01310100" */
export const onlyDigits = (cep: string) => cep.replace(/\D/g, '');

/** Formats as the user types: "01310100" → "01310-100". */
export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}
