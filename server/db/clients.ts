import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { getDb } from "./connection.js";
import {
  clients,
  InsertClient,
  Client,
  clientTags,
  InsertClientTag,
  ClientTag,
  clientTagAssignments,
} from "../../drizzle/schema.js";

// ============================================================================
// CLIENT OPERATIONS
// ============================================================================

export async function createClient(client: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values(client);
  const insertedId = Number(result[0].insertId);

  const created = await db
    .select()
    .from(clients)
    .where(eq(clients.id, insertedId))
    .limit(1);
  return created[0]!;
}

export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt));
}

export async function getClientById(
  clientId: number,
  userId: number
): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .limit(1);

  return result[0];
}

export async function updateClient(
  clientId: number,
  userId: number,
  data: Partial<InsertClient>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(clients)
    .set(data)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
}

export async function deleteClient(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
}

/**
 * Get clients by email for duplicate detection during import
 */
export async function getClientsByEmails(
  userId: number,
  emails: string[]
): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  if (emails.length === 0) return [];

  // Normalize emails to lowercase for comparison
  const normalizedEmails = emails.map(e => e.toLowerCase());

  return db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.userId, userId),
        sql`LOWER(${clients.email}) IN (${sql.join(
          normalizedEmails.map(e => sql`${e}`),
          sql`, `
        )})`
      )
    );
}

/**
 * Bulk create clients for import
 * Returns created clients and any errors
 */
export async function bulkCreateClients(
  userId: number,
  clientsData: InsertClient[]
): Promise<{
  created: Client[];
  errors: { index: number; message: string }[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const created: Client[] = [];
  const errors: { index: number; message: string }[] = [];

  // Insert clients one by one to handle individual errors
  for (let i = 0; i < clientsData.length; i++) {
    try {
      const clientData = { ...clientsData[i], userId };
      const result = await db.insert(clients).values(clientData);
      const insertedId = Number(result[0].insertId);

      const [newClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, insertedId))
        .limit(1);

      if (newClient) {
        created.push(newClient);
      }
    } catch (error: any) {
      errors.push({
        index: i,
        message: error.message || "Unknown error",
      });
    }
  }

  return { created, errors };
}

// ============================================================================
// CLIENT TAGS OPERATIONS
// ============================================================================

export async function getClientTagsByUserId(
  userId: number
): Promise<ClientTag[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(clientTags)
    .where(eq(clientTags.userId, userId))
    .orderBy(clientTags.name);
}

export async function createClientTag(
  data: Omit<InsertClientTag, "id" | "createdAt" | "updatedAt">
): Promise<ClientTag> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clientTags).values(data);
  const insertId = result[0].insertId;

  const [tag] = await db
    .select()
    .from(clientTags)
    .where(eq(clientTags.id, insertId));

  return tag;
}

export async function updateClientTag(
  id: number,
  userId: number,
  data: Partial<Pick<ClientTag, "name" | "color" | "description">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(clientTags)
    .set(data)
    .where(and(eq(clientTags.id, id), eq(clientTags.userId, userId)));
}

export async function deleteClientTag(
  id: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First delete all assignments for this tag
  await db
    .delete(clientTagAssignments)
    .where(eq(clientTagAssignments.tagId, id));

  // Then delete the tag itself
  await db
    .delete(clientTags)
    .where(and(eq(clientTags.id, id), eq(clientTags.userId, userId)));
}

export async function getTagsForClient(
  clientId: number,
  userId: number
): Promise<ClientTag[]> {
  const db = await getDb();
  if (!db) return [];

  // First verify the client belongs to this user
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)));

  if (!client) return [];

  // Get all tag assignments for this client
  const assignments = await db
    .select()
    .from(clientTagAssignments)
    .where(eq(clientTagAssignments.clientId, clientId));

  if (assignments.length === 0) return [];

  // Get the actual tags
  const tagIds = assignments.map(a => a.tagId);
  const tags = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.userId, userId), inArray(clientTags.id, tagIds)))
    .orderBy(clientTags.name);

  return tags;
}

export async function assignTagToClient(
  clientId: number,
  tagId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify the client and tag belong to this user
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)));

  if (!client) throw new Error("Client not found");

  const [tag] = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.id, tagId), eq(clientTags.userId, userId)));

  if (!tag) throw new Error("Tag not found");

  // Insert the assignment (will fail silently if already exists due to unique constraint)
  try {
    await db.insert(clientTagAssignments).values({
      clientId,
      tagId,
    });
  } catch (error: any) {
    // Ignore duplicate key errors
    if (!error.message?.includes("Duplicate")) {
      throw error;
    }
  }
}

export async function removeTagFromClient(
  clientId: number,
  tagId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify the client belongs to this user
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)));

  if (!client) throw new Error("Client not found");

  await db
    .delete(clientTagAssignments)
    .where(
      and(
        eq(clientTagAssignments.clientId, clientId),
        eq(clientTagAssignments.tagId, tagId)
      )
    );
}

// Get all clients with their tags for a user
export async function getClientsWithTags(
  userId: number
): Promise<Array<Client & { tags: ClientTag[] }>> {
  const db = await getDb();
  if (!db) return [];

  // Get all clients
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt));

  // Get all tags for this user
  const allTags = await db
    .select()
    .from(clientTags)
    .where(eq(clientTags.userId, userId));

  // Get all tag assignments for this user's clients
  const clientIds = allClients.map(c => c.id);
  if (clientIds.length === 0) return allClients.map(c => ({ ...c, tags: [] }));

  const assignments = await db
    .select()
    .from(clientTagAssignments)
    .where(inArray(clientTagAssignments.clientId, clientIds));

  // Build a map of clientId -> tags
  const tagMap = new Map<number, ClientTag[]>();
  for (const assignment of assignments) {
    const tag = allTags.find(t => t.id === assignment.tagId);
    if (tag) {
      const existing = tagMap.get(assignment.clientId) || [];
      existing.push(tag);
      tagMap.set(assignment.clientId, existing);
    }
  }

  // Combine clients with their tags
  return allClients.map(client => ({
    ...client,
    tags: tagMap.get(client.id) || [],
  }));
}

/**
 * Get clients by tag ID for batch invoice creation
 */
export async function getClientsByTagId(
  tagId: number,
  userId: number
): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  // Verify tag belongs to user
  const [tag] = await db
    .select()
    .from(clientTags)
    .where(and(eq(clientTags.id, tagId), eq(clientTags.userId, userId)))
    .limit(1);

  if (!tag) return [];

  // Get all client IDs with this tag
  const assignments = await db
    .select({ clientId: clientTagAssignments.clientId })
    .from(clientTagAssignments)
    .where(eq(clientTagAssignments.tagId, tagId));

  if (assignments.length === 0) return [];

  const clientIds = assignments.map(a => a.clientId);

  // Get the clients
  return await db
    .select()
    .from(clients)
    .where(and(eq(clients.userId, userId), inArray(clients.id, clientIds)))
    .orderBy(clients.name);
}
