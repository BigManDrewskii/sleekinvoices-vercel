import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { authHandler } from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // SKIP_AUTH bypass (KEEP THIS!) - Development mode
  if (process.env.SKIP_AUTH === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: SKIP_AUTH is enabled in production"
      );
    }

    const { getUserByOpenId, upsertUser } = await import("../db");

    let devUser = await getUserByOpenId("dev-user-local");

    if (!devUser) {
      await upsertUser({
        openId: "dev-user-local",
        name: "Local Dev User",
        email: "dev@localhost.test",
        loginMethod: "dev",
        lastSignedIn: new Date(),
      });
      devUser = await getUserByOpenId("dev-user-local");
    }

    return {
      req: opts.req,
      res: opts.res,
      user: devUser || null,
    };
  }

  // Auth.js session validation
  try {
    const url = new URL(opts.req.url || "", `http://${opts.req.headers.host}`);
    const request = new Request(url, {
      headers: opts.req.headers as HeadersInit,
      body:
        opts.req.method === "POST" ? JSON.stringify(opts.req.body) : undefined,
    });

    const response = await authHandler(request);
    const sessionData = (await response.json()) as { user?: { id: string } };

    if (sessionData.user?.id) {
      const userId = parseInt(sessionData.user.id);
      const { getUserById } = await import("../db");
      user = await getUserById(userId);
    }
  } catch (error) {
    console.warn("[Auth] Session validation failed:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
