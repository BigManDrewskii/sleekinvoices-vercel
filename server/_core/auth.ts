import type { AuthConfig } from "@auth/core";
import { Auth } from "@auth/core";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Google from "@auth/core/providers/google";
import GitHub from "@auth/core/providers/github";
import { getDb } from "../db/connection";
import { users, accounts, sessions } from "../../drizzle/schema";

export async function authHandler(request: Request) {
  const db = await getDb();
  return Auth(request, {
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
    }),
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      }),
    ],
    secret: process.env.AUTH_SECRET!,
    session: {
      strategy: "jwt",
      maxAge: 365 * 24 * 60 * 60,
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    callbacks: {
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
      async jwt({ token, user, account }) {
        if (user && account) {
          token.sub = user.id.toString();
          token.provider = account.provider;
        }
        return token;
      },
    },
  });
}
