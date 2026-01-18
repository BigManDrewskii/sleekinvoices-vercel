import { eq, and, desc, gte } from "drizzle-orm";
import { getDb } from "./connection";
import { reminderSettings, reminderLogs, invoices } from "../../drizzle/schema";
import { DEFAULT_REMINDER_TEMPLATE } from "../email";

export async function getReminderSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const settings = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
    .limit(1);
  return settings[0] || null;
}

export async function upsertReminderSettings(
  userId: number,
  data: {
    enabled?: boolean;
    intervals?: number[];
    emailSubject?: string;
    emailTemplate?: string;
    ccEmail?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const existing = await getReminderSettings(userId);

  const settingsData = {
    userId,
    enabled: data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    intervals: data.intervals
      ? JSON.stringify(data.intervals)
      : JSON.stringify([3, 7, 14]),
    emailSubject: data.emailSubject || null,
    emailTemplate: data.emailTemplate || DEFAULT_REMINDER_TEMPLATE,
    ccEmail: data.ccEmail || null,
  };

  if (existing) {
    await db
      .update(reminderSettings)
      .set(settingsData)
      .where(eq(reminderSettings.userId, userId));
  } else {
    await db.insert(reminderSettings).values(settingsData);
  }

  return getReminderSettings(userId);
}

export async function logReminderSent(data: {
  invoiceId: number;
  userId: number;
  daysOverdue: number;
  recipientEmail: string;
  status: "sent" | "failed";
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  await db.insert(reminderLogs).values({
    invoiceId: data.invoiceId,
    userId: data.userId,
    daysOverdue: data.daysOverdue,
    recipientEmail: data.recipientEmail,
    status: data.status,
    errorMessage: data.errorMessage || null,
  });
}

export async function getReminderLogs(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  return await db
    .select()
    .from(reminderLogs)
    .where(eq(reminderLogs.invoiceId, invoiceId))
    .orderBy(desc(reminderLogs.sentAt));
}

export async function getAllReminderLogs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  return await db
    .select({
      id: reminderLogs.id,
      invoiceId: reminderLogs.invoiceId,
      sentAt: reminderLogs.sentAt,
      daysOverdue: reminderLogs.daysOverdue,
      recipientEmail: reminderLogs.recipientEmail,
      status: reminderLogs.status,
      errorMessage: reminderLogs.errorMessage,
    })
    .from(reminderLogs)
    .innerJoin(invoices, eq(reminderLogs.invoiceId, invoices.id))
    .where(eq(invoices.userId, userId))
    .orderBy(desc(reminderLogs.sentAt));
}

export async function getLastReminderSent(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const logs = await db
    .select()
    .from(reminderLogs)
    .where(eq(reminderLogs.invoiceId, invoiceId))
    .orderBy(desc(reminderLogs.sentAt))
    .limit(1);

  return logs[0] || null;
}

export async function wasReminderSentToday(
  invoiceId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await db
    .select()
    .from(reminderLogs)
    .where(
      and(
        eq(reminderLogs.invoiceId, invoiceId),
        gte(reminderLogs.sentAt, today)
      )
    )
    .limit(1);

  return logs.length > 0;
}
