import { eq, and, desc, sql, gte, lte, isNull } from "drizzle-orm";
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
  expenses,
  payments,
  InsertPayment,
  Payment,
  stripeWebhookEvents,
  InsertStripeWebhookEvent,
  reminderSettings,
  reminderLogs,
  usageTracking
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { DEFAULT_REMINDER_TEMPLATE } from './email';

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

/**
 * Get all invoices for a user with payment information
 * Includes payment status, total paid, and amount due
 */
export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Optimized query: Join with payments and calculate totals in a single query
  const results = await db.select({
    id: invoices.id,
    invoiceNumber: invoices.invoiceNumber,
    status: invoices.status,
    issueDate: invoices.issueDate,
    dueDate: invoices.dueDate,
    total: invoices.total,
    amountPaid: invoices.amountPaid,
    currency: invoices.currency,
    paymentLink: invoices.stripePaymentLinkUrl,
    clientId: invoices.clientId,
    clientName: clients.name,
    clientEmail: clients.email,
    totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'completed' THEN ${payments.amount} ELSE 0 END), 0)`,
  })
  .from(invoices)
  .leftJoin(clients, eq(invoices.clientId, clients.id))
  .leftJoin(payments, eq(payments.invoiceId, invoices.id))
  .where(eq(invoices.userId, userId))
  .groupBy(invoices.id, clients.id)
  .orderBy(desc(invoices.createdAt));
  
  // Calculate payment status from aggregated data
  const invoicesWithPaymentStatus = results.map((r) => {
    const totalPaid = parseFloat(r.totalPaid || '0');
    const invoiceTotal = Number(r.total);
    const amountDue = Math.max(0, invoiceTotal - totalPaid);
    
    let paymentStatus: 'unpaid' | 'partial' | 'paid';
    if (totalPaid === 0) {
      paymentStatus = 'unpaid';
    } else if (totalPaid >= invoiceTotal) {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'partial';
    }
    
    return {
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      status: r.status,
      issueDate: r.issueDate,
      dueDate: r.dueDate,
      total: r.total,
      currency: r.currency,
      paymentLink: r.paymentLink,
      // Payment information
      totalPaid: totalPaid.toString(),
      amountDue: amountDue.toString(),
      paymentStatus,
      paymentProgress: invoiceTotal > 0 ? Math.round((totalPaid / invoiceTotal) * 100) : 0,
      client: {
        id: r.clientId,
        name: r.clientName || 'Unknown',
        email: r.clientEmail,
      },
    };
  });
  
  return invoicesWithPaymentStatus;
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

/**
 * Get invoice payment status for a single invoice
 * Returns payment status and amounts
 */
export async function getInvoicePaymentStatus(invoiceId: number): Promise<{
  status: 'unpaid' | 'partial' | 'paid';
  totalPaid: number;
  amountDue: number;
  invoiceTotal: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get invoice
  const invoiceResult = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  const invoice = invoiceResult[0];
  
  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }
  
  const invoiceTotal = Number(invoice.total);
  const totalPaid = await getTotalPaidForInvoice(invoiceId);
  const amountDue = Math.max(0, invoiceTotal - totalPaid);
  
  let status: 'unpaid' | 'partial' | 'paid';
  if (totalPaid === 0) {
    status = 'unpaid';
  } else if (totalPaid >= invoiceTotal) {
    status = 'paid';
  } else {
    status = 'partial';
  }
  
  return {
    status,
    totalPaid,
    amountDue,
    invoiceTotal,
  };
}

/**
 * Get comprehensive invoice statistics based on actual payment data
 * This uses the payments table to calculate accurate revenue and paid counts
 */
export async function getInvoiceStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log(`[Analytics] Calculating stats for user ${userId}`);
  
  // Get all invoices for the user
  const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
  
  console.log(`[Analytics] Found ${allInvoices.length} invoices`);
  
  // Calculate payment status for each invoice
  let totalRevenue = 0;
  let outstandingBalance = 0;
  let paidInvoices = 0;
  let partiallyPaidInvoices = 0;
  let unpaidInvoices = 0;
  
  for (const invoice of allInvoices) {
    const totalPaid = await getTotalPaidForInvoice(invoice.id);
    const invoiceTotal = Number(invoice.total);
    
    // Add to revenue (sum of all payments received)
    totalRevenue += totalPaid;
    
    // Determine payment status
    if (totalPaid === 0) {
      unpaidInvoices++;
      outstandingBalance += invoiceTotal;
    } else if (totalPaid >= invoiceTotal) {
      paidInvoices++;
      // Fully paid, no outstanding balance
    } else {
      partiallyPaidInvoices++;
      outstandingBalance += (invoiceTotal - totalPaid);
    }
  }
  
  const totalInvoices = allInvoices.length;
  const overdueInvoices = allInvoices.filter(inv => inv.status === 'overdue').length;
  const averageInvoiceValue = paidInvoices > 0 ? totalRevenue / paidInvoices : 0;
  
  console.log(`[Analytics] Stats calculated:`, {
    totalRevenue,
    outstandingBalance,
    totalInvoices,
    paidInvoices,
    partiallyPaidInvoices,
    unpaidInvoices,
    overdueInvoices,
  });
  
  return {
    totalRevenue,
    outstandingBalance,
    outstandingAmount: outstandingBalance, // Alias for compatibility
    totalInvoices,
    paidInvoices,
    partiallyPaidInvoices,
    unpaidInvoices,
    overdueInvoices,
    averageInvoiceValue,
  };
}

export async function getMonthlyRevenue(userId: number, months: number = 6) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  // Get ALL invoices (not just paid) to show revenue pipeline
  const allInvoices = await db.select().from(invoices)
    .where(and(
      eq(invoices.userId, userId),
      gte(invoices.createdAt, startDate)
    ))
    .orderBy(invoices.createdAt);
  
  // Group by month using createdAt
  const monthlyData: { [key: string]: { revenue: number; count: number; paidCount: number } } = {};
  
  allInvoices.forEach(invoice => {
    const monthKey = invoice.createdAt.toISOString().slice(0, 7); // YYYY-MM
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, count: 0, paidCount: 0 };
    }
    
    monthlyData[monthKey].count++;
    monthlyData[monthKey].revenue += Number(invoice.total);
    
    if (invoice.status === 'paid') {
      monthlyData[monthKey].paidCount++;
    }
  });
  
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    count: data.count,
    paidCount: data.paidCount,
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
  
  const { recurringInvoices, clients } = await import("../drizzle/schema");
  
  // Join with clients table to get client information
  const results = await db.select({
    id: recurringInvoices.id,
    userId: recurringInvoices.userId,
    clientId: recurringInvoices.clientId,
    frequency: recurringInvoices.frequency,
    startDate: recurringInvoices.startDate,
    endDate: recurringInvoices.endDate,
    nextInvoiceDate: recurringInvoices.nextInvoiceDate,
    invoiceNumberPrefix: recurringInvoices.invoiceNumberPrefix,
    taxRate: recurringInvoices.taxRate,
    discountType: recurringInvoices.discountType,
    discountValue: recurringInvoices.discountValue,
    notes: recurringInvoices.notes,
    paymentTerms: recurringInvoices.paymentTerms,
    isActive: recurringInvoices.isActive,
    createdAt: recurringInvoices.createdAt,
    // Client fields
    clientName: clients.name,
    clientEmail: clients.email,
  })
  .from(recurringInvoices)
  .leftJoin(clients, eq(recurringInvoices.clientId, clients.id))
  .where(eq(recurringInvoices.userId, userId))
  .orderBy(desc(recurringInvoices.createdAt));
  
  return results;
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
  vendor?: string;
  paymentMethod?: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other';
  taxAmount?: string;
  receiptUrl?: string;
  receiptKey?: string;
  isBillable?: boolean;
  clientId?: number;
  invoiceId?: number;
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


// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

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
export async function getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
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
  
  let query = db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId));
  
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
export async function getPaymentById(paymentId: number): Promise<Payment | null> {
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
 * Get total paid amount for an invoice
 */
export async function getTotalPaidForInvoice(invoiceId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      total: sql<string>`SUM(${payments.amount})`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.invoiceId, invoiceId),
        eq(payments.status, "completed")
      )
    );
  
  return parseFloat(result[0]?.total || "0");
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
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.status, "completed")
      )
    );
  
  // Payments by method
  const byMethodResult = await db
    .select({
      method: payments.paymentMethod,
      total: sql<string>`SUM(${payments.amount})`,
      count: sql<string>`COUNT(*)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.status, "completed")
      )
    )
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

