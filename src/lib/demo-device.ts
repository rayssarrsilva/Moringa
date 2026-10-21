import 'server-only';
import { cookies } from 'next/headers';

export const demoDeviceCookie = 'moringa_demo';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isDeviceId = (value: unknown): value is string =>
  typeof value === 'string' && uuid.test(value);

/**
 * One id per browser for everything a visitor does in the demo accounts.
 * The buyer and the maker accounts share it, so a visitor can buy as Marina, ship as
 * Dona Lúcia and see the tracking as Marina again, while other browsers never see any of it.
 * Only callable where cookies can be written (Server Actions, Route Handlers).
 */
export async function demoDevice(): Promise<string> {
  const jar = await cookies();
  const current = jar.get(demoDeviceCookie)?.value;
  if (isDeviceId(current)) return current;
  const id = crypto.randomUUID();
  jar.set(demoDeviceCookie, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 86_400,
  });
  return id;
}
