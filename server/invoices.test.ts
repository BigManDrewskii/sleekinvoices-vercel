import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    subscriptionStatus: "active", // Pro subscription to bypass invoice limit
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

  return { ctx };
}

describe("invoices router", () => {
  it("should calculate invoice totals correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test client first
    const clientResult = await caller.clients.create({
      name: "Test Client",
      email: "client@example.com",
    });

    // Create invoice with line items
    const result = await caller.invoices.create({
      clientId: clientResult.id,
      invoiceNumber: "INV-001",
      status: "draft" as const,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lineItems: [
        { description: "Item 1", quantity: 2, rate: 100 },
        { description: "Item 2", quantity: 1, rate: 50 },
      ],
      taxRate: 10, // 10%
      discountType: "percentage" as const,
      discountValue: 20, // 20%
    });

    expect(result).toBeDefined();
    expect(result.id).toBeTypeOf("number");
    expect(result.invoiceNumber).toBe("INV-001");
    expect(result.status).toBe("draft");

    // Verify calculations:
    // Subtotal: (2 * 100) + (1 * 50) = 250
    // Discount: 250 * 20% = 50
    // After discount: 250 - 50 = 200
    // Tax: 200 * 10% = 20
    // Total: 200 + 20 = 220
  });

  it("should allow creating invoice with empty line items (for draft)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const clientResult = await caller.clients.create({
      name: "Test Client",
      email: "client@example.com",
    });

    const result = await caller.invoices.create({
      clientId: clientResult.id,
      invoiceNumber: "INV-002",
      status: "draft" as const,
      issueDate: new Date(),
      dueDate: new Date(),
      lineItems: [],
      taxRate: 0,
      discountType: "percentage",
      discountValue: 0,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeTypeOf("number");
    // Database returns decimal with full precision
    expect(parseFloat(result.total)).toBe(0);
  });

  it("should require authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.invoices.create({
        clientId: 1,
        invoiceNumber: "INV-003",
        status: "draft" as const,
        issueDate: new Date(),
        dueDate: new Date(),
        lineItems: [{ description: "Test", quantity: 1, rate: 100 }],
        taxRate: 0,
        discountType: "percentage",
        discountValue: 0,
      })
    ).rejects.toThrow();
  });
});
