/**
 * QuickBooks Customer Sync Service
 */
import { getDb, getClientById, getClientsByUserId } from "../db";
import { quickbooksCustomerMapping, quickbooksSyncLog } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { queryQB, createQBEntity, updateQBEntity, getQBEntity } from "./client";
import { updateLastSyncTime } from "./oauth";

interface QBCustomer {
  Id: string;
  SyncToken: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string; Country?: string };
  Active: boolean;
}

export async function findQBCustomer(userId: number, email?: string, displayName?: string): Promise<QBCustomer | null> {
  if (email) {
    const emailQuery = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email.replace(/'/g, "\\'")}'`;
    const emailResult = await queryQB<QBCustomer>(userId, emailQuery);
    if (emailResult.success && emailResult.data && emailResult.data.length > 0) return emailResult.data[0];
  }
  if (displayName) {
    const nameQuery = `SELECT * FROM Customer WHERE DisplayName = '${displayName.replace(/'/g, "\\'")}'`;
    const nameResult = await queryQB<QBCustomer>(userId, nameQuery);
    if (nameResult.success && nameResult.data && nameResult.data.length > 0) return nameResult.data[0];
  }
  return null;
}

function clientToQBCustomer(client: any): Partial<QBCustomer> {
  const displayName = client.companyName || client.name || `Client ${client.id}`;
  const customer: any = { DisplayName: displayName.substring(0, 100), CompanyName: client.companyName?.substring(0, 100), Active: true };
  if (client.email) customer.PrimaryEmailAddr = { Address: client.email };
  if (client.phone) customer.PrimaryPhone = { FreeFormNumber: client.phone };
  if (client.address) customer.BillAddr = { Line1: client.address.split('\n')[0]?.substring(0, 500) };
  return customer;
}

async function logSync(userId: number, entityType: "customer" | "invoice" | "payment", entityId: number, qbEntityId: string | null, action: "create" | "update" | "delete", status: "success" | "failed" | "pending", errorMessage?: string, requestPayload?: any, responsePayload?: any): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(quickbooksSyncLog).values({
    userId, entityType, entityId, qbEntityId, action, status, errorMessage,
    requestPayload: requestPayload ? JSON.stringify(requestPayload) : null,
    responsePayload: responsePayload ? JSON.stringify(responsePayload) : null,
    syncedAt: new Date(),
  });
}

export async function getCustomerMapping(userId: number, clientId: number): Promise<{ qbCustomerId: string; syncVersion: number } | null> {
  const db = await getDb();
  if (!db) return null;
  const mappings = await db.select().from(quickbooksCustomerMapping).where(and(eq(quickbooksCustomerMapping.userId, userId), eq(quickbooksCustomerMapping.clientId, clientId))).limit(1);
  if (!mappings || mappings.length === 0 || !mappings[0]) return null;
  return { qbCustomerId: mappings[0].qbCustomerId, syncVersion: mappings[0].syncVersion };
}