// ============================================================================
// STRIPE WEBHOOK OPERATIONS
// ============================================================================

/**
 * Log a Stripe webhook event
 */
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
export async function markWebhookEventProcessed(eventId: string): Promise<void> {
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
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.eventId, eventId))
    .limit(1);
  
  return result.length > 0 && result[0]!.processed === 1;
}


// ============================================================================
// REMINDER OPERATIONS
// ============================================================================

export async function getReminderSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const settings = await db.select().from(reminderSettings).where(eq(reminderSettings.userId, userId)).limit(1);
  return settings[0] || null;
}

export async function upsertReminderSettings(userId: number, data: {
  enabled?: boolean;
  intervals?: number[];
  emailTemplate?: string;
  ccEmail?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const existing = await getReminderSettings(userId);
  
  const settingsData = {
    userId,
    enabled: data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1,
    intervals: data.intervals ? JSON.stringify(data.intervals) : JSON.stringify([3, 7, 14]),
    emailTemplate: data.emailTemplate || DEFAULT_REMINDER_TEMPLATE,
    ccEmail: data.ccEmail || null,
  };
  
  if (existing) {
    await db.update(reminderSettings)
      .set(settingsData)
      .where(eq(reminderSettings.userId, userId));
  } else {
    await db.insert(reminderSettings).values(settingsData);
  }
  
  return await getReminderSettings(userId);
}

export async function logReminderSent(data: {
  invoiceId: number;
  userId: number;
  daysOverdue: number;
  recipientEmail: string;
  status: 'sent' | 'failed';
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
  
  return await db.select()
    .from(reminderLogs)
    .where(eq(reminderLogs.invoiceId, invoiceId))
    .orderBy(desc(reminderLogs.sentAt));
}

export async function getLastReminderSent(invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const logs = await db.select()
    .from(reminderLogs)
    .where(eq(reminderLogs.invoiceId, invoiceId))
    .orderBy(desc(reminderLogs.sentAt))
    .limit(1);
  
  return logs[0] || null;
}

export async function wasReminderSentToday(invoiceId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const logs = await db.select()
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

/**
 * Advanced Analytics Functions
 */

/**
 * Get aging report showing invoices by days overdue
 */
export async function getAgingReport(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const allInvoices = await db.select()
    .from(invoices)
    .leftJoin(payments, eq(invoices.id, payments.invoiceId))
    .where(eq(invoices.userId, userId));
  
  // Group invoices by aging bucket
  const aging = {
    current: { count: 0, amount: 0 }, // Not overdue
    days_0_30: { count: 0, amount: 0 },
    days_31_60: { count: 0, amount: 0 },
    days_61_90: { count: 0, amount: 0 },
    days_90_plus: { count: 0, amount: 0 },
  };
  
  const now = new Date();
  const invoiceMap = new Map<number, { invoice: any, totalPaid: number }>();
  
  // Calculate total paid per invoice
  for (const row of allInvoices) {
    const inv = row.invoices;
    const payment = row.payments;
    
    if (!invoiceMap.has(inv.id)) {
      invoiceMap.set(inv.id, { invoice: inv, totalPaid: 0 });
    }
    
    if (payment && payment.status === 'completed') {
      invoiceMap.get(inv.id)!.totalPaid += Number(payment.amount);
    }
  }
  
  // Categorize by aging
  for (const { invoice, totalPaid } of Array.from(invoiceMap.values())) {
    const total = Number(invoice.total);
    const outstanding = total - totalPaid;
    
    // Skip fully paid invoices
    if (outstanding <= 0) continue;
    
    const dueDate = new Date(invoice.dueDate);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOverdue < 0) {
      aging.current.count++;
      aging.current.amount += outstanding;
    } else if (daysOverdue <= 30) {
      aging.days_0_30.count++;
      aging.days_0_30.amount += outstanding;
    } else if (daysOverdue <= 60) {
      aging.days_31_60.count++;
      aging.days_31_60.amount += outstanding;
    } else if (daysOverdue <= 90) {
      aging.days_61_90.count++;
      aging.days_61_90.amount += outstanding;
    } else {
      aging.days_90_plus.count++;
      aging.days_90_plus.amount += outstanding;
    }
  }
  
  return aging;
}

/**
 * Get client profitability (revenue vs expenses per client)
 */
export async function getClientProfitability(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Get all clients
  const allClients = await db.select().from(clients).where(eq(clients.userId, userId));
  
  const profitability = [];
  
  for (const client of allClients) {
    // Calculate revenue (sum of payments for this client's invoices)
    const clientInvoices = await db.select()
      .from(invoices)
      .leftJoin(payments, eq(invoices.id, payments.invoiceId))
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.clientId, client.id)
        )
      );
    
    let revenue = 0;
    for (const row of clientInvoices) {
      if (row.payments && row.payments.status === 'completed') {
        revenue += Number(row.payments.amount);
      }
    }
    
    // Calculate expenses (billable expenses for this client)
    const clientExpenses = await db.select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.clientId, client.id),
          eq(expenses.isBillable, true)
        )
      );
    
    let expenseTotal = 0;
    for (const expense of clientExpenses) {
      expenseTotal += Number(expense.amount);
    }
    
    const profit = revenue - expenseTotal;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    profitability.push({
      clientId: client.id,
      clientName: client.name,
      revenue,
      expenses: expenseTotal,
      profit,
      margin,
    });
  }
  
  // Sort by profit descending
  return profitability.sort((a, b) => b.profit - a.profit);
}

