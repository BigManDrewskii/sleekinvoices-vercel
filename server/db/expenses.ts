import { eq, and, desc, sql, gte, lte, isNull } from "drizzle-orm";
import { getDb } from "./connection.js";
import { expenses, expenseCategories, clients } from "../../drizzle/schema.js";

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

  const result = await db.insert(expenseCategories).values(category);
  const insertId = result[0].insertId;

  // Fetch and return the created category
  const [created] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, insertId));

  return created || { success: true, id: insertId, ...category };
}

export async function getExpenseCategoriesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.userId, userId));
}

export async function deleteExpenseCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(expenseCategories)
    .where(
      and(eq(expenseCategories.id, id), eq(expenseCategories.userId, userId))
    );
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
  paymentMethod?:
    | "cash"
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "check"
    | "other";
  taxAmount?: string;
  receiptUrl?: string;
  receiptKey?: string;
  isBillable?: boolean;
  clientId?: number;
  invoiceId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(expenses).values(expense);
  const insertId = result[0].insertId;

  // Fetch and return the created expense
  const [created] = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, insertId));

  return created || { success: true, id: insertId, ...expense };
}

export async function getExpensesByUserId(
  userId: number,
  filters?: {
    categoryId?: number;
    startDate?: Date;
    endDate?: Date;
    isBillable?: boolean;
    clientId?: number;
  }
) {
  const db = await getDb();
  if (!db) return [];

  // Build where conditions array
  const conditions = [eq(expenses.userId, userId)];

  if (filters?.categoryId) {
    conditions.push(eq(expenses.categoryId, filters.categoryId));
  }
  if (filters?.startDate) {
    conditions.push(gte(expenses.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(expenses.date, filters.endDate));
  }
  if (filters?.isBillable !== undefined) {
    conditions.push(eq(expenses.isBillable, filters.isBillable));
  }
  if (filters?.clientId) {
    conditions.push(eq(expenses.clientId, filters.clientId));
  }

  const results = await db
    .select({
      id: expenses.id,
      userId: expenses.userId,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      categoryColor: expenseCategories.color,
      amount: expenses.amount,
      currency: expenses.currency,
      date: expenses.date,
      description: expenses.description,
      vendor: expenses.vendor,
      notes: expenses.notes,
      receiptUrl: expenses.receiptUrl,
      receiptKey: expenses.receiptKey,
      paymentMethod: expenses.paymentMethod,
      taxAmount: expenses.taxAmount,
      isBillable: expenses.isBillable,
      clientId: expenses.clientId,
      clientName: clients.name,
      invoiceId: expenses.invoiceId,
      billedAt: expenses.billedAt,
      isRecurring: expenses.isRecurring,
      isTaxDeductible: expenses.isTaxDeductible,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .leftJoin(clients, eq(expenses.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.date));

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
    currency: string;
    date: Date;
    description: string;
    vendor: string;
    notes: string;
    receiptUrl: string;
    receiptKey: string;
    paymentMethod:
      | "cash"
      | "credit_card"
      | "debit_card"
      | "bank_transfer"
      | "check"
      | "other";
    taxAmount: string;
    isBillable: boolean;
    clientId: number | null;
    invoiceId: number | null;
    billedAt: Date | null;
    isTaxDeductible: boolean;
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
    .where(and(eq(expenses.userId, userId), gte(expenses.date, startDate)));

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
    .where(and(eq(expenses.userId, userId), gte(expenses.date, startDate)))
    .groupBy(
      expenses.categoryId,
      expenseCategories.name,
      expenseCategories.color
    );

  return {
    totalExpenses: totalResult[0]?.total || "0",
    expensesByCategory: categoryResult,
  };
}

// ============================================
// Billable Expense Functions
// ============================================

export async function getBillableUnlinkedExpenses(
  userId: number,
  clientId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const conditions = [
    eq(expenses.userId, userId),
    eq(expenses.isBillable, true),
    isNull(expenses.invoiceId),
  ];

  if (clientId) {
    conditions.push(eq(expenses.clientId, clientId));
  }

  const result = await db
    .select({
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

export async function linkExpenseToInvoice(
  expenseId: number,
  invoiceId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Verify expense belongs to user and is billable
  const expense = await db
    .select()
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
  await db
    .update(expenses)
    .set({ invoiceId })
    .where(eq(expenses.id, expenseId));

  return { success: true };
}
