import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  clients,
  clientPortalAccess,
  type InsertClient,
} from "../../../drizzle/schema";
import type { SeededUser } from "./users";
import { CLIENTS } from "../data/realistic-data";
import { SEED_CONFIG } from "../data/constants";
import { nanoid } from "nanoid";

export interface SeededClient {
  id: number;
  userId: number;
  name: string;
  email: string;
}

export async function seedClients(
  db: any,
  seededUsers: SeededUser[]
): Promise<SeededClient[]> {
  const allClients: InsertClient[] = [];
  const now = new Date();

  for (const user of seededUsers) {
    for (let i = 0; i < SEED_CONFIG.clientsPerUser; i++) {
      const clientData = CLIENTS[i % CLIENTS.length]!;
      allClients.push({
        userId: user.id,
        name: clientData.name,
        email: clientData.email,
        companyName: clientData.companyName,
        address: clientData.address,
        phone: clientData.phone,
        vatNumber: clientData.vatNumber,
        taxExempt: clientData.taxExempt,
        createdAt: new Date(
          now.getTime() -
            (SEED_CONFIG.clientsPerUser - i) * 10 * 24 * 60 * 60 * 1000
        ),
        updatedAt: now,
      });
    }
  }

  const result = await db.insert(clients).values(allClients);
  const insertId = Number(result[0].insertId);

  const seededClients = allClients.map((client, index) => ({
    id: insertId + index,
    userId: client.userId,
    name: client.name,
    email: client.email!,
  }));

  await seedClientPortalAccess(db, seededClients);

  return seededClients;
}

async function seedClientPortalAccess(
  db: any,
  seededClients: SeededClient[]
): Promise<void> {
  const portalAccessData = [];
  const now = new Date();

  for (const client of seededClients) {
    const shouldHaveAccess = Math.random() < 0.5;
    if (shouldHaveAccess) {
      const isActive = Math.random() < 0.8;
      portalAccessData.push({
        clientId: client.id,
        accessToken: nanoid(32),
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        expiresAt: isActive
          ? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        lastAccessedAt: isActive
          ? new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          : null,
        isActive: isActive ? 1 : 0,
      });
    }
  }

  if (portalAccessData.length > 0) {
    await db.insert(clientPortalAccess).values(portalAccessData);
  }
}
