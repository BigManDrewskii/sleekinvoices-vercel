import {
  eq,
  and,
  desc,
  sql,
  gte,
  inArray,
} from "drizzle-orm";
import type { InsertInvoice, Invoice } from "../../drizzle/schema";
import {
  invoices,
  clients,
  payments,
  invoiceTemplates,
  invoiceViews,
  quickbooksInvoiceMapping,
  invoiceLineItems,
} from "../../drizzle/schema";
import { getDb } from "./connection.js";

// ============================================================================
// INVOICE CRUD OPERATIONS
// ============================================================================

export async function createInvoice(invoice: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoices).values(invoice);
  const insertedId = Number(result[0].insertId);

  const created = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, insertedId))
    .limit(1);
  return created[0]!;
}

/**
 * Get all invoices for a user with payment information and QuickBooks sync status
 * Includes payment status, total paid, amount due, and QB sync info
 */
export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Optimized query: Join with payments and QuickBooks mapping to calculate totals in a single query
  const results = await db
    .select({
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
      // QuickBooks sync status
      qbInvoiceId: quickbooksInvoiceMapping.qbInvoiceId,
      qbLastSyncedAt: quickbooksInvoiceMapping.lastSyncedAt,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .leftJoin(
      quickbooksInvoiceMapping,
      and(
        eq(quickbooksInvoiceMapping.invoiceId, invoices.id),
        eq(quickbooksInvoiceMapping.userId, userId)
      )
    )
    .where(eq(invoices.userId, userId))
    .groupBy(
      invoices.id,
      clients.id,
      quickbooksInvoiceMapping.qbInvoiceId,
      quickbooksInvoiceMapping.lastSyncedAt
    )
    .orderBy(desc(invoices.createdAt));

  // Calculate payment status from aggregated data
  const invoicesWithPaymentStatus = results.map(r => {
    const totalPaid = parseFloat(r.totalPaid || "0");
    const invoiceTotal = Number(r.total);
    const amountDue = Math.max(0, invoiceTotal - totalPaid);

    let paymentStatus: "unpaid" | "partial" | "paid";
    if (totalPaid === 0) {
      paymentStatus = "unpaid";
    } else if (totalPaid >= invoiceTotal) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "partial";
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
      paymentProgress:
        invoiceTotal > 0 ? Math.round((totalPaid / invoiceTotal) * 100) : 0,
      client: {
        id: r.clientId,
        name: r.clientName || "Unknown",
        email: r.clientEmail,
      },
      // QuickBooks sync status
      quickbooks: {
        synced: !!r.qbInvoiceId,
        qbInvoiceId: r.qbInvoiceId || null,
        lastSyncedAt: r.qbLastSyncedAt || null,
      },
    };
  });

  return invoicesWithPaymentStatus;
}

export async function getInvoiceById(
  invoiceId: number,
  userId: number
): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .limit(1);

  return result[0];
}

/**
 * Get invoice by invoice number for a specific user
 * Used to check for duplicate invoice numbers
 */
export async function getInvoiceByNumber(
  userId: number,
  invoiceNumber: string
): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        eq(invoices.invoiceNumber, invoiceNumber)
      )
    )
    .limit(1);

  return result[0];
}

export async function updateInvoice(
  invoiceId: number,
  userId: number,
  data: Partial<InsertInvoice>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(invoices)
    .set(data)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));
}

export async function deleteInvoice(invoiceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete line items first
  await db
    .delete(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId));

  // Delete invoice
  await db
    .delete(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)));
}

export async function getNextInvoiceNumber(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
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
    return `INV-${nextNum.toString().padStart(4, "0")}`;
  }

  return "INV-0001";
}

// ============================================================================
// PAYMENT HELPERS
// ============================================================================

