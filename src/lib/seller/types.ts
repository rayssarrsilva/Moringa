import type { Piece, Shop } from '../catalog/types';
import type { PieceInput, ShopInput } from './schema';

export interface SellerViewer {
  email: string;
  name: string;
  sid: string;
}

/** "public": in the catalog. "onlyYou": created in a demo session, visible to that session only. */
export type Visibility = 'public' | 'onlyYou';

export interface SellerShop extends Shop {
  visibility: Visibility;
}

export interface SellerPiece extends Piece {
  visibility: Visibility;
}

export type CreateShopResult = { ok: true; shop: SellerShop } | { ok: false; reason: 'exists' };
export type CreatePieceResult = { ok: true; piece: SellerPiece } | { ok: false; reason: 'no_shop' };

export interface SellerRepository {
  getShop(viewer: SellerViewer): Promise<SellerShop | null>;
  createShop(viewer: SellerViewer, input: ShopInput): Promise<CreateShopResult>;
  listPieces(viewer: SellerViewer): Promise<SellerPiece[]>;
  getPiece(viewer: SellerViewer, slug: string): Promise<SellerPiece | null>;
  createPiece(viewer: SellerViewer, input: PieceInput): Promise<CreatePieceResult>;
}

/** Every demo account lives under this domain; real accounts never do. */
export const demoDomain = '@demo.moringa.dev';
export const isDemoAccount = (email: string) => email.toLowerCase().endsWith(demoDomain);

export const englishOr = (en: string | undefined, pt: string) => en ?? pt;