/**
 * Get cash flow projection for next N months
 */
export async function getCashFlowProjection(userId: number, months: number = 6) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const now = new Date();
  const projection = [];
  
  // Get historical expense average
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const historicalExpenses = await db.select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.date, sixMonthsAgo)
      )
    );
  
  const totalExpenses = historicalExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const avgMonthlyExpense = totalExpenses / 6;
  
  // Project for each month
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
    
    // Expected income: unpaid invoices due in this month
    const unpaidInvoices = await db.select()
      .from(invoices)
      .leftJoin(payments, eq(invoices.id, payments.invoiceId))
      .where(
        and(
          eq(invoices.userId, userId),
          gte(invoices.dueDate, monthStart),
          lte(invoices.dueDate, monthEnd)
        )
      );
    
    let expectedIncome = 0;
    const invoiceMap = new Map<number, { total: number, paid: number }>();
    
    for (const row of unpaidInvoices) {
      const inv = row.invoices;
      if (!invoiceMap.has(inv.id)) {
        invoiceMap.set(inv.id, { total: Number(inv.total), paid: 0 });
      }
      
      if (row.payments && row.payments.status === 'completed') {
        invoiceMap.get(inv.id)!.paid += Number(row.payments.amount);
      }
    }
    
    for (const { total, paid } of Array.from(invoiceMap.values())) {
      expectedIncome += Math.max(0, total - paid);
    }
    
    projection.push({
      month: monthStart.toISOString().slice(0, 7), // YYYY-MM
      expectedIncome,
      expectedExpenses: avgMonthlyExpense,
      netCashFlow: expectedIncome - avgMonthlyExpense,
    });
  }
  
  return projection;
}

