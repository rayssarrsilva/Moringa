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
  marina: () => ({
    id: 'demo-marina',
    name: demoBuyer.name,
    email: demoBuyer.email,
    role: 'buyer' as const,
  }),
  /** A maker with a shop already set up, from the seed. */
  lucia: () => ({
    id: 'demo-lucia',
    name: 'Dona Lúcia',
    email: 'ceramica-da-lucia@demo.moringa.dev',
    role: 'seller' as const,
  }),
  /** A brand-new maker, one per sign-in, who goes through shop onboarding. */
  nova: () => {
    const id = crypto.randomUUID().slice(0, 8);
    return {
      id: `demo-nova-${id}`,
      name: 'Nova artesã',
      email: `nova-${id}@demo.moringa.dev`,
      role: 'seller' as const,
    };
  },
};

export type DemoAccount = keyof typeof demoAccounts;
export const isDemoAccountName = (value: unknown): value is DemoAccount =>
  typeof value === 'string' && Object.hasOwn(demoAccounts, value);

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
      authorize: (credentials) =>
        isDemoAccountName(credentials?.account) ? demoAccounts[credentials.account]() : null,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? 'buyer';
        token.sid = crypto.randomUUID();
        // With a database: clear expired demo data, and give the demo buyer her own orders.
        if (process.env.DATABASE_URL) {
          const demo = await import('./lib/orders/demo-orders');
          if (user.email === demoBuyer.email) await demo.provisionDemoOrders(String(token.sid));
          else await demo.cleanupExpiredDemoData();
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
  return email
    ? { email, sid: session.sid, name: session.user.name ?? '', role: session.user.role }
    : null;
}
