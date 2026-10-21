import 'server-only';
import { currentViewer } from '@/auth';

/** The signed-in maker, or null for visitors and buyers. */
export async function sellerViewer() {
  const viewer = await currentViewer();
  return viewer?.role === 'seller' ? viewer : null;
}
