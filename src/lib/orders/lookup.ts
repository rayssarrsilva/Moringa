import { z } from 'zod';

/** A guest proves the order is theirs with the code and the email used at checkout. */
export const lookupSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^MOR-[A-Z0-9]{6}$/),
  email: z.string().trim().toLowerCase().email(),
});

export type Lookup = z.infer<typeof lookupSchema>;

/** Guests have no session; the empty sid also keeps shared demo orders out of reach. */
export const guestViewer = ({ email }: Lookup) => ({ email, sid: 'guest' });
