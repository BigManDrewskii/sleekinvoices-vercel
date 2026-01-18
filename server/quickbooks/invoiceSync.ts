/**
 * QuickBooks Invoice Sync Service
 */
import {
  getDb,
  getInvoiceById,
  getInvoicesByUserId,
  getLineItemsByInvoiceId,
} from "../db";
import {
  quickbooksInvoiceMapping,
  quickbooksSyncLog,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { createQBEntity, updateQBEntity, getQBEntity } from "./client";
import { updateLastSyncTime } from "./oauth";
import { syncClientToQB, getCustomerMapping } from "./customerSync";

interface QBInvoice {
  Id: string;
  SyncToken: string;
  DocNumber?: string;
  TxnDate: string;
  DueDate?: string;
  CustomerRef: { value: string; name?: string };
  Line: QBInvoiceLine[];
  TotalAmt: number;
  Balance: number;
  CustomerMemo?: { value: string };
}

interface QBInvoiceLine {
  Id?: string;
  LineNum?: number;
  Description?: string;
  Amount: number;
  DetailType:
    | "SalesItemLineDetail"
    | "SubTotalLineDetail"
    | "DiscountLineDetail";
  SalesItemLineDetail?: {
    ItemRef?: { value: string; name?: string };
    UnitPrice?: number;
    Qty?: number;
  };
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

export async function getInvoiceMapping(
  userId: number,
  invoiceId: number
): Promise<{ qbInvoiceId: string; syncVersion: number } | null> {
  const db = await getDb();
  if (!db) return null;
  const mappings = await db
    .select()
    .from(quickbooksInvoiceMapping)
    .where(
      and(
        eq(quickbooksInvoiceMapping.userId, userId),
        eq(quickbooksInvoiceMapping.invoiceId, invoiceId)
      )
    )
    .limit(1);
  if (!mappings || mappings.length === 0 || !mappings[0]) return null;
  return {
    qbInvoiceId: mappings[0].qbInvoiceId,
    syncVersion: mappings[0].syncVersion,
  };
}

function invoiceToQBInvoice(
  invoice: any,
  lineItems: any[],
  qbCustomerId: string
): Partial<QBInvoice> {
  const lines: QBInvoiceLine[] = lineItems.map((item, index) => ({
    LineNum: index + 1,
    Description: item.description || "",
    Amount: Number(item.quantity) * Number(item.rate),
    DetailType: "SalesItemLineDetail" as const,
    SalesItemLineDetail: {
      UnitPrice: Number(item.rate),
      Qty: Number(item.quantity),
    },
  }));

  const qbInvoice: any = {
    CustomerRef: { value: qbCustomerId },
    TxnDate: new Date(invoice.issueDate).toISOString().split("T")[0],
    Line: lines,
  };

  if (invoice.dueDate)
    qbInvoice.DueDate = new Date(invoice.dueDate).toISOString().split("T")[0];
  if (invoice.invoiceNumber)
    qbInvoice.DocNumber = invoice.invoiceNumber.substring(0, 21);
  if (invoice.notes)
    qbInvoice.CustomerMemo = { value: invoice.notes.substring(0, 4000) };

  return qbInvoice;
}

export async function syncInvoiceToQB(
  userId: number,
  invoiceId: number
): Promise<{ success: boolean; qbInvoiceId?: string; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  const invoice = await getInvoiceById(invoiceId, userId);
  if (!invoice) return { success: false, error: "Invoice not found" };
  if (!invoice.clientId)
    return { success: false, error: "Invoice has no client assigned" };

  let customerMapping = await getCustomerMapping(userId, invoice.clientId);
  if (!customerMapping) {
    const syncResult = await syncClientToQB(userId, invoice.clientId);
    if (!syncResult.success)
      return {
        success: false,
        error: `Failed to sync client: ${syncResult.error}`,
      };
    customerMapping = await getCustomerMapping(userId, invoice.clientId);
    if (!customerMapping)
      return {
        success: false,
        error: "Failed to get customer mapping after sync",
      };
  }

  const lineItems = await getLineItemsByInvoiceId(invoiceId);
  const existingMapping = await getInvoiceMapping(userId, invoiceId);
  const invoiceData = invoiceToQBInvoice(
    invoice,
    lineItems,
    customerMapping.qbCustomerId
  );

  try {
    if (existingMapping) {
      const existingInvoice = await getQBEntity<QBInvoice>(
        userId,
        "Invoice",
        existingMapping.qbInvoiceId
      );
      if (!existingInvoice.success || !existingInvoice.data)
        return {
          success: false,
          error: "Failed to fetch existing invoice from QuickBooks",
        };

      const updateData = {
        ...invoiceData,
        Id: existingMapping.qbInvoiceId,
        SyncToken: existingInvoice.data.SyncToken,
        sparse: true,
      };
      const result = await updateQBEntity<QBInvoice>(
        userId,
        "Invoice",
        updateData
      );

      if (!result.success) {
        await logSync(
          userId,
          "invoice",
          invoiceId,
          existingMapping.qbInvoiceId,
          "update",
          "failed",
          result.error,
          updateData
        );
        return { success: false, error: result.error };
      }

      await db
        .update(quickbooksInvoiceMapping)
        .set({
          qbDocNumber: result.data?.DocNumber,
          syncVersion: existingMapping.syncVersion + 1,
          lastSyncedAt: new Date(),
        })
        .where(
          and(
            eq(quickbooksInvoiceMapping.userId, userId),
            eq(quickbooksInvoiceMapping.invoiceId, invoiceId)
          )
        );
      await logSync(
        userId,
        "invoice",
        invoiceId,
        existingMapping.qbInvoiceId,
        "update",
        "success",
        undefined,
        updateData,
        result.data
      );
      await updateLastSyncTime(userId);
      return { success: true, qbInvoiceId: existingMapping.qbInvoiceId };
    } else {
      const result = await createQBEntity<QBInvoice>(
        userId,
        "Invoice",
        invoiceData
      );
      if (!result.success || !result.data) {
        await logSync(
          userId,
          "invoice",
          invoiceId,
          null,
          "create",
          "failed",
          result.error,
          invoiceData
        );
        return { success: false, error: result.error };
      }

      await db
        .insert(quickbooksInvoiceMapping)
        .values({
          userId,
          invoiceId,
          qbInvoiceId: result.data.Id,
          qbDocNumber: result.data.DocNumber,
          syncVersion: 1,
          lastSyncedAt: new Date(),
          createdAt: new Date(),
        });
      await logSync(
        userId,
        "invoice",
        invoiceId,
        result.data.Id,
        "create",
        "success",
        undefined,
        invoiceData,
        result.data
      );
      await updateLastSyncTime(userId);
      return { success: true, qbInvoiceId: result.data.Id };
    }
  } catch (error: any) {
    console.error("Error syncing invoice to QuickBooks:", error);
    await logSync(
      userId,
      "invoice",
      invoiceId,
      existingMapping?.qbInvoiceId || null,
      existingMapping ? "update" : "create",
      "failed",
      error.message
    );
    return { success: false, error: error.message };
  }
}

export async function syncAllInvoicesToQB(
  userId: number
): Promise<{ synced: number; failed: number; errors: string[] }> {
  const invoices = await getInvoicesByUserId(userId);
  let synced = 0,
    failed = 0;
  const errors: string[] = [];

  for (const invoice of invoices) {
    const result = await syncInvoiceToQB(userId, invoice.id);
    if (result.success) synced++;
    else {
      failed++;
      errors.push(
        `Invoice ${invoice.invoiceNumber || invoice.id}: ${result.error}`
      );
    }
  }
  return { synced, failed, errors };
}

export async function getInvoiceSyncStatus(
  userId: number,
  invoiceId: number
): Promise<{
  synced: boolean;
  qbInvoiceId: string | null;
  qbDocNumber: string | null;
  lastSyncedAt: Date | null;
  syncVersion: number | null;
}> {
  const db = await getDb();
  if (!db)
    return {
      synced: false,
      qbInvoiceId: null,
      qbDocNumber: null,
      lastSyncedAt: null,
      syncVersion: null,
    };

  const mappings = await db
    .select()
    .from(quickbooksInvoiceMapping)
    .where(
      and(
        eq(quickbooksInvoiceMapping.userId, userId),
        eq(quickbooksInvoiceMapping.invoiceId, invoiceId)
      )
    )
    .limit(1);
  if (!mappings || mappings.length === 0 || !mappings[0])
    return {
      synced: false,
      qbInvoiceId: null,
      qbDocNumber: null,
      lastSyncedAt: null,
      syncVersion: null,
    };

  const mapping = mappings[0];
  return {
    synced: true,
    qbInvoiceId: mapping.qbInvoiceId,
    qbDocNumber: mapping.qbDocNumber,
    lastSyncedAt: mapping.lastSyncedAt,
    syncVersion: mapping.syncVersion,
  };
}

export async function getSyncHistory(
  userId: number,
  limit: number = 50
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(quickbooksSyncLog)
    .where(eq(quickbooksSyncLog.userId, userId))
    .orderBy(desc(quickbooksSyncLog.syncedAt))
    .limit(limit);
}