/**
 * Get revenue vs expenses by month for a given year
 */
export async function getRevenueVsExpensesByMonth(userId: number, year: number = new Date().getFullYear()) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  
  // Get all payments in the year
  const yearPayments = await db.select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.status, 'completed'),
        gte(payments.paymentDate, yearStart),
        lte(payments.paymentDate, yearEnd)
      )
    );
  
  // Get all expenses in the year
  const yearExpenses = await db.select()
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        gte(expenses.date, yearStart),
        lte(expenses.date, yearEnd)
      )
    );
  
  // Group by month
  const monthlyData = [];
  for (let month = 0; month < 12; month++) {
    const monthPayments = yearPayments.filter(p => new Date(p.paymentDate).getMonth() === month);
    const monthExpenses = yearExpenses.filter(e => new Date(e.date).getMonth() === month);
    
    const revenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const expenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    monthlyData.push({
      month: new Date(year, month, 1).toISOString().slice(0, 7), // YYYY-MM
      revenue,
      expenses: expenseTotal,
      netProfit: revenue - expenseTotal,
    });
  }
  
  return monthlyData;
}

// Billable Expense Functions
export async function getBillableUnlinkedExpenses(userId: number, clientId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const conditions = [
    eq(expenses.userId, userId),
    eq(expenses.isBillable, true),
    isNull(expenses.invoiceId)
  ];
  
  if (clientId) {
    conditions.push(eq(expenses.clientId, clientId));
  }
  
  const result = await db.select({
    id: expenses.id,
    description: expenses.description,
    amount: expenses.amount,
    taxAmount: expenses.taxAmount,
    date: expenses.date,
    vendor: expenses.vendor,
    clientId: expenses.clientId,
    clientName: clients.name,
  })
    .from(expenses)
    .leftJoin(clients, eq(expenses.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.date));
  
  return result;
}

