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
  invoiceTemplates,
  Invoice,
  invoiceLineItems,
  InsertInvoiceLineItem,
  InvoiceLineItem,
  emailLog,
  InsertEmailLog,
  expenseCategories,
  expenses
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

export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select({
    id: invoices.id,
    invoiceNumber: invoices.invoiceNumber,
    status: invoices.status,
    issueDate: invoices.issueDate,
    dueDate: invoices.dueDate,
    total: invoices.total,
    paymentLink: invoices.stripePaymentLinkUrl,
    clientId: invoices.clientId,
    clientName: clients.name,
    clientEmail: clients.email,
  })
  .from(invoices)
  .leftJoin(clients, eq(invoices.clientId, clients.id))
  .where(eq(invoices.userId, userId))
  .orderBy(desc(invoices.createdAt));
  
  return results.map(r => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    status: r.status,
    issueDate: r.issueDate,
    dueDate: r.dueDate,
    total: r.total,
    paymentLink: r.paymentLink,
    client: {
      id: r.clientId,
      name: r.clientName || 'Unknown',
      email: r.clientEmail,
    },
  }));
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
  
  const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / paidInvoices : 0;
  
  return {
    totalRevenue,
    outstandingBalance,
    outstandingAmount: outstandingBalance, // Alias for compatibility
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    averageInvoiceValue,
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
    count: paidInvoices.filter(inv => inv.paidAt?.toISOString().slice(0, 7) === month).length,
  }));
}

export async function getInvoiceStatusBreakdown(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
  
  const breakdown: { [key: string]: { count: number; totalAmount: number } } = {};
  
  allInvoices.forEach(invoice => {
    if (!breakdown[invoice.status]) {
      breakdown[invoice.status] = { count: 0, totalAmount: 0 };
    }
    breakdown[invoice.status].count++;
    breakdown[invoice.status].totalAmount += Number(invoice.total);
  });
  
  return Object.entries(breakdown).map(([status, data]) => ({
    status,
    count: data.count,
    totalAmount: data.totalAmount,
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


// ============================================================================
// RECURRING INVOICE OPERATIONS
// ============================================================================

export async function createRecurringInvoice(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { recurringInvoices, recurringInvoiceLineItems } = await import("../drizzle/schema");
  
  const result = await db.insert(recurringInvoices).values(data);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(recurringInvoices)
    .where(eq(recurringInvoices.id, insertedId))
    .limit(1);
  
  return created[0]!;
}

export async function getRecurringInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { recurringInvoices } = await import("../drizzle/schema");
  
  return db.select().from(recurringInvoices)
    .where(eq(recurringInvoices.userId, userId))
    .orderBy(desc(recurringInvoices.createdAt));
}

export async function getRecurringInvoiceById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { recurringInvoices } = await import("../drizzle/schema");
  
  const result = await db.select().from(recurringInvoices)
    .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)))
    .limit(1);
  
  return result[0] || null;
}

export async function updateRecurringInvoice(id: number, userId: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { recurringInvoices } = await import("../drizzle/schema");
  
  await db.update(recurringInvoices)
    .set(data)
    .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)));
}

export async function deleteRecurringInvoice(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { recurringInvoices, recurringInvoiceLineItems } = await import("../drizzle/schema");
  
  // Delete line items first
  await db.delete(recurringInvoiceLineItems)
    .where(eq(recurringInvoiceLineItems.recurringInvoiceId, id));
  
  // Delete recurring invoice
  await db.delete(recurringInvoices)
    .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)));
}

export async function getRecurringInvoicesDueForGeneration() {
  const db = await getDb();
  if (!db) return [];
  
  const { recurringInvoices } = await import("../drizzle/schema");
  
  const now = new Date();
  
  return db.select().from(recurringInvoices)
    .where(and(
      eq(recurringInvoices.isActive, true),
      lte(recurringInvoices.nextInvoiceDate, now)
    ));
}

