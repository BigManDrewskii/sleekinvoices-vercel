import type { MySql2Database } from "drizzle-orm/mysql2";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import {
  invoiceTemplates,
  type InsertInvoiceTemplate,
} from "../../../drizzle/schema";
import type { SeededUser } from "./users";
import { TEMPLATE_PRESETS } from "../data/constants";

export interface SeededTemplate {
  id: number;
  userId: number;
  preset: string;
  isDefault: boolean;
}

const TEMPLATE_CONFIGS = {
  sleek: {
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    accentColor: "#60a5fa",
    headingFont: "Inter",
    bodyFont: "Inter",
  },
  modern: {
    primaryColor: "#8b5cf6",
    secondaryColor: "#6d28d9",
    accentColor: "#a78bfa",
    headingFont: "Poppins",
    bodyFont: "Open Sans",
  },
  classic: {
    primaryColor: "#1f2937",
    secondaryColor: "#374151",
    accentColor: "#6b7280",
    headingFont: "Times New Roman",
    bodyFont: "Georgia",
  },
};

export async function seedTemplates(
  db: any,
  seededUsers: SeededUser[]
): Promise<SeededTemplate[]> {
  const templates: InsertInvoiceTemplate[] = [];

  for (const user of seededUsers) {
    for (let i = 0; i < TEMPLATE_PRESETS.length; i++) {
      const preset = TEMPLATE_PRESETS[i]!;
      const config = TEMPLATE_CONFIGS[preset];
      const isDefault = i === 0;

      templates.push({
        userId: user.id,
        name: `${preset.charAt(0).toUpperCase() + preset.slice(1)} Template`,
        templateType: preset,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        headingFont: config.headingFont,
        bodyFont: config.bodyFont,
        logoPosition: "left",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        isDefault,
      });
    }
  }

  const result = await db.insert(invoiceTemplates).values(templates);
  const insertId = Number(result[0].insertId);

  return templates.map((template, index) => ({
    id: insertId + index,
    userId: template.userId,
    preset: template.templateType!,
    isDefault: template.isDefault!,
  }));
}