export async function syncClientToQB(userId: number, clientId: number): Promise<{ success: boolean; qbCustomerId?: string; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database not available" };

  const client = await getClientById(clientId, userId);
  if (!client) return { success: false, error: "Client not found" };
  
  const existingMapping = await getCustomerMapping(userId, clientId);
  const customerData = clientToQBCustomer(client);
  
  try {
    if (existingMapping) {
      const existingCustomer = await getQBEntity<QBCustomer>(userId, "Customer", existingMapping.qbCustomerId);
      if (!existingCustomer.success || !existingCustomer.data) return { success: false, error: "Failed to fetch existing customer from QuickBooks" };
      
      const updateData = { ...customerData, Id: existingMapping.qbCustomerId, SyncToken: existingCustomer.data.SyncToken, sparse: true };
      const result = await updateQBEntity<QBCustomer>(userId, "Customer", updateData);
      
      if (!result.success) {
        await logSync(userId, "customer", clientId, existingMapping.qbCustomerId, "update", "failed", result.error, updateData);
        return { success: false, error: result.error };
      }
      
      await db.update(quickbooksCustomerMapping).set({ qbDisplayName: result.data?.DisplayName, syncVersion: existingMapping.syncVersion + 1, lastSyncedAt: new Date() }).where(and(eq(quickbooksCustomerMapping.userId, userId), eq(quickbooksCustomerMapping.clientId, clientId)));
      await logSync(userId, "customer", clientId, existingMapping.qbCustomerId, "update", "success", undefined, updateData, result.data);
      await updateLastSyncTime(userId);
      return { success: true, qbCustomerId: existingMapping.qbCustomerId };
    } else {
      const existingQBCustomer = await findQBCustomer(userId, client.email || undefined, customerData.DisplayName);
      
      if (existingQBCustomer) {
        await db.insert(quickbooksCustomerMapping).values({ userId, clientId, qbCustomerId: existingQBCustomer.Id, qbDisplayName: existingQBCustomer.DisplayName, syncVersion: 1, lastSyncedAt: new Date(), createdAt: new Date() });
        await logSync(userId, "customer", clientId, existingQBCustomer.Id, "create", "success", undefined, { matched: true }, existingQBCustomer);
        await updateLastSyncTime(userId);
        return { success: true, qbCustomerId: existingQBCustomer.Id };
      }
      
      const result = await createQBEntity<QBCustomer>(userId, "Customer", customerData);
      if (!result.success || !result.data) {
        await logSync(userId, "customer", clientId, null, "create", "failed", result.error, customerData);
        return { success: false, error: result.error };
      }
      
      await db.insert(quickbooksCustomerMapping).values({ userId, clientId, qbCustomerId: result.data.Id, qbDisplayName: result.data.DisplayName, syncVersion: 1, lastSyncedAt: new Date(), createdAt: new Date() });
      await logSync(userId, "customer", clientId, result.data.Id, "create", "success", undefined, customerData, result.data);
      await updateLastSyncTime(userId);
      return { success: true, qbCustomerId: result.data.Id };
    }
  } catch (error: any) {
    console.error("Error syncing client to QuickBooks:", error);
    await logSync(userId, "customer", clientId, existingMapping?.qbCustomerId || null, existingMapping ? "update" : "create", "failed", error.message);
    return { success: false, error: error.message };
  }
}

export async function syncAllClientsToQB(userId: number): Promise<{ synced: number; failed: number; errors: string[] }> {
  const clients = await getClientsByUserId(userId);
  let synced = 0, failed = 0;
  const errors: string[] = [];
  
  for (const client of clients) {
    const result = await syncClientToQB(userId, client.id);
    if (result.success) synced++;
    else { failed++; errors.push(`Client ${client.id}: ${result.error}`); }
  }
  return { synced, failed, errors };
}

export async function getClientSyncStatus(userId: number, clientId: number): Promise<{ synced: boolean; qbCustomerId: string | null; qbDisplayName: string | null; lastSyncedAt: Date | null; syncVersion: number | null }> {
  const db = await getDb();
  if (!db) return { synced: false, qbCustomerId: null, qbDisplayName: null, lastSyncedAt: null, syncVersion: null };

  const mappings = await db.select().from(quickbooksCustomerMapping).where(and(eq(quickbooksCustomerMapping.userId, userId), eq(quickbooksCustomerMapping.clientId, clientId))).limit(1);
  if (!mappings || mappings.length === 0 || !mappings[0]) return { synced: false, qbCustomerId: null, qbDisplayName: null, lastSyncedAt: null, syncVersion: null };
  
  const mapping = mappings[0];
  return { synced: true, qbCustomerId: mapping.qbCustomerId, qbDisplayName: mapping.qbDisplayName, lastSyncedAt: mapping.lastSyncedAt, syncVersion: mapping.syncVersion };
}