export async function createRecurringInvoiceLineItem(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { recurringInvoiceLineItems } = await import("../drizzle/schema");
  
  await db.insert(recurringInvoiceLineItems).values(data);
}

export async function getRecurringInvoiceLineItems(recurringInvoiceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { recurringInvoiceLineItems } = await import("../drizzle/schema");
  
  return db.select().from(recurringInvoiceLineItems)
    .where(eq(recurringInvoiceLineItems.recurringInvoiceId, recurringInvoiceId))
    .orderBy(recurringInvoiceLineItems.sortOrder);
}

export async function deleteRecurringInvoiceLineItems(recurringInvoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { recurringInvoiceLineItems } = await import("../drizzle/schema");
  
  await db.delete(recurringInvoiceLineItems)
    .where(eq(recurringInvoiceLineItems.recurringInvoiceId, recurringInvoiceId));
}


// ============================================
// Invoice Templates
// ============================================

export async function createInvoiceTemplate(template: {
  userId: number;
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  isDefault?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoiceTemplates).values(template);
  return result;
}

export async function getInvoiceTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(invoiceTemplates).where(eq(invoiceTemplates.userId, userId));
}

export async function getInvoiceTemplateById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(invoiceTemplates)
    .where(and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId)))
    .limit(1);

  return result[0];
}

export async function updateInvoiceTemplate(
  id: number,
  userId: number,
  updates: Partial<{
    name: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoUrl: string;
    isDefault: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(invoiceTemplates)
    .set(updates)
    .where(and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId)));
}

export async function deleteInvoiceTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(invoiceTemplates)
    .where(and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId)));
}

export async function setDefaultTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Unset all other defaults
  await db
    .update(invoiceTemplates)
    .set({ isDefault: false })
    .where(eq(invoiceTemplates.userId, userId));

  // Set the new default
  await db
    .update(invoiceTemplates)
    .set({ isDefault: true })
    .where(and(eq(invoiceTemplates.id, id), eq(invoiceTemplates.userId, userId)));
}


// ============================================
// Expense Categories
// ============================================

export async function createExpenseCategory(category: {
  userId: number;
  name: string;
  color?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(expenseCategories).values(category);
  return { success: true };
}

export async function getExpenseCategoriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(expenseCategories).where(eq(expenseCategories.userId, userId));
}

export async function deleteExpenseCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(expenseCategories)
    .where(and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId)));
}

// ============================================
// Expenses
// ============================================

export async function createExpense(expense: {
  userId: number;
  categoryId: number;
  amount: string;
  date: Date;
  description: string;
  receiptUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(expenses).values(expense);
  return { success: true };
}

export async function getExpensesByUserId(userId: number, filters?: {
  categoryId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      id: expenses.id,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      categoryColor: expenseCategories.color,
      amount: expenses.amount,
      date: expenses.date,
      description: expenses.description,
      receiptUrl: expenses.receiptUrl,
      createdAt: expenses.createdAt,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(eq(expenses.userId, userId))
    .$dynamic();

  if (filters?.categoryId) {
    query = query.where(eq(expenses.categoryId, filters.categoryId));
  }
  if (filters?.startDate) {
    query = query.where(gte(expenses.date, filters.startDate));
  }
  if (filters?.endDate) {
    query = query.where(lte(expenses.date, filters.endDate));
  }

  const results = await query.orderBy(desc(expenses.date));
  return results;
}

export async function getExpenseById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
    .limit(1);

  return result[0];
}

export async function updateExpense(
  id: number,
  userId: number,
  updates: Partial<{
    categoryId: number;
    amount: string;
    date: Date;
    description: string;
    receiptUrl: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(expenses)
    .set(updates)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function getExpenseStats(userId: number, months: number = 6) {
  const db = await getDb();
  if (!db) return { totalExpenses: "0", expensesByCategory: [] };

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Total expenses
  const totalResult = await db
    .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate)
    ));

  // Expenses by category
  const categoryResult = await db
    .select({
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      categoryColor: expenseCategories.color,
      total: sql<string>`SUM(${expenses.amount})`,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .where(and(
      eq(expenses.userId, userId),
      gte(expenses.date, startDate)
    ))
    .groupBy(expenses.categoryId, expenseCategories.name, expenseCategories.color);

  return {
    totalExpenses: totalResult[0]?.total || "0",
    expensesByCategory: categoryResult,
  };
}


// ============================================================================
// Invoice Generation Logs
// ============================================================================

export async function getGenerationLogsByRecurringId(recurringInvoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { invoiceGenerationLogs } = await import("../drizzle/schema");
  
  return await db
    .select()
    .from(invoiceGenerationLogs)
    .where(eq(invoiceGenerationLogs.recurringInvoiceId, recurringInvoiceId))
    .orderBy(desc(invoiceGenerationLogs.generationDate));
}


// ============================================================================
// Currencies
// ============================================================================

export async function getAllCurrencies() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { currencies } = await import("../drizzle/schema");
  
  return await db.select().from(currencies).where(eq(currencies.isActive, 1));
}

export async function getCurrencyByCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { currencies } = await import("../drizzle/schema");
  
  const result = await db.select().from(currencies).where(eq(currencies.code, code)).limit(1);
  return result[0];
}

