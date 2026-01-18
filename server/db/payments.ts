import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";
import type { Payment, InsertPayment } from "../../drizzle/schema.js";
import { payments, invoices } from "../../drizzle/schema.js";
import { getDb } from "./connection.js";

/**
 * Create a new payment record
 */
export async function createPayment(payment: InsertPayment): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payments).values(payment);
  const insertedId = Number(result[0].insertId);

  const created = await db
    .select()
    .from(payments)
    .where(eq(payments.id, insertedId))
    .limit(1);

  return created[0]!;
}

/**
 * Get all payments for a specific invoice
 */
export async function getPaymentsByInvoice(
  invoiceId: number
): Promise<Payment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(desc(payments.paymentDate));
}

/**
 * Get all payments for a user with optional filters
 */
export async function getPaymentsByUser(
  userId: number,
  filters?: {
    status?: string;
    paymentMethod?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<Payment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(payments).where(eq(payments.userId, userId));

  // Apply filters if provided
  const conditions = [eq(payments.userId, userId)];

  if (filters?.status) {
    conditions.push(eq(payments.status, filters.status as any));
  }

  if (filters?.paymentMethod) {
    conditions.push(eq(payments.paymentMethod, filters.paymentMethod as any));
  }

  if (filters?.startDate) {
    conditions.push(gte(payments.paymentDate, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(payments.paymentDate, filters.endDate));
  }

  return await db
    .select()
    .from(payments)
    .where(and(...conditions))
    .orderBy(desc(payments.paymentDate));
}

/**
 * Get payment by ID
 */
export async function getPaymentById(
  paymentId: number
): Promise<Payment | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);

  return result[0] || null;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: number,
  status: "pending" | "completed" | "failed" | "refunded"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(payments)
    .set({ status, updatedAt: new Date() })
    .where(eq(payments.id, paymentId));
}

/**
 * Delete a payment record
 */
export async function deletePayment(paymentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(payments).where(eq(payments.id, paymentId));
}

/**
 * Payment input data for recording a payment
 */
export interface PaymentInput {
  invoiceId: number;
  amount: number;
  currency: string;
  paymentMethod:
    | "stripe"
    | "manual"
    | "bank_transfer"
    | "check"
    | "cash"
    | "crypto";
  stripePaymentIntentId?: string;
  cryptoAmount?: string;
  cryptoCurrency?: string;
  cryptoTxHash?: string;
  paymentDate: Date;
  notes?: string;
}

/**
 * Record a payment and update invoice amountPaid atomically
 * Handles partial payments, full payments, and overpayments
 *
 * @param paymentData - Payment details
 * @param userId - User ID for authorization
 * @returns Created payment record with invoice update info
 *
 * @example
 * // Partial payment - invoice stays in "sent" status
 * const result = await recordPaymentAndUpdateInvoice({
 *   invoiceId: 123,
 *   amount: 50.00,
 *   currency: 'USD',
 *   paymentMethod: 'stripe',
 *   paymentDate: new Date(),
 * }, userId);
 *
 * @example
 * // Full payment - invoice status changes to "paid"
 * const result = await recordPaymentAndUpdateInvoice({
 *   invoiceId: 123,
 *   amount: 100.00,
 *   currency: 'USD',
 *   paymentMethod: 'manual',
 *   paymentDate: new Date(),
 * }, userId);
 */
