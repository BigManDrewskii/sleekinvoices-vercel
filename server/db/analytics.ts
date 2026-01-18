import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { invoices, payments, clients, expenses } from "../../drizzle/schema";
import { getDb } from "./connection";

/**
 * Get aging report for outstanding invoices
 */
export async function getAgingReport(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const allInvoices = await db
    .select()
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
  const invoiceMap = new Map<number, { invoice: any; totalPaid: number }>();

  // Calculate total paid per invoice
  for (const row of allInvoices) {
    const inv = row.invoices;
    const payment = row.payments;

    if (!invoiceMap.has(inv.id)) {
      invoiceMap.set(inv.id, { invoice: inv, totalPaid: 0 });
    }

    if (payment && payment.status === "completed") {
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
    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

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
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId));

  const profitability = [];

  for (const client of allClients) {
    // Calculate revenue (sum of payments for this client's invoices)
    const clientInvoices = await db
      .select()
      .from(invoices)
      .leftJoin(payments, eq(invoices.id, payments.invoiceId))
      .where(
        and(eq(invoices.userId, userId), eq(invoices.clientId, client.id))
      );

    let revenue = 0;
    for (const row of clientInvoices) {
      if (row.payments && row.payments.status === "completed") {
        revenue += Number(row.payments.amount);
      }
    }

    // Calculate expenses (billable expenses for this client)
    const clientExpenses = await db
      .select()
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
 * Get top clients by revenue (for analytics dashboard)
 */
export async function getTopClientsByRevenue(
  userId: number,
  limit: number = 5
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Get all clients
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId));

  const clientRevenue = [];

  for (const client of allClients) {
    // Get all invoices for this client
    const clientInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(eq(invoices.userId, userId), eq(invoices.clientId, client.id))
      );

    // Calculate total revenue from payments
    let totalRevenue = 0;
    let totalInvoiced = 0;
    let invoiceCount = 0;

    for (const invoice of clientInvoices) {
      totalInvoiced += Number(invoice.total);
      invoiceCount++;

      // Get payments for this invoice
      const invoicePayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.invoiceId, invoice.id),
            eq(payments.status, "completed")
          )
        );

      for (const payment of invoicePayments) {
        totalRevenue += Number(payment.amount);
      }
    }

    if (totalInvoiced > 0 || totalRevenue > 0) {
      clientRevenue.push({
        clientId: client.id,
        clientName: client.name,
        totalRevenue,
        totalInvoiced,
        invoiceCount,
        paymentRate:
          totalInvoiced > 0
            ? Math.round((totalRevenue / totalInvoiced) * 100)
            : 0,
      });
    }
  }

  // Sort by total invoiced (shows potential value) and take top N
  return clientRevenue
    .sort((a, b) => b.totalInvoiced - a.totalInvoiced)
    .slice(0, limit);
}

/**
 * Get cash flow projection for next N months
 */
export async function getCashFlowProjection(
  userId: number,
  months: number = 6
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const now = new Date();
  const projection = [];

  // Get historical expense average
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const historicalExpenses = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.userId, userId), gte(expenses.date, sixMonthsAgo)));

  const totalExpenses = historicalExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );
  const avgMonthlyExpense = totalExpenses / 6;

  // Project for each month
  for (let i = 0; i < months; i++) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

    // Expected income: unpaid invoices due in this month
    const unpaidInvoices = await db
      .select()
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
    const invoiceMap = new Map<number, { total: number; paid: number }>();

    for (const row of unpaidInvoices) {
      const inv = row.invoices;
      if (!invoiceMap.has(inv.id)) {
        invoiceMap.set(inv.id, { total: Number(inv.total), paid: 0 });
      }

      if (row.payments && row.payments.status === "completed") {
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
export async function getRevenueVsExpensesByMonth(
  userId: number,
  year: number = new Date().getFullYear()
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  // Get all payments in the year
  const yearPayments = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.status, "completed"),
        gte(payments.paymentDate, yearStart),
        lte(payments.paymentDate, yearEnd)
      )
    );

  // Get all expenses in the year
  const yearExpenses = await db
    .select()
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
    const monthPayments = yearPayments.filter(
      p => new Date(p.paymentDate).getMonth() === month
    );
    const monthExpenses = yearExpenses.filter(
      e => new Date(e.date).getMonth() === month
    );

    const revenue = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const expenseTotal = monthExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    monthlyData.push({
      month: new Date(year, month, 1).toISOString().slice(0, 7), // YYYY-MM
      revenue,
      expenses: expenseTotal,
      netProfit: revenue - expenseTotal,
    });
  }

  return monthlyData;
}