export async function createCurrency(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { currencies } = await import("../drizzle/schema");
  
  const result = await db.insert(currencies).values(data);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(currencies).where(eq(currencies.id, insertedId)).limit(1);
  return inserted[0]!;
}

export async function updateCurrency(code: string, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { currencies } = await import("../drizzle/schema");
  
  await db.update(currencies).set(data).where(eq(currencies.code, code));
}

export async function updateExchangeRates(rates: Record<string, number>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { currencies } = await import("../drizzle/schema");
  
  // Update exchange rates for all currencies
  for (const [code, rate] of Object.entries(rates)) {
    await db.update(currencies)
      .set({ 
        exchangeRateToUSD: rate.toString(),
        lastUpdated: new Date(),
      })
      .where(eq(currencies.code, code));
  }
}

/**
 * Convert amount from one currency to another using exchange rates
 */
export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const from = await getCurrencyByCode(fromCurrency);
  const to = await getCurrencyByCode(toCurrency);
  
  if (!from || !to) {
    throw new Error(`Currency not found: ${!from ? fromCurrency : toCurrency}`);
  }
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / parseFloat(from.exchangeRateToUSD);
  const convertedAmount = amountInUSD * parseFloat(to.exchangeRateToUSD);
  
  return convertedAmount;
}


// ============================================================================
// Client Portal Access
// ============================================================================

export async function createClientPortalAccess(clientId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { clientPortalAccess } = await import("../drizzle/schema");
  const { nanoid } = await import("nanoid");
  
  // Generate unique access token
  const accessToken = nanoid(32);
  
  // Token expires in 90 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);
  
  await db.insert(clientPortalAccess).values({
    clientId,
    accessToken,
    expiresAt,
    isActive: 1,
  });
  
  return accessToken;
}

export async function getClientByAccessToken(accessToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { clientPortalAccess, clients } = await import("../drizzle/schema");
  
  const result = await db
    .select({
      client: clients,
      access: clientPortalAccess,
    })
    .from(clientPortalAccess)
    .innerJoin(clients, eq(clients.id, clientPortalAccess.clientId))
    .where(eq(clientPortalAccess.accessToken, accessToken))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const { client, access } = result[0]!;
  
  // Check if token is expired or inactive
  if (!access.isActive || new Date() > access.expiresAt) {
    return null;
  }
  
  // Update last accessed time
  await db
    .update(clientPortalAccess)
    .set({ lastAccessedAt: new Date() })
    .where(eq(clientPortalAccess.accessToken, accessToken));
  
  return client;
}

export async function getClientInvoices(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, clientId))
    .orderBy(desc(invoices.createdAt));
}
