'use server';

import { revalidatePath } from 'next/cache';
import { sellerRepository } from '@/lib/seller';
import { pieceSchema, shopSchema, toPieceInput } from '@/lib/seller/schema';
import { sellerViewer } from '@/lib/seller/viewer';

export type ActionResult<T = object> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error: 'auth' | 'invalid' | 'exists' | 'no_shop' | 'not_found' | 'read_only' | 'generic';
    };

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

/** US-15: edit price, stock, description. The server checks the maker may change this piece. */
export async function updatePieceAction(slug: string, raw: unknown): Promise<ActionResult> {
  const viewer = await sellerViewer();
  if (!viewer) return { ok: false, error: 'auth' };
  const parsed = pieceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'invalid' };
  const result = await sellerRepository().updatePiece(viewer, slug, toPieceInput(parsed.data));
  if (!result.ok) return { ok: false, error: result.reason };
  revalidatePath('/[locale]/pecas/[slug]', 'page');
  return { ok: true };
}

/** US-15: pause or sell again. Paused pieces leave the catalog. */
export async function setPieceStatusAction(slug: string, status: unknown): Promise<ActionResult> {
  const viewer = await sellerViewer();
  if (!viewer) return { ok: false, error: 'auth' };
  if (status !== 'paused' && status !== 'published') return { ok: false, error: 'invalid' };
  const result = await sellerRepository().setPieceStatus(viewer, slug, status);
  if (!result.ok) return { ok: false, error: result.reason };
  // The catalog is cached for a few minutes; a paused piece must leave it now.
  revalidatePath('/[locale]/pecas', 'layout');
  revalidatePath('/[locale]/lojas', 'layout');
  revalidatePath('/[locale]', 'page');
  return { ok: true };
}
