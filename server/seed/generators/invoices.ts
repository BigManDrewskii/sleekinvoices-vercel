import type { MySql2Database } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  invoices,
  invoiceViews,
  invoiceCustomFieldValues,
  recurringInvoices,
  recurringInvoiceLineItems,
  invoiceGenerationLogs,
  estimates,
  estimateLineItems,
  type InsertRecurringInvoice,
  type InsertEstimate,
} from "../../../drizzle/schema";
import type { SeededUser } from "./users";
import type { SeededClient } from "./clients";
import type { SeededProduct } from "./products";
import type { SeededTemplate } from "./templates";
import type { SeededCustomField } from "./metadata";
import {
  SEED_CONFIG,
  INVOICE_STATUS_DISTRIBUTION,
  DISCOUNT_TYPE_DISTRIBUTION,
  TAX_RATE_DISTRIBUTION,
  ESTIMATE_STATUS_DISTRIBUTION,
  RECURRING_FREQUENCY_DISTRIBUTION,
} from "../data/constants";
import {
  INVOICE_NOTES,
  PAYMENT_TERMS,
  INVOICE_LINE_ITEMS,
} from "../data/realistic-data";
import {
  randomInt,
  randomChoice,
  randomChoices,
  weightedChoice,
  generateInvoiceNumber,
  generateEstimateNumber,
  generateDateDistribution,
} from "../utils";
import { nanoid } from "nanoid";
import { appRouter } from "../../routers";
import type { TrpcContext } from "../../_core/context";

export interface SeededInvoice {
  id: number;
  userId: number;
  clientId: number;
  invoiceNumber: string;
  status: string;
  total: string;
}

export interface SeededEstimate {
  id: number;
  userId: number;
  clientId: number;
  estimateNumber: string;
  status: string;
}

export async function seedInvoices(
  db: any,
  seededUsers: SeededUser[],
  seededClients: SeededClient[],
  seededProducts: SeededProduct[],
  seededTemplates: SeededTemplate[],
  seededCustomFields: SeededCustomField[]
): Promise<SeededInvoice[]> {
  const allInvoices: SeededInvoice[] = [];

  for (const user of seededUsers) {
    const userClients = seededClients.filter(c => c.userId === user.id);
    const userProducts = seededProducts.filter(p => p.userId === user.id);
    const userTemplates = seededTemplates.filter(t => t.userId === user.id);
    const userCustomFields = seededCustomFields.filter(
      f => f.userId === user.id
    );

    const statusCounts = { ...INVOICE_STATUS_DISTRIBUTION };
    const dates = generateDateDistribution(SEED_CONFIG.invoicesPerUser);

    for (let i = 0; i < SEED_CONFIG.invoicesPerUser; i++) {
      const status = getNextStatus(statusCounts);
      const client = randomChoice(userClients);
      const template = randomChoice(userTemplates);
      const issueDate = dates[i]!;
      const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const numLineItems = randomInt(1, 5);
      const lineItems = [];
      for (let j = 0; j < numLineItems; j++) {
        if (Math.random() < 0.7 && userProducts.length > 0) {
          const product = randomChoice(userProducts);
          lineItems.push({
            description: randomChoice(INVOICE_LINE_ITEMS).description,
            quantity: randomInt(1, 20),
            rate: Number(product.rate),
          });
        } else {
          const item = randomChoice(INVOICE_LINE_ITEMS);
          lineItems.push({
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
          });
        }
      }

      const discountType = weightedChoice(
        ["percentage", "fixed", "none"] as const,
        [
          DISCOUNT_TYPE_DISTRIBUTION.percentage,
          DISCOUNT_TYPE_DISTRIBUTION.fixed,
          DISCOUNT_TYPE_DISTRIBUTION.none,
        ]
      );

      let discountValue = 0;
      if (discountType === "percentage") {
        discountValue = randomChoice([5, 10, 15, 20]);
      } else if (discountType === "fixed") {
        discountValue = randomChoice([50, 100, 250, 500]);
      }

      const taxRate = weightedChoice(
        [0, 10, 20],
        [
          TAX_RATE_DISTRIBUTION[0],
          TAX_RATE_DISTRIBUTION[10],
          TAX_RATE_DISTRIBUTION[20],
        ]
      );

      const ctx: TrpcContext = {
        user: {
          id: user.id,
          openId: user.openId,
          email: user.email,
          name: user.name,
          loginMethod: "manus",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
          avatarUrl: null,
          avatarType: null,
          companyName: null,
          baseCurrency: "USD",
          companyAddress: null,
          companyPhone: null,
          logoUrl: null,
          taxId: null,
          defaultInvoiceStyle: "receipt",
          stripeCustomerId: null,
          subscriptionStatus: user.subscriptionStatus as any,
          subscriptionId: null,
          currentPeriodEnd: null,
          subscriptionEndDate: null,
          subscriptionSource: null,
        },
        req: {
          protocol: "https",
          headers: {},
        } as any,
        res: {
          clearCookie: () => {},
        } as any,
      };

      const caller = appRouter.createCaller(ctx);

      try {
        const invoice = await caller.invoices.create({
          clientId: client.id,
          invoiceNumber: generateInvoiceNumber(i),
          status: status as any,
          issueDate,
          dueDate,
          lineItems,
          taxRate,
          discountType: discountType === "none" ? "percentage" : discountType,
          discountValue,
          notes: randomChoice(INVOICE_NOTES),
          paymentTerms: randomChoice(PAYMENT_TERMS),
          templateId: template.id,
        });

        allInvoices.push({
          id: invoice.id,
          userId: user.id,
          clientId: client.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          total: invoice.total,
        });

        await seedInvoiceViews(db, invoice.id);

        if (userCustomFields.length > 0 && Math.random() < 0.2) {
          await seedInvoiceCustomFieldValues(db, invoice.id, userCustomFields);
        }
      } catch (error) {
        console.error(
          `Failed to create invoice ${i} for user ${user.id}:`,
          error
        );
      }
    }
  }

  return allInvoices;
}

