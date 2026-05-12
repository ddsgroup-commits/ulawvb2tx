import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

import { authConfig } from "./auth.config";

// Extend the session and JWT types
declare module "next-auth" {
  interface User {
    role: Role;
    id?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    id: string;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        // The field is called "username" but accepts either the MSSV
        // (student ID) or — for legacy/lecturer accounts — the email.
        username: { label: "MSSV", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const rawUsername = (credentials?.username as string | undefined)?.trim();
        const password = (credentials?.password as string | undefined) ?? "";
        if (!rawUsername || !password) return null;

        // MSSV lookup first (numeric or alphanumeric). Fall back to email
        // so existing email-based accounts (admin/lecturer) still work.
        const isLikelyEmail = rawUsername.includes("@");
        const user = await prisma.user.findFirst({
          where: isLikelyEmail
            ? { email: rawUsername.toLowerCase() }
            : { studentId: rawUsername },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
});
