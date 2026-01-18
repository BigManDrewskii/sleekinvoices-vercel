import { eq, and, sql } from "drizzle-orm";
import {
  customFields,
  invoiceCustomFieldValues,
} from "../../drizzle/schema.js";
import { getDb } from "./connection.js";

export async function createCustomField(field: {
  userId: number;
  templateId?: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: "text" | "number" | "date" | "select";
  isRequired?: boolean;
  defaultValue?: string;
  selectOptions?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(customFields).values(field);
  return { success: true };
}

export async function getCustomFieldsByUserId(
  userId: number,
  templateId?: number
) {
  const db = await getDb();
  if (!db) return [];

  if (templateId) {
    // Get fields for specific template or global fields (templateId = null)
    return await db
      .select()
      .from(customFields)
      .where(
        and(
          eq(customFields.userId, userId),
          sql`(${customFields.templateId} = ${templateId} OR ${customFields.templateId} IS NULL)`
        )
      )
      .orderBy(customFields.sortOrder);
  } else {
    // Get all fields for user
    return await db
      .select()
      .from(customFields)
      .where(eq(customFields.userId, userId))
      .orderBy(customFields.sortOrder);
  }
}

export async function getCustomFieldById(fieldId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(customFields)
    .where(and(eq(customFields.id, fieldId), eq(customFields.userId, userId)));

  return results[0] || null;
}

export async function updateCustomField(
  fieldId: number,
  userId: number,
  updates: Partial<{
    fieldName: string;
    fieldLabel: string;
    fieldType: "text" | "number" | "date" | "select";
    isRequired: boolean;
    defaultValue: string;
    selectOptions: string;
    sortOrder: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(customFields)
    .set(updates)
    .where(and(eq(customFields.id, fieldId), eq(customFields.userId, userId)));
}

export async function deleteCustomField(fieldId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all values associated with this field first
  await db
    .delete(invoiceCustomFieldValues)
    .where(eq(invoiceCustomFieldValues.customFieldId, fieldId));

  // Delete the field definition
  await db
    .delete(customFields)
    .where(and(eq(customFields.id, fieldId), eq(customFields.userId, userId)));
}

// ============================================
// Invoice Custom Field Values
// ============================================

export async function setInvoiceCustomFieldValue(
  invoiceId: number,
  customFieldId: number,
  value: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use upsert pattern (insert or update)
  await db
    .insert(invoiceCustomFieldValues)
    .values({ invoiceId, customFieldId, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function getInvoiceCustomFieldValues(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: invoiceCustomFieldValues.id,
      invoiceId: invoiceCustomFieldValues.invoiceId,
      customFieldId: invoiceCustomFieldValues.customFieldId,
      value: invoiceCustomFieldValues.value,
      fieldName: customFields.fieldName,
      fieldLabel: customFields.fieldLabel,
      fieldType: customFields.fieldType,
    })
    .from(invoiceCustomFieldValues)
    .leftJoin(
      customFields,
      eq(invoiceCustomFieldValues.customFieldId, customFields.id)
    )
    .where(eq(invoiceCustomFieldValues.invoiceId, invoiceId));
}

export async function deleteInvoiceCustomFieldValues(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(invoiceCustomFieldValues)
    .where(eq(invoiceCustomFieldValues.invoiceId, invoiceId));
}