async function getTotalPaidForInvoice(
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
async function getBulkPaymentTotals(
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

// ============================================================================
// ANALYTICS OPERATIONS
// ============================================================================

/**
 * Get invoice payment status for a single invoice
 * Returns payment status and amounts
 */
export async function getInvoicePaymentStatus(invoiceId: number): Promise<{
  status: "unpaid" | "partial" | "paid";
  totalPaid: number;
  amountDue: number;
  invoiceTotal: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get invoice
  const invoiceResult = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  const invoice = invoiceResult[0];

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  const invoiceTotal = Number(invoice.total);
  const totalPaid = await getTotalPaidForInvoice(invoiceId);
  const amountDue = Math.max(0, invoiceTotal - totalPaid);

  let status: "unpaid" | "partial" | "paid";
  if (totalPaid === 0) {
    status = "unpaid";
  } else if (totalPaid >= invoiceTotal) {
    status = "paid";
  } else {
    status = "partial";
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
export async function getInvoiceStats(userId: number, periodDays: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  console.log(`[Analytics] Calculating stats for user ${userId}`);

  // Get all invoices for the user
  const allInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId));

  // Calculate period boundaries for comparison
  const now = new Date();
  const currentPeriodStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000
  );
  const previousPeriodStart = new Date(
    currentPeriodStart.getTime() - periodDays * 24 * 60 * 60 * 1000
  );

  // Filter invoices by period
  const currentPeriodInvoices = allInvoices.filter(
    inv => new Date(inv.createdAt) >= currentPeriodStart
  );
  const previousPeriodInvoices = allInvoices.filter(inv => {
    const date = new Date(inv.createdAt);
    return date >= previousPeriodStart && date < currentPeriodStart;
  });

  console.log(`[Analytics] Found ${allInvoices.length} invoices`);

  // Get payment totals for all invoices in one query (N+1 fix)
  const allInvoiceIds = allInvoices.map(inv => inv.id);
  const paymentTotals = await getBulkPaymentTotals(allInvoiceIds);

  // Calculate payment status for each invoice
  let totalBilled = 0; // Total amount of all invoices
  let totalPaid = 0; // Total amount collected
  let outstandingBalance = 0;
  let paidInvoices = 0;
  let partiallyPaidInvoices = 0;
  let unpaidInvoices = 0;

  for (const invoice of allInvoices) {
    const invoiceTotalPaid = paymentTotals.get(invoice.id) || 0;
    const invoiceTotal = Number(invoice.total);

    // Add to totals
    totalBilled += invoiceTotal;
    totalPaid += invoiceTotalPaid;

    // Determine payment status
    if (invoiceTotalPaid === 0) {
      unpaidInvoices++;
      outstandingBalance += invoiceTotal;
    } else if (invoiceTotalPaid >= invoiceTotal) {
      paidInvoices++;
      // Fully paid, no outstanding balance
    } else {
      partiallyPaidInvoices++;
      outstandingBalance += invoiceTotal - invoiceTotalPaid;
    }
  }

  const totalInvoices = allInvoices.length;
  const overdueInvoices = allInvoices.filter(
    inv => inv.status === "overdue"
  ).length;
  const averageInvoiceValue =
    totalInvoices > 0 ? totalBilled / totalInvoices : 0;

  // Calculate period-specific revenue for comparison
  let currentPeriodRevenue = 0;
  let previousPeriodRevenue = 0;

  for (const invoice of currentPeriodInvoices) {
    const invoiceTotal = Number(invoice.total);
    currentPeriodRevenue += invoiceTotal;
  }

  for (const invoice of previousPeriodInvoices) {
    const invoiceTotal = Number(invoice.total);
    previousPeriodRevenue += invoiceTotal;
  }

  // Calculate percentage change
  let revenueChangePercent = 0;
  if (previousPeriodRevenue > 0) {
    revenueChangePercent =
      ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) *
      100;
  } else if (currentPeriodRevenue > 0) {
    revenueChangePercent = 100; // New revenue from nothing
  }

  console.log(`[Analytics] Stats calculated:`, {
    totalRevenue: totalBilled,
    totalPaid,
    outstandingBalance,
    totalInvoices,
    paidInvoices,
    partiallyPaidInvoices,
    unpaidInvoices,
    overdueInvoices,
    currentPeriodRevenue,
    previousPeriodRevenue,
    revenueChangePercent,
  });

  // Calculate Days Sales Outstanding (DSO)
  // DSO = (Accounts Receivable / Total Credit Sales) × Number of Days
  // For simplicity, we use: Average days from invoice date to payment date for paid invoices
  let totalDaysToPayment = 0;
  let paidInvoicesWithPaymentDate = 0;

  for (const invoice of allInvoices) {
    if (invoice.status === "paid" || invoice.paidAt) {
      const invoiceDate = new Date(invoice.issueDate);
      const paidDate = invoice.paidAt ? new Date(invoice.paidAt) : new Date();
      const daysToPayment = Math.floor(
        (paidDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysToPayment >= 0) {
        totalDaysToPayment += daysToPayment;
        paidInvoicesWithPaymentDate++;
      }
    }
  }

  const dso =
    paidInvoicesWithPaymentDate > 0
      ? Math.round(totalDaysToPayment / paidInvoicesWithPaymentDate)
      : 0;

  // Calculate Collection Rate (percentage of invoices that got paid)
  const collectionRate =
    totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

  return {
    totalRevenue: totalBilled, // Total amount billed across all invoices
    outstandingBalance,
    outstandingAmount: outstandingBalance, // Alias for compatibility
    totalInvoices,
    paidInvoices,
    partiallyPaidInvoices,
    unpaidInvoices,
    overdueInvoices,
    averageInvoiceValue,
    // Period comparison data
    currentPeriodRevenue,
    previousPeriodRevenue,
    revenueChangePercent: Math.round(revenueChangePercent * 10) / 10, // Round to 1 decimal
    currentPeriodInvoices: currentPeriodInvoices.length,
    previousPeriodInvoices: previousPeriodInvoices.length,
    // New metrics
    dso, // Days Sales Outstanding
    collectionRate, // Percentage of invoices collected
  };
}

export async function getMonthlyRevenue(userId: number, months: number = 6) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Get ALL invoices (not just paid) to show revenue pipeline
  const allInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.userId, userId), gte(invoices.createdAt, startDate)))
    .orderBy(invoices.createdAt);

  // Group by month using createdAt
  const monthlyData: {
    [key: string]: { revenue: number; count: number; paidCount: number };
  } = {};

  allInvoices.forEach(invoice => {
    const monthKey = invoice.createdAt.toISOString().slice(0, 7); // YYYY-MM

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, count: 0, paidCount: 0 };
    }

    monthlyData[monthKey].count++;
    monthlyData[monthKey].revenue += Number(invoice.total);

    if (invoice.status === "paid") {
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

  const allInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId));

  const breakdown: { [key: string]: { count: number; totalAmount: number } } =
    {};

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
// INVOICE TEMPLATE OPERATIONS
// ============================================================================

