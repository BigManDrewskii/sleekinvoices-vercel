import { eq, and, sql, inArray, gte, desc } from "drizzle-orm";
import { getDb } from "./connection.js";
import {
  InsertUser,
  users,
  usageTracking,
  aiCredits,
  AiCredits,
  aiUsageLogs,
  InsertAiUsageLog,
  aiCreditPurchases,
  AiCreditPurchase,
  invoices,
  clients,
  recurringInvoices,
  estimates,
  batchInvoiceTemplates,
  invoiceLineItems,
  invoiceCustomFieldValues,
  invoiceViews,
  payments,
  quickbooksInvoiceMapping,
  recurringInvoiceLineItems,
  estimateLineItems,
  batchInvoiceTemplateLineItems,
  clientTagAssignments,
  clientPortalAccess,
  quickbooksCustomerMapping,
  products,
  expenses,
  expenseCategories,
  invoiceTemplates,
  customFields,
  clientTags,
  reminderSettings,
  reminderLogs,
} from "../../drizzle/schema.js";
import { ENV } from "../_core/env.js";

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "loginMethod",
      "companyName",
      "companyAddress",
      "companyPhone",
      "logoUrl",
      "stripeCustomerId",
      "subscriptionId",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.subscriptionStatus !== undefined) {
      values.subscriptionStatus = user.subscriptionStatus;
      updateSet.subscriptionStatus = user.subscriptionStatus;
    }
    if (user.currentPeriodEnd !== undefined) {
      values.currentPeriodEnd = user.currentPeriodEnd;
      updateSet.currentPeriodEnd = user.currentPeriodEnd;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  data: Partial<InsertUser>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserSubscription(
  userId: number,
  data: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    subscriptionStatus?: "free" | "active" | "canceled" | "past_due";
    currentPeriodEnd?: Date | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set(data).where(eq(users.id, userId));
}

/**
 * Get the current month's invoice usage for a user
 * @returns Number of invoices created this month
 *
 * @example
 * const usage = await getCurrentMonthUsage(123);
 * console.log(`User has created ${usage.invoicesCreated} invoices this month`);
 */
export async function getCurrentMonthUsage(
  userId: number
): Promise<{ invoicesCreated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [record] = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.month, currentMonth)
      )
    )
    .limit(1);

  return {
    invoicesCreated: record?.invoicesCreated ?? 0,
  };
}

/**
 * Increment the invoice count for a user in the current month
 * Creates a new record if one doesn't exist for this month
 * Uses INSERT ... ON DUPLICATE KEY UPDATE for atomic upsert
 *
 * @param userId - User ID to increment count for
 * @returns The new invoice count after increment
 *
 * @example
 * const newCount = await incrementInvoiceCount(123);
 * console.log(`User now has ${newCount} invoices this month`);
 */
export async function incrementInvoiceCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Try to insert new record, or update existing one
  await db
    .insert(usageTracking)
    .values({
      userId,
      month: currentMonth,
      invoicesCreated: 1,
    })
    .onDuplicateKeyUpdate({
      set: {
        invoicesCreated: sql`${usageTracking.invoicesCreated} + 1`,
        updatedAt: sql`NOW()`,
      },
    });

  // Fetch the updated count
  const usage = await getCurrentMonthUsage(userId);
  return usage.invoicesCreated;
}

/**
 * Check if a user can create an invoice based on their subscription status and usage
 * Pro users can always create invoices (unlimited)
 * Free users are limited to 3 invoices per month
 *
 * @param userId - User ID to check
 * @param subscriptionStatus - User's subscription status from database
 * @returns true if user can create invoice, false if limit reached
 *
 * @example
 * const canCreate = await canUserCreateInvoice(123, 'free');
 * if (!canCreate) {
 *   throw new Error('Monthly invoice limit reached');
 * }
 */
export async function canUserCreateInvoice(
  userId: number,
  subscriptionStatus:
    | "free"
    | "active"
    | "canceled"
    | "past_due"
    | "trialing"
    | null
): Promise<boolean> {
  // Import subscription helpers from shared constants
  const { isPro, canCreateInvoice } = await import("../../shared/subscription.js");

  // Pro users bypass all limits
  if (isPro(subscriptionStatus)) {
    return true;
  }

  // Get current month usage for free users
  const usage = await getCurrentMonthUsage(userId);

  // Check against free tier limit (3 invoices/month)
  return canCreateInvoice(subscriptionStatus, usage.invoicesCreated);
}

// ============================================================================
// AI CREDITS OPERATIONS
// ============================================================================

/**
 * Get AI credits for a user
 * Creates a new record if one doesn't exist for this month
 */
