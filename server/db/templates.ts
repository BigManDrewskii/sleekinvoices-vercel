import { eq, and } from "drizzle-orm";
import { invoiceTemplates } from "../../drizzle/schema.js";
import { getDb } from "./connection.js";

export async function createInvoiceTemplate(template: {
  userId: number;
  name: string;
  templateType?:
    | "sleek"
    | "modern"
    | "classic"
    | "minimal"
    | "bold"
    | "professional"
    | "creative";
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  fontSize?: number;
  logoUrl?: string;
  logoPosition?: "left" | "center" | "right";
  logoWidth?: number;
  headerLayout?: "standard" | "centered" | "split";
  footerLayout?: "simple" | "detailed" | "minimal";
  showCompanyAddress?: boolean;
  showPaymentTerms?: boolean;
  showTaxField?: boolean;
  showDiscountField?: boolean;
  showNotesField?: boolean;
  footerText?: string;
  language?: string;
  dateFormat?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If this template is being set as default, unset other defaults first
  if (template.isDefault) {
    await db
      .update(invoiceTemplates)
      .set({ isDefault: false })
      .where(eq(invoiceTemplates.userId, template.userId));
  }

  const result = await db.insert(invoiceTemplates).values(template);
  return result;
}

export async function getInvoiceTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(invoiceTemplates)
    .where(eq(invoiceTemplates.userId, userId));
}

export async function getInvoiceTemplateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(invoiceTemplates)
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId))
    )
    .limit(1);

  return result[0];
}

export async function updateInvoiceTemplate(
  id: number,
  userId: number,
  updates: Partial<{
    name: string;
    templateType:
      | "modern"
      | "classic"
      | "minimal"
      | "bold"
      | "professional"
      | "creative";
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
    fontSize: number;
    logoUrl: string;
    logoPosition: "left" | "center" | "right";
    logoWidth: number;
    headerLayout: "standard" | "centered" | "split";
    footerLayout: "simple" | "detailed" | "minimal";
    showCompanyAddress: boolean;
    showPaymentTerms: boolean;
    showTaxField: boolean;
    showDiscountField: boolean;
    showNotesField: boolean;
    footerText: string;
    language: string;
    dateFormat: string;
    isDefault: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If setting as default, unset other defaults first
  if (updates.isDefault) {
    await db
      .update(invoiceTemplates)
      .set({ isDefault: false })
      .where(eq(invoiceTemplates.userId, userId));
  }

  await db
    .update(invoiceTemplates)
    .set(updates as any)
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId))
    );
}

export async function deleteInvoiceTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if this is the default template
  const template = await getInvoiceTemplateById(id, userId);
  if (!template) {
    throw new Error("Template not found");
  }

  if (template.isDefault) {
    throw new Error(
      "Cannot delete default template. Set another template as default first."
    );
  }

  await db
    .delete(invoiceTemplates)
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId))
    );
}

export async function setDefaultTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Unset all other defaults
  await db
    .update(invoiceTemplates)
    .set({ isDefault: false })
    .where(eq(invoiceTemplates.userId, userId));

  // Set the new default
  await db
    .update(invoiceTemplates)
    .set({ isDefault: true })
    .where(
      and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId))
    );
}

export async function getDefaultTemplate(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(invoiceTemplates)
    .where(
      and(
        eq(invoiceTemplates.userId, userId),
        eq(invoiceTemplates.isDefault, true)
      )
    );

  return results[0] || null;
}
