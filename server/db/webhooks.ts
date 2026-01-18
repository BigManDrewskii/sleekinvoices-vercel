import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { stripeWebhookEvents } from "../../drizzle/schema";

export async function logStripeWebhookEvent(
  eventId: string,
  eventType: string,
  payload: any
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(stripeWebhookEvents).values({
    eventId,
    eventType,
    payload: JSON.stringify(payload),
    processed: 0,
  });
}

/**
 * Mark webhook event as processed
 */
export async function markWebhookEventProcessed(
  eventId: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(stripeWebhookEvents)
    .set({ processed: 1, processedAt: new Date() })
    .where(eq(stripeWebhookEvents.eventId, eventId));
}

/**
 * Check if webhook event has been processed
 */
export async function isWebhookEventProcessed(
  eventId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.eventId, eventId))
    .limit(1);

  return result.length > 0 && result[0]!.processed === 1;
}
