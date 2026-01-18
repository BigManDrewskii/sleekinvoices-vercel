import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./connection";
import { clientPortalAccess, clients, invoices } from "../../drizzle/schema";

export async function createClientPortalAccess(
  clientId: number
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { nanoid } = await import("nanoid");

  // Generate unique access token
  const accessToken = nanoid(32);

  // Token expires in 90 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await db.insert(clientPortalAccess).values({
    clientId,
    accessToken,
    expiresAt,
    isActive: 1,
  });

  return accessToken;
}

export async function getClientByAccessToken(accessToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      client: clients,
      access: clientPortalAccess,
    })
    .from(clientPortalAccess)
    .innerJoin(clients, eq(clients.id, clientPortalAccess.clientId))
    .where(eq(clientPortalAccess.accessToken, accessToken))
    .limit(1);

  if (result.length === 0) return null;

  const { client, access } = result[0]!;

  // Check if token is expired or inactive
  if (!access.isActive || new Date() > access.expiresAt) {
    return null;
  }

  // Update last accessed time
  await db
    .update(clientPortalAccess)
    .set({ lastAccessedAt: new Date() })
    .where(eq(clientPortalAccess.accessToken, accessToken));

  return client;
}

export async function getClientInvoices(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, clientId))
    .orderBy(desc(invoices.createdAt));
}

export async function getActiveClientPortalAccess(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(clientPortalAccess)
    .where(
      and(
        eq(clientPortalAccess.clientId, clientId),
        eq(clientPortalAccess.isActive, 1)
      )
    )
    .orderBy(desc(clientPortalAccess.createdAt))
    .limit(1);

  if (result.length === 0) return null;

  const access = result[0]!;

  // Check if expired
  if (new Date() > access.expiresAt) {
    return null;
  }

  return access;
}

export async function revokeClientPortalAccess(accessToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(clientPortalAccess)
    .set({ isActive: 0 })
    .where(eq(clientPortalAccess.accessToken, accessToken));
}
