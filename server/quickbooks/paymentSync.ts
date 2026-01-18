/**
 * QuickBooks Payment Sync Service
 * Handles two-way payment synchronization between SleekInvoices and QuickBooks
 */
import { getDb } from "../db";
import {
  payments,
  invoices,
  quickbooksPaymentMapping,
  quickbooksInvoiceMapping,
  quickbooksSyncLog,
  quickbooksSyncSettings,
} from "../../drizzle/schema";
import { eq, and, desc, gt, isNull, or } from "drizzle-orm";
import { queryQB, createQBEntity, getQBEntity } from "./client";
import { updateLastSyncTime } from "./oauth";
import { getInvoiceMapping } from "./invoiceSync";

interface QBPayment {
  Id: string;
  SyncToken: string;
  TxnDate: string;
  CustomerRef: { value: string; name?: string };
  TotalAmt: number;
  Line?: QBPaymentLine[];
  PrivateNote?: string;
  PaymentMethodRef?: { value: string; name?: string };
  DepositToAccountRef?: { value: string };
  MetaData?: { CreateTime: string; LastUpdatedTime: string };
}

interface QBPaymentLine {
  Amount: number;
  LinkedTxn: { TxnId: string; TxnType: string }[];
}

async function logSync(
  userId: number,
  entityType: "customer" | "invoice" | "payment",
  entityId: number,
  qbEntityId: string | null,
  action: "create" | "update" | "delete",
  status: "success" | "failed" | "pending",
  errorMessage?: string,
  requestPayload?: any,
  responsePayload?: any
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(quickbooksSyncLog).values({
    userId,
    entityType,
    entityId,
    qbEntityId,
    action,
    status,
    errorMessage,
    requestPayload: requestPayload ? JSON.stringify(requestPayload) : null,
    responsePayload: responsePayload ? JSON.stringify(responsePayload) : null,
    syncedAt: new Date(),
  });
}

/**
 * Get or create sync settings for a user
 */
export async function getSyncSettings(userId: number): Promise<{
  autoSyncInvoices: boolean;
  autoSyncPayments: boolean;
  syncPaymentsFromQB: boolean;
  minInvoiceAmount: string | null;
  syncDraftInvoices: boolean;
  lastPaymentPollAt: Date | null;
  pollIntervalMinutes: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      autoSyncInvoices: true,
      autoSyncPayments: true,
      syncPaymentsFromQB: true,
      minInvoiceAmount: null,
      syncDraftInvoices: false,
      lastPaymentPollAt: null,
      pollIntervalMinutes: 60,
    };
  }

  const settings = await db
    .select()
    .from(quickbooksSyncSettings)
    .where(eq(quickbooksSyncSettings.userId, userId))
    .limit(1);

  if (!settings || settings.length === 0) {
    // Create default settings
    await db.insert(quickbooksSyncSettings).values({ userId });
    return {
      autoSyncInvoices: true,
      autoSyncPayments: true,
      syncPaymentsFromQB: true,
      minInvoiceAmount: null,
      syncDraftInvoices: false,
      lastPaymentPollAt: null,
      pollIntervalMinutes: 60,
    };
  }

  const s = settings[0]!;
  return {
    autoSyncInvoices: s.autoSyncInvoices,
    autoSyncPayments: s.autoSyncPayments,
    syncPaymentsFromQB: s.syncPaymentsFromQB,
    minInvoiceAmount: s.minInvoiceAmount,
    syncDraftInvoices: s.syncDraftInvoices,
    lastPaymentPollAt: s.lastPaymentPollAt,
    pollIntervalMinutes: s.pollIntervalMinutes,
  };
}

/**
 * Update sync settings for a user
 */
