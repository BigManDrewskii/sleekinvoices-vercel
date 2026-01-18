import { eq } from "drizzle-orm";
import { getDb } from "./connection.js";
import {
  invoiceLineItems,
  InsertInvoiceLineItem,
  InvoiceLineItem,
} from "../../drizzle/schema.js";

// ============================================================================
// LINE ITEM OPERATIONS
// ============================================================================

export async function createLineItem(
  lineItem: InsertInvoiceLineItem
): Promise<InvoiceLineItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoiceLineItems).values(lineItem);
  const insertedId = Number(result[0].insertId);

  const created = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.id, insertedId))
    .limit(1);
  return created[0]!;
}

export async function getLineItemsByInvoiceId(
  invoiceId: number
): Promise<InvoiceLineItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(invoiceLineItems.sortOrder);
}

export async function deleteLineItem(lineItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, lineItemId));
}

export async function deleteLineItemsByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));
}
