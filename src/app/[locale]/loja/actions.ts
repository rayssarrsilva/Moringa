'use server';

import { sellerRepository } from '@/lib/seller';
import { pieceSchema, shopSchema, toPieceInput } from '@/lib/seller/schema';
import { sellerViewer } from '@/lib/seller/viewer';

export type ActionResult<T = object> =
  ({ ok: true } & T) | { ok: false; error: 'auth' | 'invalid' | 'exists' | 'no_shop' | 'generic' };

/** US-11: validates again on the server with the same Zod schema the form used. */
export async function createShopAction(raw: unknown): Promise<ActionResult<{ slug: string }>> {
  const viewer = await sellerViewer();
  if (!viewer) return { ok: false, error: 'auth' };
  const parsed = shopSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  try {
    const result = await sellerRepository().createShop(viewer, parsed.data);
    return result.ok ? { ok: true, slug: result.shop.slug } : { ok: false, error: result.reason };
  } catch (error) {
    console.error('createShop failed', error);
    return { ok: false, error: 'generic' };
  }
}

/** US-12: the wizard's last step. */
export async function createPieceAction(
  raw: unknown,
): Promise<ActionResult<{ slug: string; name: string }>> {
  const viewer = await sellerViewer();
  if (!viewer) return { ok: false, error: 'auth' };
  const parsed = pieceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  try {
    const result = await sellerRepository().createPiece(viewer, toPieceInput(parsed.data));
    return result.ok
      ? { ok: true, slug: result.piece.slug, name: result.piece.name.pt }
      : { ok: false, error: result.reason };
  } catch (error) {
    console.error('createPiece failed', error);
    return { ok: false, error: 'generic' };
  }
}
