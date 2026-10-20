'use server';

import { signIn, signOut } from '@/auth';
import { routing } from '@/i18n/routing';

const safeLocale = (value: FormDataEntryValue | null) =>
  routing.locales.find((l) => l === value) ?? routing.defaultLocale;

export async function signInDemo(formData: FormData) {
  const locale = safeLocale(formData.get('locale'));
  await signIn('demo', { account: 'marina', redirectTo: `/${locale}/conta` });
}

export async function signOutAction(formData: FormData) {
  const locale = safeLocale(formData.get('locale'));
  await signOut({ redirectTo: `/${locale}/conta` });
}
