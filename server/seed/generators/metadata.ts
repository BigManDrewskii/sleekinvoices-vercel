import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  clientTags,
  clientTagAssignments,
  expenseCategories,
  usageTracking,
  aiCredits,
  reminderSettings,
  customFields,
  batchInvoiceTemplates,
  batchInvoiceTemplateLineItems,
} from "../../../drizzle/schema";
import type { SeededUser } from "./users";
import type { SeededClient } from "./clients";
import {
  CLIENT_TAGS,
  EXPENSE_CATEGORIES,
  INVOICE_LINE_ITEMS,
} from "../data/realistic-data";
import { SEED_CONFIG, CUSTOM_FIELD_TYPES } from "../data/constants";
import { randomChoice, randomChoices, randomInt } from "../utils";
import { DEFAULT_REMINDER_TEMPLATE } from "../../email";

export interface SeededTag {
  id: number;
  userId: number;
  name: string;
}

export interface SeededExpenseCategory {
  id: number;
  userId: number;
  name: string;
}

export interface SeededCustomField {
  id: number;
  userId: number;
  name: string;
  type: string;
}

export interface SeededBatchTemplate {
  id: number;
  userId: number;
  name: string;
}

export async function seedMetadata(
  db: any,
  seededUsers: SeededUser[],
  seededClients: SeededClient[]
): Promise<{
  tags: SeededTag[];
  categories: SeededExpenseCategory[];
  customFields: SeededCustomField[];
  batchTemplates: SeededBatchTemplate[];
}> {
  const tags = await seedClientTags(db, seededUsers, seededClients);
  const categories = await seedExpenseCategories(db, seededUsers);
  await seedUsageTracking(db, seededUsers);
  await seedAiCredits(db, seededUsers);
  await seedReminderSettings(db, seededUsers);
  const customFields = await seedCustomFields(db, seededUsers);
  const batchTemplates = await seedBatchTemplates(db, seededUsers);

  return { tags, categories, customFields, batchTemplates };
}

async function seedClientTags(
  db: any,
  seededUsers: SeededUser[],
  seededClients: SeededClient[]
): Promise<SeededTag[]> {
  const allTags = [];

  for (const user of seededUsers) {
    for (const tag of CLIENT_TAGS) {
      allTags.push({
        userId: user.id,
        name: tag.name,
        color: tag.color,
      });
    }
  }

  const result = await db.insert(clientTags).values(allTags);
  const insertId = Number(result[0].insertId);

  const seededTags = allTags.map((tag, index) => ({
    id: insertId + index,
    userId: tag.userId,
    name: tag.name,
  }));

  await seedClientTagAssignments(db, seededTags, seededClients);

  return seededTags;
}

async function seedClientTagAssignments(
  db: any,
  seededTags: SeededTag[],
  seededClients: SeededClient[]
): Promise<void> {
  const assignments = [];

  for (const client of seededClients) {
    const userTags = seededTags.filter(tag => tag.userId === client.userId);
    const numTags = Math.random() < 0.5 ? randomInt(1, 2) : 0;

    if (numTags > 0 && userTags.length > 0) {
      const selectedTags = randomChoices(
        userTags,
        Math.min(numTags, userTags.length)
      );
      for (const tag of selectedTags) {
        assignments.push({
          clientId: client.id,
          tagId: tag.id,
        });
      }
    }
  }

  if (assignments.length > 0) {
    await db.insert(clientTagAssignments).values(assignments);
  }
}

async function seedExpenseCategories(
  db: any,
  seededUsers: SeededUser[]
): Promise<SeededExpenseCategory[]> {
  const allCategories = [];

  for (const user of seededUsers) {
    for (const category of EXPENSE_CATEGORIES) {
      allCategories.push({
        userId: user.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
      });
    }
  }

  const result = await db.insert(expenseCategories).values(allCategories);
  const insertId = Number(result[0].insertId);

  return allCategories.map((category, index) => ({
    id: insertId + index,
    userId: category.userId,
    name: category.name,
  }));
}

