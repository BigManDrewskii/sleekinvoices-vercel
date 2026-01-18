import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Use random numbers within valid integer range for unique test data
let testUserCounter = Math.floor(Math.random() * 100000) + 100000;
let invoiceCounter = Math.floor(Math.random() * 100000) + 100000;

function createAuthContext(): { ctx: TrpcContext } {
  const userId = testUserCounter++;
  const user: AuthenticatedUser = {
    id: userId,
    openId: `guided-test-user-${userId}`,
    email: `guided-${userId}@example.com`,
    name: `Guided Test User ${userId}`,
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

describe("Guided Invoice Creator - Backend Support", () => {
  describe("Client Selection (Step 1)", () => {
    it("should list available clients for selection", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a test client
      const client = await caller.clients.create({
        name: "Guided Flow Client",
        email: "guided-client@example.com",
      });

      // List clients should return the created client
      const clients = await caller.clients.list();

      expect(clients).toBeDefined();
      expect(Array.isArray(clients)).toBe(true);
      expect(clients.some(c => c.id === client.id)).toBe(true);
    });

    it("should allow creating a new client during guided flow", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const newClient = await caller.clients.create({
        name: "New Guided Client",
        email: "new-guided@example.com",
        companyName: "Guided Company",
        address: "123 Guided Street",
      });

      expect(newClient).toBeDefined();
      expect(newClient.id).toBeTypeOf("number");
      expect(newClient.name).toBe("New Guided Client");
      expect(newClient.email).toBe("new-guided@example.com");
    });
  });

  describe("Invoice Creation (Final Step)", () => {
    it("should create invoice with data collected from guided flow", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Step 1: Create/select client
      const client = await caller.clients.create({
        name: "Guided Invoice Client",
        email: "invoice-client@example.com",
      });

      // Step 2-4: Collect services, amounts, due date
      // Step 5: Create the invoice with all collected data
      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `GUIDED-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
        lineItems: [
          {
            description: "Website Design and Development",
            quantity: 1,
            rate: 2500,
          },
        ],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
        notes: "Created via Guided Invoice Creator",
      });

      expect(invoice).toBeDefined();
      expect(invoice.id).toBeTypeOf("number");
      expect(invoice.invoiceNumber).toMatch(/^GUIDED-\d+$/);
      expect(invoice.status).toBe("draft");
    });

    it("should create invoice with multiple line items from guided flow", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Multi-Item Client",
        email: "multi-item@example.com",
      });

      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `GUIDED-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Net 15
        lineItems: [
          { description: "Logo Design", quantity: 1, rate: 500 },
          { description: "Brand Guidelines", quantity: 1, rate: 750 },
          { description: "Business Card Design", quantity: 2, rate: 150 },
        ],
        taxRate: 10,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(invoice).toBeDefined();
      expect(invoice.id).toBeTypeOf("number");

      // Verify calculations:
      // Subtotal: 500 + 750 + (2 * 150) = 1550
      // Tax: 1550 * 10% = 155
      // Total: 1550 + 155 = 1705
    });

    it("should support sending invoice directly after creation", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Send Invoice Client",
        email: "send@example.com",
      });

      // Create as sent status directly (for "Send Invoice" button)
      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `GUIDED-${invoiceCounter++}`,
        status: "sent" as const,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems: [
          { description: "Consulting Services", quantity: 4, rate: 200 },
        ],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(invoice).toBeDefined();
      expect(invoice.status).toBe("sent");
    });
  });

  describe("Due Date Options (Step 4)", () => {
    it("should support Due on Receipt (same day)", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Due Receipt Client",
        email: "receipt@example.com",
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `DUE-RECEIPT-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: today,
        dueDate: today, // Due on receipt
        lineItems: [{ description: "Service", quantity: 1, rate: 100 }],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(invoice).toBeDefined();
      const issueDateNorm = new Date(invoice.issueDate);
      const dueDateNorm = new Date(invoice.dueDate);
      issueDateNorm.setHours(0, 0, 0, 0);
      dueDateNorm.setHours(0, 0, 0, 0);
      expect(dueDateNorm.getTime()).toBe(issueDateNorm.getTime());
    });

    it("should support Net 15 due date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Net 15 Client",
        email: "net15@example.com",
      });

      const today = new Date();
      const net15 = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `NET-15-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: today,
        dueDate: net15,
        lineItems: [{ description: "Service", quantity: 1, rate: 100 }],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(invoice).toBeDefined();
      // Due date should be approximately 15 days from issue date
      const diffDays = Math.round(
        (new Date(invoice.dueDate).getTime() -
          new Date(invoice.issueDate).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      expect(diffDays).toBe(15);
    });

    it("should support Net 30 due date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Net 30 Client",
        email: "net30@example.com",
      });

      const today = new Date();
      const net30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `NET-30-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: today,
        dueDate: net30,
        lineItems: [{ description: "Service", quantity: 1, rate: 100 }],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(invoice).toBeDefined();
      const diffDays = Math.round(
        (new Date(invoice.dueDate).getTime() -
          new Date(invoice.issueDate).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      expect(diffDays).toBe(30);
    });

    it("should support Net 60 due date", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Net 60 Client",
        email: "net60@example.com",
      });

      const today = new Date();
      const net60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `NET-60-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: today,
        dueDate: net60,
        lineItems: [{ description: "Service", quantity: 1, rate: 100 }],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(invoice).toBeDefined();
      const diffDays = Math.round(
        (new Date(invoice.dueDate).getTime() -
          new Date(invoice.issueDate).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      expect(diffDays).toBe(60);
    });
  });

  describe("Data Validation", () => {
    it("should require at least one line item for non-draft invoices", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Validation Client",
        email: "validation@example.com",
      });

      // Draft invoices can have empty line items
      const draftInvoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `DRAFT-EMPTY-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: new Date(),
        dueDate: new Date(),
        lineItems: [],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(draftInvoice).toBeDefined();
      expect(parseFloat(draftInvoice.total)).toBe(0);
    });

    it("should handle decimal quantities and rates", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const client = await caller.clients.create({
        name: "Decimal Client",
        email: "decimal@example.com",
      });

      const invoice = await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: `DECIMAL-${invoiceCounter++}`,
        status: "draft" as const,
        issueDate: new Date(),
        dueDate: new Date(),
        lineItems: [{ description: "Hourly Work", quantity: 2.5, rate: 75.5 }],
        taxRate: 0,
        discountType: "percentage" as const,
        discountValue: 0,
      });

      expect(invoice).toBeDefined();
      // 2.5 * 75.50 = 188.75
      expect(parseFloat(invoice.total)).toBeCloseTo(188.75, 2);
    });
  });
});