export async function getAiCredits(
  userId: number,
  isPro: boolean = false
): Promise<AiCredits> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const creditsLimit = isPro ? 50 : 5; // Pro gets 50, free gets 5

  // Try to get existing record
  const existing = await db
    .select()
    .from(aiCredits)
    .where(and(eq(aiCredits.userId, userId), eq(aiCredits.month, currentMonth)))
    .limit(1);

  if (existing.length > 0) {
    // Update limit if subscription status changed
    if (existing[0].creditsLimit !== creditsLimit) {
      await db
        .update(aiCredits)
        .set({ creditsLimit })
        .where(eq(aiCredits.id, existing[0].id));
      return { ...existing[0], creditsLimit };
    }
    return existing[0];
  }

  // Create new record for this month
  const result = await db.insert(aiCredits).values({
    userId,
    month: currentMonth,
    creditsUsed: 0,
    creditsLimit,
  });

  const insertedId = Number(result[0].insertId);
  const created = await db
    .select()
    .from(aiCredits)
    .where(eq(aiCredits.id, insertedId))
    .limit(1);
  return created[0]!;
}

/**
 * Check if user has available AI credits
 * Total available = creditsLimit + purchasedCredits - creditsUsed
 */
export async function hasAiCredits(
  userId: number,
  isPro: boolean = false
): Promise<boolean> {
  const credits = await getAiCredits(userId, isPro);
  const totalAvailable = credits.creditsLimit + credits.purchasedCredits;
  return credits.creditsUsed < totalAvailable;
}

/**
 * Use one AI credit
 * Returns false if no credits available
 * Consumes from base credits first, then purchased credits
 */
export async function useAiCredit(
  userId: number,
  isPro: boolean = false
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const credits = await getAiCredits(userId, isPro);
  const totalAvailable = credits.creditsLimit + credits.purchasedCredits;

  if (credits.creditsUsed >= totalAvailable) {
    return false;
  }

  await db
    .update(aiCredits)
    .set({ creditsUsed: credits.creditsUsed + 1 })
    .where(eq(aiCredits.id, credits.id));

  return true;
}

/**
 * Log AI usage for analytics and debugging
 */
export async function logAiUsage(data: {
  userId: number;
  feature: "smart_compose" | "categorization" | "prediction" | "ai_assistant";
  inputTokens: number;
  outputTokens: number;
  model: string;
  success: boolean;
  errorMessage?: string;
  latencyMs?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(aiUsageLogs).values({
    userId: data.userId,
    feature: data.feature,
    inputTokens: data.inputTokens,
    outputTokens: data.outputTokens,
    model: data.model,
    success: data.success,
    errorMessage: data.errorMessage || null,
    latencyMs: data.latencyMs || null,
  });
}

/**
 * Get AI usage stats for a user
 */
export async function getAiUsageStats(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return { totalCalls: 0, successRate: 0, avgLatency: 0 };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await db
    .select()
    .from(aiUsageLogs)
    .where(
      and(eq(aiUsageLogs.userId, userId), gte(aiUsageLogs.createdAt, startDate))
    );

  const totalCalls = logs.length;
  const successfulCalls = logs.filter(l => l.success).length;
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
  const avgLatency =
    totalCalls > 0
      ? logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / totalCalls
      : 0;

  return {
    totalCalls,
    successRate: Math.round(successRate * 10) / 10,
    avgLatency: Math.round(avgLatency),
  };
}

// ============================================================================
// AI CREDIT PURCHASES OPERATIONS
// ============================================================================

/**
 * Create a pending credit purchase record
 */
export async function createCreditPurchase(data: {
  userId: number;
  stripeSessionId: string;
  packType: "starter" | "standard" | "pro_pack";
  creditsAmount: number;
  amountPaid: number;
  currency?: string;
}): Promise<AiCreditPurchase> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(aiCreditPurchases).values({
    userId: data.userId,
    stripeSessionId: data.stripeSessionId,
    packType: data.packType,
    creditsAmount: data.creditsAmount,
    amountPaid: data.amountPaid,
    currency: data.currency || "usd",
    status: "pending",
  });

  const insertedId = Number(result[0].insertId);
  const created = await db
    .select()
    .from(aiCreditPurchases)
    .where(eq(aiCreditPurchases.id, insertedId))
    .limit(1);
  return created[0]!;
}

/**
 * Get credit purchase history for a user
 */
export async function getCreditPurchaseHistory(
  userId: number,
  limit: number = 20
): Promise<AiCreditPurchase[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(aiCreditPurchases)
    .where(eq(aiCreditPurchases.userId, userId))
    .orderBy(desc(aiCreditPurchases.createdAt))
    .limit(limit);
}

/**
 * Get total purchased credits for a user in current month
 */
