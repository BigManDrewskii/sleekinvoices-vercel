import { eq, and, desc, sql } from "drizzle-orm";
import type { InsertEmailLog } from "../../drizzle/schema";
import { emailLog } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function logEmail(emailData: InsertEmailLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emailLog).values(emailData);
}

export async function getEmailLogByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(emailLog)
    .where(eq(emailLog.invoiceId, invoiceId))
    .orderBy(desc(emailLog.sentAt));
}

export async function getEmailLogByMessageId(messageId: string) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(emailLog)
    .where(eq(emailLog.messageId, messageId))
    .limit(1);

  return results[0] || null;
}

export async function updateEmailLogDelivery(
  id: number,
  data: {
    deliveryStatus?:
      | "sent"
      | "delivered"
      | "opened"
      | "clicked"
      | "bounced"
      | "complained"
      | "failed";
    deliveredAt?: Date;
    openedAt?: Date;
    openCount?: number;
    clickedAt?: Date;
    clickCount?: number;
    bouncedAt?: Date;
    bounceType?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emailLog).set(data).where(eq(emailLog.id, id));
}

export async function updateEmailLogMessageId(id: number, messageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emailLog).set({ messageId }).where(eq(emailLog.id, id));
}

/**
 * Get email log by ID
 */
export async function getEmailLogById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(emailLog)
    .where(eq(emailLog.id, id))
    .limit(1);

  return results[0] || null;
}

/**
 * Get all email logs for a user with pagination
 */
export async function getEmailLogsByUserId(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    emailType?: "invoice" | "reminder" | "receipt";
    deliveryStatus?:
      | "sent"
      | "delivered"
      | "opened"
      | "clicked"
      | "bounced"
      | "complained"
      | "failed";
    search?: string;
  } = {}
) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const { limit = 20, offset = 0, emailType, deliveryStatus, search } = options;

  // Build conditions
  const conditions = [eq(emailLog.userId, userId)];

  if (emailType) {
    conditions.push(eq(emailLog.emailType, emailType));
  }

  if (deliveryStatus) {
    conditions.push(eq(emailLog.deliveryStatus, deliveryStatus));
  }

  if (search) {
    conditions.push(
      sql`(${emailLog.recipientEmail} LIKE ${`%${search}%`} OR ${emailLog.subject} LIKE ${`%${search}%`})`
    );
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(emailLog)
    .where(and(...conditions));

  const total = countResult[0]?.count || 0;

  // Get paginated results
  const logs = await db
    .select()
    .from(emailLog)
    .where(and(...conditions))
    .orderBy(desc(emailLog.sentAt))
    .limit(limit)
    .offset(offset);

  return { logs, total };
}

/**
 * Update email log for retry
 */
export async function updateEmailLogRetry(
  id: number,
  data: {
    retryCount: number;
    lastRetryAt: Date;
    nextRetryAt?: Date | null;
    success?: boolean;
    errorMessage?: string | null;
    messageId?: string;
    deliveryStatus?:
      | "sent"
      | "delivered"
      | "opened"
      | "clicked"
      | "bounced"
      | "complained"
      | "failed";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emailLog).set(data).where(eq(emailLog.id, id));
}

/**
 * Get failed emails eligible for retry
 * Returns emails that failed, have retryCount < maxRetries, and nextRetryAt is in the past
 */
export async function getFailedEmailsForRetry(maxRetries: number = 3) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  return db
    .select()
    .from(emailLog)
    .where(
      and(
        eq(emailLog.success, false),
        sql`${emailLog.retryCount} < ${maxRetries}`,
        sql`(${emailLog.nextRetryAt} IS NULL OR ${emailLog.nextRetryAt} <= ${now})`
      )
    )
    .orderBy(emailLog.sentAt)
    .limit(50); // Process in batches
}

export async function getAllEmailLogsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emailLog)
    .where(eq(emailLog.userId, userId))
    .orderBy(desc(emailLog.sentAt));
}