export async function getDefaultTemplate(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(invoiceTemplates)
    .where(
      and(
        eq(invoiceTemplates.userId, userId),
        eq(invoiceTemplates.isDefault, true)
      )
    );

  return results[0] || null;
}

// ============================================================================
// INVOICE VIEW TRACKING
// ============================================================================

export async function recordInvoiceView(
  invoiceId: number,
  ipAddress?: string,
  userAgent?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Record the view
  await db.insert(invoiceViews).values({
    invoiceId,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  // Check if this is the first view
  const [invoice] = await db
    .select({ firstViewedAt: invoices.firstViewedAt, status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, invoiceId));

  // If first view, update the invoice
  if (invoice && !invoice.firstViewedAt) {
    const updates: { firstViewedAt: Date; status?: "viewed" } = {
      firstViewedAt: new Date(),
    };

    // Only update status to 'viewed' if currently 'sent'
    if (invoice.status === "sent") {
      updates.status = "viewed";
    }

    await db.update(invoices).set(updates).where(eq(invoices.id, invoiceId));
  }
}

export async function getInvoiceViewCount(invoiceId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(invoiceViews)
    .where(eq(invoiceViews.invoiceId, invoiceId));

  return result[0]?.count || 0;
}

export async function getInvoiceViews(invoiceId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(invoiceViews)
    .where(eq(invoiceViews.invoiceId, invoiceId))
    .orderBy(desc(invoiceViews.viewedAt));
}