export async function recordPaymentAndUpdateInvoice(
  paymentData: PaymentInput,
  userId: number
): Promise<{
  payment: Payment;
  invoiceStatus: "draft" | "sent" | "viewed" | "paid" | "overdue" | "canceled";
  amountPaid: number;
  amountDue: number;
  overpayment?: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use transaction to ensure atomicity
  return await db.transaction(async tx => {
    // Step 1: Get invoice with row lock to prevent race conditions
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(
        and(eq(invoices.id, paymentData.invoiceId), eq(invoices.userId, userId))
      )
      .limit(1)
      .for("update"); // Row lock for concurrent safety

    if (!invoice) {
      throw new Error("Invoice not found or access denied");
    }

    const invoiceTotal = Number(invoice.total);
    const currentAmountPaid = Number(invoice.amountPaid);

    // Step 2: Calculate new amount paid and determine if fully paid
    const newAmountPaid = currentAmountPaid + paymentData.amount;
    const isFullyPaid = newAmountPaid >= invoiceTotal;
    let overpayment: number | undefined;

    if (newAmountPaid > invoiceTotal) {
      overpayment = newAmountPaid - invoiceTotal;
      console.log(
        `[Payments] Overpayment detected on invoice ${invoice.invoiceNumber}: $${overpayment.toFixed(2)}`
      );
    }

    // Step 3: Determine new invoice status
    // Only change status to "paid" if fully paid and not already in a terminal state
    let newStatus:
      | "draft"
      | "sent"
      | "viewed"
      | "paid"
      | "overdue"
      | "canceled";
    const currentStatus = invoice.status;

    if (isFullyPaid) {
      // Transition to "paid" only from non-terminal states
      if (["draft", "sent", "viewed", "overdue"].includes(currentStatus)) {
        newStatus = "paid";
      } else {
        newStatus = currentStatus; // Already in terminal state
      }
    } else {
      // Not fully paid - keep current status but update amount
      // Status remains as-is (sent, viewed, overdue, etc.)
      newStatus = currentStatus;
    }

    // Step 4: Create the payment record
    const [paymentResult] = await tx.insert(payments).values({
      invoiceId: paymentData.invoiceId,
      userId: userId,
      amount: paymentData.amount.toString(),
      currency: paymentData.currency,
      paymentMethod: paymentData.paymentMethod,
      stripePaymentIntentId: paymentData.stripePaymentIntentId || null,
      cryptoAmount: paymentData.cryptoAmount || null,
      cryptoCurrency: paymentData.cryptoCurrency || null,
      cryptoTxHash: paymentData.cryptoTxHash || null,
      paymentDate: paymentData.paymentDate,
      receivedDate: paymentData.paymentDate,
      status: "completed",
      notes: paymentData.notes || null,
    });

    const paymentId = Number(paymentResult.insertId);

    // Step 5: Update invoice with new amount and status
    await tx
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toString(),
        status: newStatus,
        paidAt: newStatus === "paid" ? new Date() : invoice.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, paymentData.invoiceId));

    // Step 6: Fetch the created payment for return value
    const [createdPayment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    console.log(
      `[Payments] Recorded $${paymentData.amount} payment for invoice ${invoice.invoiceNumber}. ` +
        `Status: ${newStatus}, Total paid: $${newAmountPaid.toFixed(2)}, Due: $${Math.max(0, invoiceTotal - newAmountPaid).toFixed(2)}`
    );

    return {
      payment: createdPayment!,
      invoiceStatus: newStatus,
      amountPaid: newAmountPaid,
      amountDue: Math.max(0, invoiceTotal - newAmountPaid),
      overpayment,
    };
  });
}

/**
 * Get total paid amount for an invoice
 */
export async function getTotalPaidForInvoice(
  invoiceId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      total: sql<string>`SUM(${payments.amount})`,
    })
    .from(payments)
    .where(
      and(eq(payments.invoiceId, invoiceId), eq(payments.status, "completed"))
    );

  return parseFloat(result[0]?.total || "0");
}

/**
 * Get total paid amounts for multiple invoices in a single query (optimized for N+1 prevention)
 * Returns a Map of invoiceId => totalPaid
 */
export async function getBulkPaymentTotals(
  invoiceIds: number[]
): Promise<Map<number, number>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (invoiceIds.length === 0) {
    return new Map();
  }

  const results = await db
    .select({
      invoiceId: payments.invoiceId,
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        inArray(payments.invoiceId, invoiceIds),
        eq(payments.status, "completed")
      )
    )
    .groupBy(payments.invoiceId);

  const paymentMap = new Map<number, number>();

  // Initialize all invoices with 0
  for (const id of invoiceIds) {
    paymentMap.set(id, 0);
  }

  // Update with actual payment totals
  for (const row of results) {
    paymentMap.set(row.invoiceId, parseFloat(row.total));
  }

  return paymentMap;
}