async function seedInvoiceViews(db: any, invoiceId: number): Promise<void> {
  const viewCount = randomInt(1, 5);
  const now = new Date();

  for (let i = 0; i < viewCount; i++) {
    await db.insert(invoiceViews).values({
      invoiceId,
      viewedAt: new Date(
        now.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000
      ),
      ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(0, 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      isFirstView: i === 0,
    });
  }
}

async function seedInvoiceCustomFieldValues(
  db: any,
  invoiceId: number,
  customFields: SeededCustomField[]
): Promise<void> {
  const fieldsToUse = randomChoices(
    customFields,
    Math.min(2, customFields.length)
  );

  for (const field of fieldsToUse) {
    let value = "";
    if (field.type === "text") {
      value = `Sample text for ${field.name}`;
    } else if (field.type === "number") {
      value = String(randomInt(100, 9999));
    } else if (field.type === "date") {
      value = new Date().toISOString().split("T")[0]!;
    } else if (field.type === "select") {
      value = "Option 1";
    }

    await db.insert(invoiceCustomFieldValues).values({
      invoiceId,
      customFieldId: field.id,
      value,
    });
  }
}

export async function seedRecurringInvoices(
  db: any,
  seededUsers: SeededUser[],
  seededClients: SeededClient[]
): Promise<void> {
  for (const user of seededUsers) {
    const userClients = seededClients.filter(c => c.userId === user.id);

    const frequencyCounts = { ...RECURRING_FREQUENCY_DISTRIBUTION };

    for (let i = 0; i < SEED_CONFIG.recurringInvoicesPerUser; i++) {
      const frequency = getNextFrequency(frequencyCounts);
      const client = randomChoice(userClients);
      const hasEndDate = Math.random() < 0.4;

      const now = new Date();
      const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const endDate = hasEndDate
        ? new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
        : null;

      let nextGenerationDate: Date;
      if (frequency === "weekly") {
        nextGenerationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (frequency === "monthly") {
        nextGenerationDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else {
        nextGenerationDate = new Date(now.getFullYear() + 1, 0, 1);
      }

      const recurringData: InsertRecurringInvoice = {
        userId: user.id,
        clientId: client.id,
        frequency,
        startDate,
        endDate,
        nextInvoiceDate: nextGenerationDate,
        lastGeneratedAt: startDate,
        isActive: true,
        invoiceNumberPrefix: "INV",
        taxRate: "0",
        discountType: "percentage",
        discountValue: "0",
      };

      const result = await db.insert(recurringInvoices).values([recurringData]);
      const recurringId = Number(result[0].insertId);

      const numItems = randomInt(2, 4);
      const lineItems = [];
      for (let j = 0; j < numItems; j++) {
        const item = randomChoice(INVOICE_LINE_ITEMS);
        lineItems.push({
          recurringInvoiceId: recurringId,
          description: item.description,
          quantity: String(item.quantity),
          rate: String(item.rate),
          sortOrder: j,
        });
      }

      await db.insert(recurringInvoiceLineItems).values(lineItems);

      await seedInvoiceGenerationLogs(db, recurringId);
    }
  }
}

async function seedInvoiceGenerationLogs(
  db: any,
  recurringInvoiceId: number
): Promise<void> {
  const numLogs = randomInt(3, 10);
  const now = new Date();

  for (let i = 0; i < numLogs; i++) {
    const success = Math.random() < 0.9;
    await db.insert(invoiceGenerationLogs).values({
      recurringInvoiceId,
      generationDate: new Date(
        now.getTime() - (numLogs - i) * 7 * 24 * 60 * 60 * 1000
      ),
      status: success ? "success" : "failed",
      generatedInvoiceId: success ? randomInt(1, 100) : null,
      errorMessage: success
        ? null
        : "Failed to generate invoice due to validation error",
    });
  }
}

export async function seedEstimates(
  db: any,
  seededUsers: SeededUser[],
  seededClients: SeededClient[]
): Promise<SeededEstimate[]> {
  const allEstimates: SeededEstimate[] = [];

  for (const user of seededUsers) {
    const userClients = seededClients.filter(c => c.userId === user.id);

    const statusCounts = { ...ESTIMATE_STATUS_DISTRIBUTION };

    for (let i = 0; i < SEED_CONFIG.estimatesPerUser; i++) {
      const status = getNextEstimateStatus(statusCounts);
      const client = randomChoice(userClients);
      const now = new Date();
      const issueDate = new Date(
        now.getTime() - randomInt(30, 90) * 24 * 60 * 60 * 1000
      );
      const expiryDate = new Date(
        issueDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      const estimateData: InsertEstimate = {
        userId: user.id,
        clientId: client.id,
        estimateNumber: generateEstimateNumber(i),
        status: status as any,
        currency: "USD",
        subtotal: "0",
        taxRate: "10",
        taxAmount: "0",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0",
        total: "1000.00",
        notes: "This is an estimate. Valid for 30 days.",
        issueDate,
        validUntil: expiryDate,
        sentAt: status !== "draft" ? issueDate : null,
        convertedToInvoiceId:
          status === "accepted" && Math.random() < 0.5
            ? randomInt(1, 50)
            : null,
      };

      const result = await db.insert(estimates).values([estimateData]);
      const estimateId = Number(result[0].insertId);

      const numItems = randomInt(2, 5);
      const lineItems = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const item = randomChoice(INVOICE_LINE_ITEMS);
        const amount = item.quantity * item.rate;
        subtotal += amount;

        lineItems.push({
          estimateId,
          description: item.description,
          quantity: String(item.quantity),
          rate: String(item.rate),
          amount: String(amount),
          sortOrder: j,
        });
      }

      await db.insert(estimateLineItems).values(lineItems);

      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      await db
        .update(estimates)
        .set({
          subtotal: String(subtotal),
          taxAmount: String(tax),
          total: String(total),
        })
        .where(eq(estimates.id, estimateId));

      allEstimates.push({
        id: estimateId,
        userId: user.id,
        clientId: client.id,
        estimateNumber: estimateData.estimateNumber,
        status: estimateData.status || "draft",
      });
    }
  }

  return allEstimates;
}

function getNextStatus(statusCounts: Record<string, number>): string {
  for (const [status, count] of Object.entries(statusCounts)) {
    if (count > 0) {
      statusCounts[status]--;
      return status;
    }
  }
  return "draft";
}

function getNextEstimateStatus(statusCounts: Record<string, number>): string {
  for (const [status, count] of Object.entries(statusCounts)) {
    if (count > 0) {
      statusCounts[status]--;
      return status;
    }
  }
  return "draft";
}

function getNextFrequency(
  frequencyCounts: Record<string, number>
): "weekly" | "monthly" | "yearly" {
  for (const [frequency, count] of Object.entries(frequencyCounts)) {
    if (count > 0) {
      frequencyCounts[frequency]--;
      return frequency as "weekly" | "monthly" | "yearly";
    }
  }
  return "monthly";
}
