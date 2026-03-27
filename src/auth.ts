import NextAuth, { type DefaultSession } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '@/lib/db';

export type UserRole = 'buyer' | 'agent' | 'individual';

// Extend Next-Auth types
declare module 'next-auth' {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession['user'];
  }
  interface User {
    role?: UserRole;
  }
}
// next-auth/jwt augmentation — token shape
declare module '@auth/core/jwt' {
  interface JWT { role?: UserRole; id?: string }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const { rows } = await pool.query<{
          id: string; email: string; name: string | null;
          image: string | null; password: string | null; role: UserRole;
        }>(
          'SELECT id, email, name, image, password, role FROM users WHERE email = $1',
          [email],
        );
        const user = rows[0];
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      // Upsert Google OAuth users into our users table
      if (account?.provider === 'google' && user.email) {
        await pool.query(
          `INSERT INTO users (email, name, image, role)
           VALUES ($1, $2, $3, 'individual')
           ON CONFLICT (email) DO UPDATE
             SET name  = COALESCE(EXCLUDED.name,  users.name),
                 image = COALESCE(EXCLUDED.image, users.image)`,
          [user.email, user.name ?? null, user.image ?? null],
        );
        const { rows } = await pool.query<{ id: string; role: UserRole }>(
          'SELECT id, role FROM users WHERE email = $1',
          [user.email],
        );
        if (rows[0]) {
          user.id = rows[0].id;
          user.role = rows[0].role;
        }
      }
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
});