/**
 * Get payment statistics for a user
 */
export async function getPaymentStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Total payments received
  const totalResult = await db
    .select({
      total: sql<string>`SUM(${payments.amount})`,
      count: sql<string>`COUNT(*)`,
    })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, "completed")));

  // Payments by method
  const byMethodResult = await db
    .select({
      method: payments.paymentMethod,
      total: sql<string>`SUM(${payments.amount})`,
      count: sql<string>`COUNT(*)`,
    })
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.status, "completed")))
    .groupBy(payments.paymentMethod);

  return {
    totalAmount: parseFloat(totalResult[0]?.total || "0"),
    totalCount: parseInt(totalResult[0]?.count || "0"),
    byMethod: byMethodResult.map(r => ({
      method: r.method,
      total: parseFloat(r.total || "0"),
      count: parseInt(r.count || "0"),
    })),
  };
}

/**
 * Record a partial payment for an invoice
 * Updates invoice amountPaid and status if fully paid
 */
export async function recordPartialPayment(
  invoiceId: number,
  userId: number,
  paymentData: {
    amount: string;
    paymentMethod: "manual" | "bank_transfer" | "check" | "cash" | "crypto";
    paymentDate: Date;
    notes?: string;
    cryptoCurrency?: string;
    cryptoNetwork?: string;
    cryptoTxHash?: string;
  }
): Promise<{ payment: Payment; newStatus: string; remaining: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify invoice ownership
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .limit(1);

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Create payment record
  const payment = await createPayment({
    invoiceId,
    userId,
    amount: paymentData.amount,
    currency: invoice.currency,
    paymentMethod: paymentData.paymentMethod,
    paymentDate: paymentData.paymentDate,
    notes: paymentData.notes || null,
    cryptoCurrency: paymentData.cryptoCurrency || null,
    cryptoNetwork: paymentData.cryptoNetwork || null,
    cryptoTxHash: paymentData.cryptoTxHash || null,
    status: "completed",
  });

  // Calculate new totals
  const totalPaid = await getTotalPaidForInvoice(invoiceId);
  const invoiceTotal = Number(invoice.total);
  const remaining = Math.max(0, invoiceTotal - totalPaid);

  // Determine new status
  let newStatus = invoice.status;
  if (remaining <= 0) {
    newStatus = "paid";
  } else if (totalPaid > 0) {
    // Keep as sent/viewed but update amountPaid
    // Status stays the same until fully paid
  }

  // Update invoice
  await db
    .update(invoices)
    .set({
      amountPaid: String(totalPaid),
      status: newStatus,
      paidAt: remaining <= 0 ? new Date() : null,
    })
    .where(eq(invoices.id, invoiceId));

  return { payment, newStatus, remaining };
}

/**
 * Get all payments for a user by querying through their invoices
 * Used for GDPR export and reporting
 */
export async function getPaymentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all invoices for this user first
  const userInvoices = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  if (userInvoices.length === 0) return [];

  const invoiceIds = userInvoices.map(i => i.id);

  return await db
    .select()
    .from(payments)
    .where(inArray(payments.invoiceId, invoiceIds))
    .orderBy(desc(payments.paymentDate));
}

/**
 * Get payment summary for an invoice
 * Returns detailed payment information including all payments and status
 */
export async function getInvoicePaymentSummary(
  invoiceId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get invoice
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .limit(1);

  if (!invoice) return null;

  // Get all payments
  const invoicePayments = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .orderBy(desc(payments.paymentDate));

  const totalPaid = invoicePayments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const invoiceTotal = Number(invoice.total);
  const remaining = Math.max(0, invoiceTotal - totalPaid);

  return {
    invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    total: invoiceTotal,
    totalPaid,
    remaining,
    currency: invoice.currency,
    status: invoice.status,
    payments: invoicePayments,
    isFullyPaid: remaining <= 0,
    isPartiallyPaid: totalPaid > 0 && remaining > 0,
  };
}
