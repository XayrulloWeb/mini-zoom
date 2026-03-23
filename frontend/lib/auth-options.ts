import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

type BackendAuthResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  accessToken: string;
};

function getBackendUrl(): string {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL sozlanmagan');
  }
  return backendUrl;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-auth-secret',
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Kirish',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Parol', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').trim();
        const password = String(credentials?.password || '').trim();

        if (!email || !password) {
          return null;
        }

        const response = await fetch(`${getBackendUrl()}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as BackendAuthResponse;
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          accessToken: data.accessToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.accessToken = user.accessToken;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId || '');
        session.user.name = token.name || session.user.name;
        session.user.email = token.email || session.user.email;
      }
      session.accessToken = String(token.accessToken || '');
      return session;
    },
  },
};
