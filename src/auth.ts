import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { demoBuyer } from './lib/orders/sample-orders';

declare module 'next-auth' {
  interface Session {
    /** Unique per sign-in. Demo changes without a database are kept per session. */
    sid: string;
    user: { role: 'buyer' | 'seller' } & DefaultSession['user'];
  }
  interface User {
    role?: 'buyer' | 'seller';
  }
}

/**
 * Demo accounts, so recruiters and visitors can see the signed-in areas with one click.
 * There are no passwords: the only thing a demo login can see is demo data.
 */
export const demoAccounts = {
  marina: {
    id: 'demo-marina',
    name: demoBuyer.name,
    email: demoBuyer.email,
    role: 'buyer' as const,
  },
};

export type DemoAccount = keyof typeof demoAccounts;

/** Production needs AUTH_SECRET. Local runs and CI get a fixed secret so `npm run start` works out of the box. */
const secret =
  process.env.AUTH_SECRET ??
  (process.env.VERCEL ? undefined : 'moringa-local-secret-do-not-use-in-production');

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/pt/conta' },
  providers: [
    Credentials({
      id: 'demo',
      name: 'Demo',
      credentials: { account: {} },
      authorize: (credentials) => (credentials?.account === 'marina' ? demoAccounts.marina : null),
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? 'buyer';
        token.sid = crypto.randomUUID();
        // With a database, every demo sign-in gets its own copy of the demo orders.
        if (process.env.DATABASE_URL) {
          const { provisionDemoOrders } = await import('./lib/orders/demo-orders');
          await provisionDemoOrders(String(token.sid));
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = (token.role as 'buyer' | 'seller') ?? 'buyer';
      session.sid = String(token.sid ?? token.sub);
      return session;
    },
  },
});

/** The signed-in buyer as the order repositories see them, or null. */
export async function currentViewer() {
  const session = await auth();
  const email = session?.user?.email;
  return email ? { email, sid: session.sid, name: session.user.name ?? '' } : null;
}