async function seedUsageTracking(
  db: any,
  seededUsers: SeededUser[]
): Promise<void> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const trackingData = [];

  for (const user of seededUsers) {
    let invoicesCreated = 0;
    if (user.subscriptionStatus === "free") {
      invoicesCreated = randomInt(1, 3);
    } else {
      invoicesCreated = randomInt(15, 30);
    }

    trackingData.push({
      userId: user.id,
      month: currentMonth,
      invoicesCreated,
    });

    for (let i = 1; i <= 3; i++) {
      const pastMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${pastMonth.getFullYear()}-${String(pastMonth.getMonth() + 1).padStart(2, "0")}`;

      trackingData.push({
        userId: user.id,
        month: monthStr,
        invoicesCreated:
          user.subscriptionStatus === "free"
            ? randomInt(0, 3)
            : randomInt(10, 40),
      });
    }
  }

  await db.insert(usageTracking).values(trackingData);
}

async function seedAiCredits(
  db: any,
  seededUsers: SeededUser[]
): Promise<void> {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const creditsData = [];

  for (const user of seededUsers) {
    const creditsLimit = user.subscriptionStatus === "free" ? 5 : 50;
    const creditsUsed = randomInt(
      Math.floor(creditsLimit * 0.3),
      Math.floor(creditsLimit * 0.7)
    );

    creditsData.push({
      userId: user.id,
      month: currentMonth,
      creditsUsed,
      creditsLimit,
    });
  }

  await db.insert(aiCredits).values(creditsData);
}

async function seedReminderSettings(
  db: any,
  seededUsers: SeededUser[]
): Promise<void> {
  const settingsData = seededUsers.map(user => ({
    userId: user.id,
    enabled: 1,
    intervals: JSON.stringify([3, 7, 14]),
    emailTemplate: DEFAULT_REMINDER_TEMPLATE,
    ccEmail: user.email,
  }));

  await db.insert(reminderSettings).values(settingsData);
}

async function seedCustomFields(
  db: any,
  seededUsers: SeededUser[]
): Promise<SeededCustomField[]> {
  const allFields = [];

  const fieldNames = [
    "Project Code",
    "Purchase Order",
    "Department",
    "Delivery Date",
    "Payment Method",
  ];

  for (const user of seededUsers) {
    for (let i = 0; i < SEED_CONFIG.customFieldsPerUser; i++) {
      const fieldType = CUSTOM_FIELD_TYPES[i % CUSTOM_FIELD_TYPES.length]!;
      const fieldName = fieldNames[i]!;

      let selectOptions = null;
      if (fieldType === "select") {
        selectOptions = JSON.stringify(["Option 1", "Option 2", "Option 3"]);
      }

      allFields.push({
        userId: user.id,
        fieldName,
        fieldLabel: fieldName,
        fieldType,
        selectOptions,
        isRequired: false,
      });
    }
  }

  const result = await db.insert(customFields).values(allFields);
  const insertId = Number(result[0].insertId);

  return allFields.map((field, index) => ({
    id: insertId + index,
    userId: field.userId,
    name: field.fieldName,
    type: field.fieldType,
  }));
}

async function seedBatchTemplates(
  db: any,
  seededUsers: SeededUser[]
): Promise<SeededBatchTemplate[]> {
  const allTemplates = [];

  for (const user of seededUsers) {
    allTemplates.push({
      userId: user.id,
      name: "Monthly Retainer",
      description: "Standard monthly retainer invoice",
      frequency: "monthly" as const,
    });

    allTemplates.push({
      userId: user.id,
      name: "Project Milestone",
      description: "One-time project milestone invoice",
      frequency: null,
    });
  }

  const result = await db.insert(batchInvoiceTemplates).values(allTemplates);
  const insertId = Number(result[0].insertId);

  const seededTemplates = allTemplates.map((template, index) => ({
    id: insertId + index,
    userId: template.userId,
    name: template.name,
  }));

  await seedBatchTemplateLineItems(db, seededTemplates);

  return seededTemplates;
}

async function seedBatchTemplateLineItems(
  db: any,
  seededTemplates: SeededBatchTemplate[]
): Promise<void> {
  const allLineItems = [];

  for (const template of seededTemplates) {
    const numItems = randomInt(2, 4);
    for (let i = 0; i < numItems; i++) {
      const lineItem = randomChoice(INVOICE_LINE_ITEMS);
      allLineItems.push({
        batchTemplateId: template.id,
        description: lineItem.description,
        quantity: String(lineItem.quantity),
        rate: String(lineItem.rate),
        sortOrder: i,
      });
    }
  }

  await db.insert(batchInvoiceTemplateLineItems).values(allLineItems);
}
