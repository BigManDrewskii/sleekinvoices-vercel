import { eq, and, desc, inArray, sql } from "drizzle-orm";
import type {
  BatchInvoiceTemplate,
  BatchInvoiceTemplateLineItem,
  InsertBatchInvoiceTemplate,
} from "../../drizzle/schema.js";
import {
  batchInvoiceTemplates,
  batchInvoiceTemplateLineItems,
} from "../../drizzle/schema.js";
import { getDb } from "./connection.js";

export async function getBatchInvoiceTemplates(
  userId: number
): Promise<BatchInvoiceTemplate[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(batchInvoiceTemplates)
    .where(eq(batchInvoiceTemplates.userId, userId))
    .orderBy(
      desc(batchInvoiceTemplates.lastUsedAt),
      desc(batchInvoiceTemplates.createdAt)
    );
}

/**
 * Get a single batch invoice template with its line items
 */
export async function getBatchInvoiceTemplateById(
  templateId: number,
  userId: number
): Promise<{
  template: BatchInvoiceTemplate;
  lineItems: BatchInvoiceTemplateLineItem[];
} | null> {
  const db = await getDb();
  if (!db) return null;

  const [template] = await db
    .select()
    .from(batchInvoiceTemplates)
    .where(
      and(
        eq(batchInvoiceTemplates.id, templateId),
        eq(batchInvoiceTemplates.userId, userId)
      )
    )
    .limit(1);

  if (!template) return null;

  const lineItems = await db
    .select()
    .from(batchInvoiceTemplateLineItems)
    .where(eq(batchInvoiceTemplateLineItems.templateId, templateId))
    .orderBy(batchInvoiceTemplateLineItems.sortOrder);

  return { template, lineItems };
}

/**
 * Create a new batch invoice template with line items
 */
export async function createBatchInvoiceTemplate(
  data: Omit<
    InsertBatchInvoiceTemplate,
    "id" | "createdAt" | "updatedAt" | "usageCount" | "lastUsedAt"
  >,
  lineItems: Array<{ description: string; quantity: string; rate: string }>
): Promise<BatchInvoiceTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create template
  const result = await db.insert(batchInvoiceTemplates).values({
    ...data,
    usageCount: 0,
  });

  const templateId = Number(result[0].insertId);

  // Create line items
  if (lineItems.length > 0) {
    await db.insert(batchInvoiceTemplateLineItems).values(
      lineItems.map((item, index) => ({
        templateId,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        sortOrder: index,
      }))
    );
  }

  const [template] = await db
    .select()
    .from(batchInvoiceTemplates)
    .where(eq(batchInvoiceTemplates.id, templateId))
    .limit(1);

  return template;
}

/**
 * Update a batch invoice template
 */
export async function updateBatchInvoiceTemplate(
  templateId: number,
  userId: number,
  data: Partial<
    Pick<
      BatchInvoiceTemplate,
      | "name"
      | "description"
      | "dueInDays"
      | "currency"
      | "taxRate"
      | "invoiceTemplateId"
      | "notes"
      | "paymentTerms"
      | "frequency"
    >
  >,
  lineItems?: Array<{ description: string; quantity: string; rate: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update template
  await db
    .update(batchInvoiceTemplates)
    .set(data)
    .where(
      and(
        eq(batchInvoiceTemplates.id, templateId),
        eq(batchInvoiceTemplates.userId, userId)
      )
    );

  // Update line items if provided
  if (lineItems !== undefined) {
    // Delete existing line items
    await db
      .delete(batchInvoiceTemplateLineItems)
      .where(eq(batchInvoiceTemplateLineItems.templateId, templateId));

    // Insert new line items
    if (lineItems.length > 0) {
      await db.insert(batchInvoiceTemplateLineItems).values(
        lineItems.map((item, index) => ({
          templateId,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          sortOrder: index,
        }))
      );
    }
  }
}

/**
 * Delete a batch invoice template and its line items
 */
export async function deleteBatchInvoiceTemplate(
  templateId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify ownership
  const [template] = await db
    .select()
    .from(batchInvoiceTemplates)
    .where(
      and(
        eq(batchInvoiceTemplates.id, templateId),
        eq(batchInvoiceTemplates.userId, userId)
      )
    )
    .limit(1);

  if (!template) throw new Error("Template not found");

  // Delete line items first
  await db
    .delete(batchInvoiceTemplateLineItems)
    .where(eq(batchInvoiceTemplateLineItems.templateId, templateId));

  // Delete template
  await db
    .delete(batchInvoiceTemplates)
    .where(eq(batchInvoiceTemplates.id, templateId));
}

/**
 * Increment usage count and update lastUsedAt for a batch template
 */
export async function incrementBatchTemplateUsage(
  templateId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(batchInvoiceTemplates)
    .set({
      usageCount: sql`${batchInvoiceTemplates.usageCount} + 1`,
      lastUsedAt: new Date(),
    })
    .where(
      and(
        eq(batchInvoiceTemplates.id, templateId),
        eq(batchInvoiceTemplates.userId, userId)
      )
    );
}

/**
 * Get batch template line items for a template
 */
export async function getBatchTemplateLineItems(
  templateId: number
): Promise<BatchInvoiceTemplateLineItem[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(batchInvoiceTemplateLineItems)
    .where(eq(batchInvoiceTemplateLineItems.templateId, templateId))
    .orderBy(batchInvoiceTemplateLineItems.sortOrder);
}

/**
 * Create batch template line items
 */
export async function createBatchTemplateLineItems(
  templateId: number,
  items: Array<{ description: string; quantity: string; rate: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (items.length === 0) return;

  await db.insert(batchInvoiceTemplateLineItems).values(
    items.map((item, index) => ({
      templateId,
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      sortOrder: index,
    }))
  );
}

/**
 * Delete batch template line items
 */
export async function deleteBatchTemplateLineItems(
  templateId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(batchInvoiceTemplateLineItems)
    .where(eq(batchInvoiceTemplateLineItems.templateId, templateId));
}

/**
 * Update batch template line items (replaces all line items for template)
 */
export async function updateBatchTemplateLineItems(
  templateId: number,
  items: Array<{ description: string; quantity: string; rate: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing line items
  await deleteBatchTemplateLineItems(templateId);

  // Create new line items
  await createBatchTemplateLineItems(templateId, items);
}
