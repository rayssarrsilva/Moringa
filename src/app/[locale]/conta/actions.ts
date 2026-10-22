'use server';

import { redirect } from 'next/navigation';
import { isDemoAccountName, signIn, signOut } from '@/auth';
import { routing } from '@/i18n/routing';
import { demoDevice } from '@/lib/demo-device';
import { limitAction } from '@/lib/security/action-limit';

const safeLocale = (value: FormDataEntryValue | null) =>
  routing.locales.find((l) => l === value) ?? routing.defaultLocale;

/** One-click demo sign-in. Buyers land on their orders, makers on their shop. */
export async function signInDemo(formData: FormData) {
  const locale = safeLocale(formData.get('locale'));
  const raw = formData.get('account') ?? 'marina';
  const account = isDemoAccountName(raw) ? raw : 'marina';
  const home = account === 'marina' ? 'conta' : 'loja';
  if (!(await limitAction('signIn')).ok) redirect(`/${locale}/${home}?limite=1`);
  const device = await demoDevice();
  await signIn('demo', { account, device, redirectTo: `/${locale}/${home}` });
}

export async function signOutAction(formData: FormData) {
  const locale = safeLocale(formData.get('locale'));
  const back = formData.get('back') === 'loja' ? 'loja' : 'conta';
  await signOut({ redirectTo: `/${locale}/${back}` });
}
