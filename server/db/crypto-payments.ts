import { eq, desc } from "drizzle-orm";
import { getDb } from "./connection.js";
import { cryptoSubscriptionPayments } from "../../drizzle/schema.js";

// ============================================================================
// CRYPTO SUBSCRIPTION PAYMENTS OPERATIONS
// ============================================================================

export async function createCryptoSubscriptionPayment(data: {
  userId: number;
  paymentId: string;
  paymentStatus: string;
  priceAmount: string;
  priceCurrency: string;
  payCurrency: string;
  payAmount: string;
  months?: number;
  isExtension?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(cryptoSubscriptionPayments).values({
    userId: data.userId,
    paymentId: data.paymentId,
    paymentStatus: data.paymentStatus,
    priceAmount: data.priceAmount,
    priceCurrency: data.priceCurrency,
    payCurrency: data.payCurrency,
    payAmount: data.payAmount,
    months: data.months ?? 1,
    isExtension: data.isExtension ?? false,
  });

  return { success: true };
}

export async function getCryptoSubscriptionPaymentByPaymentId(
  paymentId: string
) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(cryptoSubscriptionPayments)
    .where(eq(cryptoSubscriptionPayments.paymentId, paymentId))
    .limit(1);

  return result[0] || null;
}

export async function updateCryptoSubscriptionPaymentStatus(
  paymentId: string,
  status: string,
  confirmedAt?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = { paymentStatus: status };
  if (confirmedAt) {
    updateData.confirmedAt = confirmedAt;
  }

  await db
    .update(cryptoSubscriptionPayments)
    .set(updateData)
    .where(eq(cryptoSubscriptionPayments.paymentId, paymentId));

  return { success: true };
}

/**
 * Get subscription payment history for a user
 * Returns all crypto subscription payments ordered by date
 */
export async function getSubscriptionHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const payments = await db
    .select({
      id: cryptoSubscriptionPayments.id,
      paymentId: cryptoSubscriptionPayments.paymentId,
      paymentStatus: cryptoSubscriptionPayments.paymentStatus,
      priceAmount: cryptoSubscriptionPayments.priceAmount,
      priceCurrency: cryptoSubscriptionPayments.priceCurrency,
      payCurrency: cryptoSubscriptionPayments.payCurrency,
      payAmount: cryptoSubscriptionPayments.payAmount,
      months: cryptoSubscriptionPayments.months,
      isExtension: cryptoSubscriptionPayments.isExtension,
      confirmedAt: cryptoSubscriptionPayments.confirmedAt,
      createdAt: cryptoSubscriptionPayments.createdAt,
    })
    .from(cryptoSubscriptionPayments)
    .where(eq(cryptoSubscriptionPayments.userId, userId))
    .orderBy(desc(cryptoSubscriptionPayments.createdAt));

  return payments;
}
