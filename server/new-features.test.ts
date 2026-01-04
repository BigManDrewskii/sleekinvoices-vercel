import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Expense Categories", () => {
  it("creates an expense category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.expenses.categories.create({
      name: "Office Supplies",
      color: "#3B82F6",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });

  it("lists expense categories", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.expenses.categories.list();
    expect(Array.isArray(categories)).toBe(true);
  });
});

describe("Expenses", () => {
  it("creates an expense", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a category
    await caller.expenses.categories.create({
      name: "Travel",
      color: "#EF4444",
    });

    const categories = await caller.expenses.categories.list();
    const categoryId = categories[0]?.id;

    if (categoryId) {
      const result = await caller.expenses.create({
        categoryId,
        amount: 150.50,
        date: new Date(),
        description: "Flight to conference",
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    }
  });

  it("lists expenses", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const expenses = await caller.expenses.list();
    expect(Array.isArray(expenses)).toBe(true);
  });

  it("gets expense stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.expenses.stats({ months: 6 });
    expect(stats).toHaveProperty("totalExpenses");
    expect(stats).toHaveProperty("expensesByCategory");
  });
});

describe("Invoice Templates", () => {
  it("creates an invoice template", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.templates.create({
      name: "Professional Blue",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      fontFamily: "Inter",
    });

    expect(result).toBeDefined();
  });

  it("lists invoice templates", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.templates.list();
    expect(Array.isArray(templates)).toBe(true);
  });

  it("sets default template", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const templates = await caller.templates.list();
    if (templates.length > 0) {
      const result = await caller.templates.setDefault({ id: templates[0].id });
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    }
  });
});

describe("Recurring Invoices", () => {
  it("creates a recurring invoice", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a client
    const client = await caller.clients.create({
      name: "Recurring Client",
      email: "recurring@example.com",
    });

    const result = await caller.recurringInvoices.create({
      clientId: client.id,
      frequency: "monthly",
      startDate: new Date(),
      nextInvoiceDate: new Date(),
      invoiceNumberPrefix: "REC",
      lineItems: [
        {
          description: "Monthly Subscription",
          quantity: 1,
          rate: 99.99,
        },
      ],
      taxRate: 0,
      discountType: "percentage",
      discountValue: 0,
    });

    expect(result).toBeDefined();
  });

  it("lists recurring invoices", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const recurring = await caller.recurringInvoices.list();
    expect(Array.isArray(recurring)).toBe(true);
  });

  it("toggles recurring invoice active status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const recurring = await caller.recurringInvoices.list();
    if (recurring.length > 0) {
      const result = await caller.recurringInvoices.toggle({
        id: recurring[0].id,
        isActive: false,
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    }
  });
});
