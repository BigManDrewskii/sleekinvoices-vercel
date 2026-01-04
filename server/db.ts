import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  clients, 
  InsertClient, 
  Client,
  invoices,
  InsertInvoice,
  Invoice,
  invoiceLineItems,
  InsertInvoiceLineItem,
  InvoiceLineItem,
  emailLog,
  InsertEmailLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

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

    const textFields = ["name", "email", "loginMethod", "companyName", "companyAddress", "companyPhone", "logoUrl", "stripeCustomerId", "subscriptionId"] as const;
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
      values.role = 'admin';
      updateSet.role = 'admin';
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, data: {
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: "free" | "active" | "canceled" | "past_due";
  currentPeriodEnd?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ============================================================================
// CLIENT OPERATIONS
// ============================================================================

export async function createClient(client: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(clients).values(client);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(clients).where(eq(clients.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}

export async function getClientById(clientId: number, userId: number): Promise<Client | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function updateClient(clientId: number, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(clients).set(data)
    .where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
}

export async function deleteClient(clientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(clients).where(and(eq(clients.id, clientId), eq(clients.userId, userId)));
}

// ============================================================================
// INVOICE OPERATIONS
// ============================================================================

export async function createInvoice(invoice: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoices).values(invoice);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(invoices).where(eq(invoices.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getInvoicesByUserId(userId: number): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(invoiceId: number, userId: number): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function updateInvoice(invoiceId: number, userId: number, data: Partial<InsertInvoice>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(invoices).set(data)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));
}

export async function deleteInvoice(invoiceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete line items first
  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
  
  // Delete invoice
  await db.delete(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));
}

export async function getNextInvoiceNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt))
    .limit(1);
  
  if (result.length === 0) {
    return "INV-0001";
  }
  
  const lastNumber = result[0]!.invoiceNumber;
  const match = lastNumber.match(/INV-(\d+)/);
  
  if (match) {
    const nextNum = parseInt(match[1]!) + 1;
    return `INV-${nextNum.toString().padStart(4, '0')}`;
  }
  
  return "INV-0001";
}

// ============================================================================
// INVOICE LINE ITEM OPERATIONS
// ============================================================================

export async function createLineItem(lineItem: InsertInvoiceLineItem): Promise<InvoiceLineItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoiceLineItems).values(lineItem);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getLineItemsByInvoiceId(invoiceId: number): Promise<InvoiceLineItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(invoiceLineItems.sortOrder);
}

export async function deleteLineItem(lineItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, lineItemId));
}

export async function deleteLineItemsByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId));
}

// ============================================================================
// ANALYTICS OPERATIONS
// ============================================================================

export async function getInvoiceStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
  
  const totalRevenue = allInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  const outstandingBalance = allInvoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  const totalInvoices = allInvoices.length;
  const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').length;
  const overdueInvoices = allInvoices.filter(inv => inv.status === 'overdue').length;
  
  return {
    totalRevenue,
    outstandingBalance,
    totalInvoices,
    paidInvoices,
    overdueInvoices,
  };
}

export async function getMonthlyRevenue(userId: number, months: number = 6) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const paidInvoices = await db.select().from(invoices)
    .where(and(
      eq(invoices.userId, userId),
      eq(invoices.status, 'paid'),
      gte(invoices.paidAt, startDate)
    ))
    .orderBy(invoices.paidAt);
  
  // Group by month
  const monthlyData: { [key: string]: number } = {};
  
  paidInvoices.forEach(invoice => {
    if (invoice.paidAt) {
      const monthKey = invoice.paidAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(invoice.total);
    }
  });
  
  return Object.entries(monthlyData).map(([month, revenue]) => ({
    month,
    revenue,
  }));
}

// ============================================================================
// EMAIL LOG OPERATIONS
// ============================================================================

export async function logEmail(emailData: InsertEmailLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(emailLog).values(emailData);
}

export async function getEmailLogByInvoiceId(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(emailLog)
    .where(eq(emailLog.invoiceId, invoiceId))
    .orderBy(desc(emailLog.sentAt));
}