export async function linkExpenseToInvoice(expenseId: number, invoiceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Verify expense belongs to user and is billable
  const expense = await db.select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId),
        eq(expenses.isBillable, true)
      )
    )
    .limit(1);
  
  if (expense.length === 0) {
    throw new Error("Expense not found or not billable");
  }
  
  // Update expense with invoiceId
  await db.update(expenses)
    .set({ invoiceId })
    .where(eq(expenses.id, expenseId));
  
  return { success: true };
}


// ============================================================================
// Usage Tracking (Invoice Limits for Free Tier)
// ============================================================================

/**
 * Get current month's usage for a user
 * Returns the number of invoices created this month
 * 
 * @param userId - User ID to check usage for
 * @returns Object with invoicesCreated count (0 if no record exists)
 * 
 * @example
 * const usage = await getCurrentMonthUsage(123);
 * console.log(`User has created ${usage.invoicesCreated} invoices this month`);
 */
export async function getCurrentMonthUsage(userId: number): Promise<{ invoicesCreated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [record] = await db
    .select()
    .from(usageTracking)
    .where(and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.month, currentMonth)
    ))
    .limit(1);

  return {
    invoicesCreated: record?.invoicesCreated ?? 0
  };
}

/**
 * Increment the invoice count for a user in the current month
 * Creates a new record if one doesn't exist for this month
 * Uses INSERT ... ON DUPLICATE KEY UPDATE for atomic upsert
 * 
 * @param userId - User ID to increment count for
 * @returns The new invoice count after increment
 * 
 * @example
 * const newCount = await incrementInvoiceCount(123);
 * console.log(`User now has ${newCount} invoices this month`);
 */
export async function incrementInvoiceCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current month in YYYY-MM format
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Try to insert new record, or update existing one
  await db
    .insert(usageTracking)
    .values({
      userId,
      month: currentMonth,
      invoicesCreated: 1,
    })
    .onDuplicateKeyUpdate({
      set: {
        invoicesCreated: sql`${usageTracking.invoicesCreated} + 1`,
        updatedAt: sql`NOW()`,
      },
    });

  // Fetch the updated count
  const usage = await getCurrentMonthUsage(userId);
  return usage.invoicesCreated;
}

/**
 * Check if a user can create an invoice based on their subscription status and usage
 * Pro users can always create invoices (unlimited)
 * Free users are limited to 3 invoices per month
 * 
 * @param userId - User ID to check
 * @param subscriptionStatus - User's subscription status from database
 * @returns true if user can create invoice, false if limit reached
 * 
 * @example
 * const canCreate = await canUserCreateInvoice(123, 'free');
 * if (!canCreate) {
 *   throw new Error('Monthly invoice limit reached');
 * }
 */
export async function canUserCreateInvoice(
  userId: number,
  subscriptionStatus: 'free' | 'active' | 'canceled' | 'past_due' | 'trialing' | null
): Promise<boolean> {
  // Import subscription helpers from shared constants
  const { isPro, canCreateInvoice } = await import('../shared/subscription.js');

  // Pro users bypass all limits
  if (isPro(subscriptionStatus)) {
    return true;
  }

  // Get current month usage for free users
  const usage = await getCurrentMonthUsage(userId);

  // Check against free tier limit (3 invoices/month)
  return canCreateInvoice(subscriptionStatus, usage.invoicesCreated);
}
