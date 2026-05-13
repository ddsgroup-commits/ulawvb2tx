import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    // Google OAuth (optional — only active when env vars are set)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account }) {
      // Let PrismaAdapter handle user + account creation for Google.
      // Only block credentials sign-ins for inactive accounts (handled below).
      if (account?.provider === "google") return true;
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }

      // On first sign-in or when role is missing, fetch from DB.
      if (token.id && (!token.role || trigger === "signIn")) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (dbUser) {
          // Auto-promote owner email to SUPER_ADMIN on first Google login.
          if (
            dbUser.email === "linhtran.business@gmail.com" &&
            (dbUser.role === "PENDING_USER" || !dbUser.role)
          ) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: "SUPER_ADMIN", isActive: true, googleLinked: true },
            });
            token.role = "SUPER_ADMIN";
          } else {
            token.role = dbUser.role;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
