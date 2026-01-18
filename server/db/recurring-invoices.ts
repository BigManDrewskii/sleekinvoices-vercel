import { eq, and, desc, lte } from "drizzle-orm";
import { getDb } from "./connection.js";
import {
  recurringInvoices,
  recurringInvoiceLineItems,
  invoiceGenerationLogs,
  clients,
} from "../../drizzle/schema.js";

// ============================================================================
// RECURRING INVOICES
// ============================================================================

export async function createRecurringInvoice(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(recurringInvoices).values(data);
  const insertedId = Number(result[0].insertId);

  const created = await db
    .select()
    .from(recurringInvoices)
    .where(eq(recurringInvoices.id, insertedId))
    .limit(1);

  return created[0]!;
}

export async function getRecurringInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Join with clients table to get client information
  const results = await db
    .select({
      id: recurringInvoices.id,
      userId: recurringInvoices.userId,
      clientId: recurringInvoices.clientId,
      frequency: recurringInvoices.frequency,
      startDate: recurringInvoices.startDate,
      endDate: recurringInvoices.endDate,
      nextInvoiceDate: recurringInvoices.nextInvoiceDate,
      invoiceNumberPrefix: recurringInvoices.invoiceNumberPrefix,
      taxRate: recurringInvoices.taxRate,
      discountType: recurringInvoices.discountType,
      discountValue: recurringInvoices.discountValue,
      notes: recurringInvoices.notes,
      paymentTerms: recurringInvoices.paymentTerms,
      isActive: recurringInvoices.isActive,
      createdAt: recurringInvoices.createdAt,
      // Client fields
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(recurringInvoices)
    .leftJoin(clients, eq(recurringInvoices.clientId, clients.id))
    .where(eq(recurringInvoices.userId, userId))
    .orderBy(desc(recurringInvoices.createdAt));

  return results;
}

export async function getRecurringInvoiceById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(recurringInvoices)
    .where(
      and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId))
    )
    .limit(1);

  return result[0] || null;
}

export async function updateRecurringInvoice(
  id: number,
  userId: number,
  data: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(recurringInvoices)
    .set(data)
    .where(
      and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId))
    );
}

export async function deleteRecurringInvoice(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete line items first
  await db
    .delete(recurringInvoiceLineItems)
    .where(eq(recurringInvoiceLineItems.recurringInvoiceId, id));

  // Delete recurring invoice
  await db
    .delete(recurringInvoices)
    .where(
      and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId))
    );
}

export async function getRecurringInvoicesDueForGeneration() {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  return db
    .select()
    .from(recurringInvoices)
    .where(
      and(
        eq(recurringInvoices.isActive, true),
        lte(recurringInvoices.nextInvoiceDate, now)
      )
    );
}

export async function createRecurringInvoiceLineItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(recurringInvoiceLineItems).values(data);
}

export async function getRecurringInvoiceLineItems(recurringInvoiceId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(recurringInvoiceLineItems)
    .where(eq(recurringInvoiceLineItems.recurringInvoiceId, recurringInvoiceId))
    .orderBy(recurringInvoiceLineItems.sortOrder);
}

export async function deleteRecurringInvoiceLineItems(
  recurringInvoiceId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(recurringInvoiceLineItems)
    .where(
      eq(recurringInvoiceLineItems.recurringInvoiceId, recurringInvoiceId)
    );
}

export async function getGenerationLogsByRecurringId(
  recurringInvoiceId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(invoiceGenerationLogs)
    .where(eq(invoiceGenerationLogs.recurringInvoiceId, recurringInvoiceId))
    .orderBy(desc(invoiceGenerationLogs.generationDate));
}