export async function getTotalPurchasedCredits(
  userId: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const purchases = await db
    .select()
    .from(aiCreditPurchases)
    .where(
      and(
        eq(aiCreditPurchases.userId, userId),
        eq(aiCreditPurchases.appliedToMonth, currentMonth),
        eq(aiCreditPurchases.status, "completed")
      )
    );

  return purchases.reduce((sum, p) => sum + p.creditsAmount, 0);
}

// ============================================================================
// USER DELETION OPERATIONS
// ============================================================================

/**
 * Permanently delete all user data for GDPR compliance
 * This function removes data from all tables in the correct order to respect foreign key constraints
 */
export async function deleteUserAccount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all invoice IDs for this user (needed for cascading deletes)
  const userInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.userId, userId));
  const invoiceIds = userInvoices.map(i => i.id);

  // Get all client IDs for this user
  const userClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, userId));
  const clientIds = userClients.map(c => c.id);

  // Get all recurring invoice IDs
  const userRecurringInvoices = await db
    .select({ id: recurringInvoices.id })
    .from(recurringInvoices)
    .where(eq(recurringInvoices.userId, userId));
  const recurringInvoiceIds = userRecurringInvoices.map(r => r.id);

  // Get all estimate IDs
  const userEstimates = await db
    .select({ id: estimates.id })
    .from(estimates)
    .where(eq(estimates.userId, userId));
  const estimateIds = userEstimates.map(e => e.id);

  // Get all batch template IDs
  const userBatchTemplates = await db
    .select({ id: batchInvoiceTemplates.id })
    .from(batchInvoiceTemplates)
    .where(eq(batchInvoiceTemplates.userId, userId));
  const batchTemplateIds = userBatchTemplates.map(b => b.id);

  // Delete in order to respect foreign key constraints
  // 1. Delete invoice-related child records
  if (invoiceIds.length > 0) {
    await db
      .delete(invoiceLineItems)
      .where(inArray(invoiceLineItems.invoiceId, invoiceIds));
    await db
      .delete(invoiceCustomFieldValues)
      .where(inArray(invoiceCustomFieldValues.invoiceId, invoiceIds));
    await db
      .delete(invoiceViews)
      .where(inArray(invoiceViews.invoiceId, invoiceIds));
    await db.delete(payments).where(inArray(payments.invoiceId, invoiceIds));
    await db
      .delete(quickbooksInvoiceMapping)
      .where(inArray(quickbooksInvoiceMapping.invoiceId, invoiceIds));
  }

  // 2. Delete recurring invoice line items
  if (recurringInvoiceIds.length > 0) {
    await db
      .delete(recurringInvoiceLineItems)
      .where(
        inArray(
          recurringInvoiceLineItems.recurringInvoiceId,
          recurringInvoiceIds
        )
      );
  }

  // 3. Delete estimate line items
  if (estimateIds.length > 0) {
    await db
      .delete(estimateLineItems)
      .where(inArray(estimateLineItems.estimateId, estimateIds));
  }

  // 4. Delete batch template line items
  if (batchTemplateIds.length > 0) {
    await db
      .delete(batchInvoiceTemplateLineItems)
      .where(
        inArray(batchInvoiceTemplateLineItems.templateId, batchTemplateIds)
      );
  }

  // 5. Delete client-related records
  if (clientIds.length > 0) {
    await db
      .delete(clientTagAssignments)
      .where(inArray(clientTagAssignments.clientId, clientIds));
    await db
      .delete(clientPortalAccess)
      .where(inArray(clientPortalAccess.clientId, clientIds));
    await db
      .delete(quickbooksCustomerMapping)
      .where(inArray(quickbooksCustomerMapping.clientId, clientIds));
  }

  // 6. Delete main records by userId
  await db.delete(invoices).where(eq(invoices.userId, userId));
  await db
    .delete(recurringInvoices)
    .where(eq(recurringInvoices.userId, userId));
  await db.delete(estimates).where(eq(estimates.userId, userId));
  await db.delete(clients).where(eq(clients.userId, userId));
  await db.delete(products).where(eq(products.userId, userId));
  await db.delete(expenses).where(eq(expenses.userId, userId));
  await db
    .delete(expenseCategories)
    .where(eq(expenseCategories.userId, userId));
  await db.delete(invoiceTemplates).where(eq(invoiceTemplates.userId, userId));
  await db.delete(customFields).where(eq(customFields.userId, userId));
  await db
    .delete(batchInvoiceTemplates)
    .where(eq(batchInvoiceTemplates.userId, userId));
  await db.delete(clientTags).where(eq(clientTags.userId, userId));

  // 7. Delete user settings and logs
  await db.delete(reminderSettings).where(eq(reminderSettings.userId, userId));
  await db.delete(reminderLogs).where(eq(reminderLogs.userId, userId));

  // 8. Finally delete the user record
  await db.delete(users).where(eq(users.id, userId));

  console.log(`[Database] Deleted all data for user ${userId}`);
}
