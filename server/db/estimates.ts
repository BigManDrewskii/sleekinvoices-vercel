import { eq, and, sql, desc, lt, inArray } from "drizzle-orm";
import type {
  Estimate,
  EstimateLineItem,
  InsertEstimate,
  InsertEstimateLineItem,
} from "../../drizzle/schema.js";
import {
  estimates,
  estimateLineItems,
  clients,
  invoices,
  invoiceLineItems,
} from "../../drizzle/schema.js";
import { getDb } from "./connection.js";

/**
 * Generate next estimate number for a user
 */
export async function generateEstimateNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const year = new Date().getFullYear();
  const prefix = `EST-${year}-`;

  // Get the highest estimate number for this year
  const lastEstimate = await db
    .select({ estimateNumber: estimates.estimateNumber })
    .from(estimates)
    .where(
      and(
        eq(estimates.userId, userId),
        sql`${estimates.estimateNumber} LIKE ${prefix + "%"}`
      )
    )
    .orderBy(desc(estimates.estimateNumber))
    .limit(1);

  let nextNumber = 1;
  if (lastEstimate.length > 0) {
    const lastNum = parseInt(
      lastEstimate[0].estimateNumber.replace(prefix, ""),
      10
    );
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

/**
 * Create a new estimate
 */
export async function createEstimate(
  estimate: InsertEstimate
): Promise<Estimate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(estimates).values(estimate);
  const insertedId = Number(result[0].insertId);

  const created = await db
    .select()
    .from(estimates)
    .where(eq(estimates.id, insertedId))
    .limit(1);
  return created[0]!;
}

/**
 * Get all estimates for a user
 */
export async function getEstimatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: estimates.id,
      estimateNumber: estimates.estimateNumber,
      status: estimates.status,
      issueDate: estimates.issueDate,
      validUntil: estimates.validUntil,
      total: estimates.total,
      currency: estimates.currency,
      title: estimates.title,
      clientId: estimates.clientId,
      clientName: clients.name,
      clientEmail: clients.email,
      convertedToInvoiceId: estimates.convertedToInvoiceId,
    })
    .from(estimates)
    .leftJoin(clients, eq(estimates.clientId, clients.id))
    .where(eq(estimates.userId, userId))
    .orderBy(desc(estimates.createdAt));

  return results;
}

/**
 * Get a single estimate with line items
 */
export async function getEstimateById(estimateId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [estimate] = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.id, estimateId), eq(estimates.userId, userId)))
    .limit(1);

  if (!estimate) return null;

  const lineItems = await db
    .select()
    .from(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId))
    .orderBy(estimateLineItems.sortOrder);

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, estimate.clientId))
    .limit(1);

  return { estimate, lineItems, client };
}

/**
 * Update an estimate
 */
export async function updateEstimate(
  estimateId: number,
  userId: number,
  data: Partial<InsertEstimate>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(estimates)
    .set(data)
    .where(and(eq(estimates.id, estimateId), eq(estimates.userId, userId)));
}

/**
 * Delete an estimate and its line items
 */
export async function deleteEstimate(estimateId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete line items first
  await db
    .delete(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId));

  // Delete estimate
  await db
    .delete(estimates)
    .where(and(eq(estimates.id, estimateId), eq(estimates.userId, userId)));
}

/**
 * Create estimate line items
 */
export async function createEstimateLineItems(
  items: InsertEstimateLineItem[]
): Promise<EstimateLineItem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (items.length === 0) return [];

  await db.insert(estimateLineItems).values(items);

  // Fetch the created items
  const estimateId = items[0].estimateId;
  return db
    .select()
    .from(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId))
    .orderBy(estimateLineItems.sortOrder);
}

/**
 * Delete all line items for an estimate
 */
export async function deleteEstimateLineItems(estimateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(estimateLineItems)
    .where(eq(estimateLineItems.estimateId, estimateId));
}

/**
 * Convert estimate to invoice
 */
export async function convertEstimateToInvoice(
  estimateId: number,
  userId: number
): Promise<{ invoiceId: number; invoiceNumber: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get estimate with line items
  const estimateData = await getEstimateById(estimateId, userId);
  if (!estimateData) {
    throw new Error("Estimate not found");
  }

  const { estimate, lineItems } = estimateData;

  // Import getNextInvoiceNumber to generate invoice number
  const { getNextInvoiceNumber } = await import("./invoices.js");

  // Generate invoice number
  const invoiceNumber = await getNextInvoiceNumber(userId);

  // Create invoice from estimate
  const invoiceResult = await db.insert(invoices).values({
    userId,
    clientId: estimate.clientId,
    invoiceNumber,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    total: estimate.total,
    subtotal: estimate.subtotal,
    taxAmount: estimate.taxAmount,
    discountAmount: estimate.discountAmount,
    currency: estimate.currency,
    notes: estimate.notes,
    status: "draft",
  });

  const invoiceId = Number(invoiceResult[0].insertId);

  // Create line items
  if (lineItems.length > 0) {
    await db.insert(invoiceLineItems).values(
      lineItems.map(item => ({
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        sortOrder: item.sortOrder,
      }))
    );
  }

  // Mark estimate as converted
  await db
    .update(estimates)
    .set({ convertedToInvoiceId: invoiceId, status: "accepted" })
    .where(eq(estimates.id, estimateId));

  return { invoiceId, invoiceNumber };
}

export async function updateExpiredEstimates(userId: number) {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  try {
    await db
      .update(estimates)
      .set({ status: "expired" })
      .where(
        and(
          eq(estimates.userId, userId),
          inArray(estimates.status, ["draft", "sent", "viewed"]),
          lt(estimates.validUntil, now)
        )
      );
  } catch (error) {
    // Log error but don't throw - this is a background operation
    console.error("Error updating expired estimates:", error);
  }
}