export async function updateSyncSettings(
  userId: number,
  settings: Partial<{
    autoSyncInvoices: boolean;
    autoSyncPayments: boolean;
    syncPaymentsFromQB: boolean;
    minInvoiceAmount: string | null;
    syncDraftInvoices: boolean;
    pollIntervalMinutes: number;
  }>
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  try {
    // Check if settings exist
    const existing = await db
      .select()
      .from(quickbooksSyncSettings)
      .where(eq(quickbooksSyncSettings.userId, userId))
      .limit(1);

    if (!existing || existing.length === 0) {
      // Create new settings
      await db.insert(quickbooksSyncSettings).values({
        userId,
        ...settings,
      });
    } else {
      // Update existing settings
      await db
        .update(quickbooksSyncSettings)
        .set(settings)
        .where(eq(quickbooksSyncSettings.userId, userId));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating sync settings:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get payment mapping by local payment ID
 */
export async function getPaymentMapping(
  userId: number,
  paymentId: number
): Promise<{ qbPaymentId: string; syncVersion: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const mappings = await db
    .select()
    .from(quickbooksPaymentMapping)
    .where(
      and(
        eq(quickbooksPaymentMapping.userId, userId),
        eq(quickbooksPaymentMapping.paymentId, paymentId)
      )
    )
    .limit(1);

  if (!mappings || mappings.length === 0 || !mappings[0]) return null;
  return {
    qbPaymentId: mappings[0].qbPaymentId,
    syncVersion: mappings[0].syncVersion,
  };
}

/**
 * Get payment mapping by QuickBooks payment ID
 */
export async function getPaymentMappingByQBId(
  userId: number,
  qbPaymentId: string
): Promise<{ paymentId: number; syncVersion: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const mappings = await db
    .select()
    .from(quickbooksPaymentMapping)
    .where(
      and(
        eq(quickbooksPaymentMapping.userId, userId),
        eq(quickbooksPaymentMapping.qbPaymentId, qbPaymentId)
      )
    )
    .limit(1);

  if (!mappings || mappings.length === 0 || !mappings[0]) return null;
  return {
    paymentId: mappings[0].paymentId,
    syncVersion: mappings[0].syncVersion,
  };
}

/**
 * Sync a local payment to QuickBooks
 */
export async function syncPaymentToQB(
  userId: number,
  paymentId: number
): Promise<{ success: boolean; qbPaymentId?: string; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  // Get the payment
  const paymentRecords = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
    .limit(1);

  if (!paymentRecords || paymentRecords.length === 0) {
    return { success: false, error: "Payment not found" };
  }

  const payment = paymentRecords[0]!;

  // Get the invoice mapping to link the payment
  const invoiceMapping = await getInvoiceMapping(userId, payment.invoiceId);
  if (!invoiceMapping) {
    return {
      success: false,
      error: "Invoice not synced to QuickBooks - sync invoice first",
    };
  }

  // Get the invoice to get customer info
  const invoiceRecords = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, payment.invoiceId))
    .limit(1);

  if (!invoiceRecords || invoiceRecords.length === 0) {
    return { success: false, error: "Invoice not found" };
  }

  const invoice = invoiceRecords[0]!;

  // Get customer mapping
  const customerMappings = await db
    .select()
    .from(quickbooksPaymentMapping)
    .where(eq(quickbooksPaymentMapping.userId, userId))
    .limit(1);

  // Build QuickBooks payment data
  const qbPaymentData: Partial<QBPayment> = {
    TxnDate: new Date(payment.paymentDate).toISOString().split("T")[0],
    TotalAmt: Number(payment.amount),
    Line: [
      {
        Amount: Number(payment.amount),
        LinkedTxn: [
          {
            TxnId: invoiceMapping.qbInvoiceId,
            TxnType: "Invoice",
          },
        ],
      },
    ],
  };

  if (payment.notes) {
    qbPaymentData.PrivateNote = payment.notes.substring(0, 4000);
  }

  try {
    // Check if already synced
    const existingMapping = await getPaymentMapping(userId, paymentId);

    if (existingMapping) {
      // Already synced, no need to update (payments are usually immutable)
      return { success: true, qbPaymentId: existingMapping.qbPaymentId };
    }

    // We need to get the CustomerRef from the invoice in QuickBooks
    const qbInvoice = await getQBEntity<any>(
      userId,
      "Invoice",
      invoiceMapping.qbInvoiceId
    );
    if (!qbInvoice.success || !qbInvoice.data) {
      return {
        success: false,
        error: "Failed to fetch invoice from QuickBooks",
      };
    }

    qbPaymentData.CustomerRef = qbInvoice.data.CustomerRef;

    // Create new payment in QuickBooks
    const result = await createQBEntity<QBPayment>(
      userId,
      "Payment",
      qbPaymentData
    );

    if (!result.success || !result.data) {
      await logSync(
        userId,
        "payment",
        paymentId,
        null,
        "create",
        "failed",
        result.error,
        qbPaymentData
      );
      return { success: false, error: result.error };
    }

    // Create mapping
    await db.insert(quickbooksPaymentMapping).values({
      userId,
      paymentId,
      qbPaymentId: result.data.Id,
      qbInvoiceId: invoiceMapping.qbInvoiceId,
      syncDirection: "to_qb",
      syncVersion: 1,
      lastSyncedAt: new Date(),
      createdAt: new Date(),
    });

    await logSync(
      userId,
      "payment",
      paymentId,
      result.data.Id,
      "create",
      "success",
      undefined,
      qbPaymentData,
      result.data
    );
    await updateLastSyncTime(userId);

    return { success: true, qbPaymentId: result.data.Id };
  } catch (error: any) {
    console.error("Error syncing payment to QuickBooks:", error);
    await logSync(
      userId,
      "payment",
      paymentId,
      null,
      "create",
      "failed",
      error.message
    );
    return { success: false, error: error.message };
  }
}

/**
 * Poll QuickBooks for new/updated payments and sync them to SleekInvoices
 */
export async function pollPaymentsFromQB(userId: number): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db)
    return { success: false, synced: 0, errors: ["Database not available"] };

  const settings = await getSyncSettings(userId);
  if (!settings.syncPaymentsFromQB) {
    return { success: true, synced: 0, errors: [] };
  }

  const errors: string[] = [];
  let synced = 0;

  try {
    // Get the last poll time
    const lastPoll =
      settings.lastPaymentPollAt || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
    const lastPollStr = lastPoll.toISOString().replace("T", " ").split(".")[0];

    // Query QuickBooks for payments updated since last poll
    const query = `SELECT * FROM Payment WHERE MetaData.LastUpdatedTime > '${lastPollStr}' ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS 100`;
    const result = await queryQB<QBPayment>(userId, query);

    if (!result.success) {
      return {
        success: false,
        synced: 0,
        errors: [result.error || "Failed to query payments"],
      };
    }

    const qbPayments = result.data || [];

    for (const qbPayment of qbPayments) {
      try {
        // Check if this payment is already mapped
        const existingMapping = await getPaymentMappingByQBId(
          userId,
          qbPayment.Id
        );
        if (existingMapping) {
          // Payment already exists, skip
          continue;
        }

        // Find the linked invoice in SleekInvoices
        if (!qbPayment.Line || qbPayment.Line.length === 0) {
          continue;
        }

        const linkedInvoice = qbPayment.Line.find(
          line =>
            line.LinkedTxn &&
            line.LinkedTxn.some(txn => txn.TxnType === "Invoice")
        );

        if (!linkedInvoice) {
          continue;
        }

        const qbInvoiceId = linkedInvoice.LinkedTxn.find(
          txn => txn.TxnType === "Invoice"
        )?.TxnId;

        if (!qbInvoiceId) {
          continue;
        }

        // Find the local invoice by QB invoice ID
        const invoiceMappings = await db
          .select()
          .from(quickbooksInvoiceMapping)
          .where(
            and(
              eq(quickbooksInvoiceMapping.userId, userId),
              eq(quickbooksInvoiceMapping.qbInvoiceId, qbInvoiceId)
            )
          )
          .limit(1);

        if (!invoiceMappings || invoiceMappings.length === 0) {
          // Invoice not synced from SleekInvoices, skip
          continue;
        }

        const invoiceMapping = invoiceMappings[0]!;

        // Get the invoice
        const invoiceRecords = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, invoiceMapping.invoiceId))
          .limit(1);

        if (!invoiceRecords || invoiceRecords.length === 0) {
          continue;
        }

        const invoice = invoiceRecords[0]!;

        // Create a payment record in SleekInvoices
        const paymentDate = new Date(qbPayment.TxnDate);
        const [newPayment] = await db
          .insert(payments)
          .values({
            invoiceId: invoice.id,
            userId,
            amount: String(linkedInvoice.Amount),
            currency: invoice.currency,
            paymentMethod: "bank_transfer", // Default, QB doesn't always provide this
            paymentDate,
            status: "completed",
            notes:
              qbPayment.PrivateNote ||
              `Synced from QuickBooks (ID: ${qbPayment.Id})`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .$returningId();

        const paymentId = newPayment!.id;

        // Create the mapping
        await db.insert(quickbooksPaymentMapping).values({
          userId,
          paymentId,
          qbPaymentId: qbPayment.Id,
          qbInvoiceId,
          syncDirection: "from_qb",
          syncVersion: 1,
          lastSyncedAt: new Date(),
          createdAt: new Date(),
        });

        // Update invoice payment status
        const currentAmountPaid = Number(invoice.amountPaid || 0);
        const newAmountPaid = currentAmountPaid + linkedInvoice.Amount;
        const invoiceTotal = Number(invoice.total);

        const isPaid = newAmountPaid >= invoiceTotal;

        await db
          .update(invoices)
          .set({
            amountPaid: String(newAmountPaid),
            status: isPaid ? "paid" : invoice.status,
            paidAt: isPaid ? new Date() : invoice.paidAt,
          })
          .where(eq(invoices.id, invoice.id));

        await logSync(
          userId,
          "payment",
          paymentId,
          qbPayment.Id,
          "create",
          "success",
          undefined,
          undefined,
          qbPayment
        );

        synced++;
      } catch (error: any) {
        console.error("Error syncing payment from QuickBooks:", error);
        errors.push(`Payment ${qbPayment.Id}: ${error.message}`);
      }
    }

    // Update last poll time
    await db
      .update(quickbooksSyncSettings)
      .set({ lastPaymentPollAt: new Date() })
      .where(eq(quickbooksSyncSettings.userId, userId));

    await updateLastSyncTime(userId);

    return { success: true, synced, errors };
  } catch (error: any) {
    console.error("Error polling payments from QuickBooks:", error);
    return { success: false, synced, errors: [error.message] };
  }
}

/**
 * Check if auto-sync should be performed based on settings
 */
export async function shouldAutoSync(
  userId: number,
  type: "invoice" | "payment",
  invoiceAmount?: number
): Promise<boolean> {
  const settings = await getSyncSettings(userId);

  if (type === "invoice") {
    if (!settings.autoSyncInvoices) return false;
    if (settings.minInvoiceAmount && invoiceAmount !== undefined) {
      if (invoiceAmount < Number(settings.minInvoiceAmount)) return false;
    }
    return true;
  }

  if (type === "payment") {
    return settings.autoSyncPayments;
  }

  return false;
}
