import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Next.js 16 calls this file "proxy" (formerly "middleware").
// It redirects "/" to the visitor's language and keeps the locale in the URL.
export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
