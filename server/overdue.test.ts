import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import * as db from "./db";
import { detectAndMarkOverdueInvoices } from "./jobs/detectOverdueInvoices";

// Mock user context
const mockUser = {
  id: 1,
  openId: "test-open-id",
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
  companyName: null,
  companyAddress: null,
  companyPhone: null,
  companyLogoUrl: null,
  subscriptionStatus: null,
  stripeCustomerId: null,
  currentPeriodEnd: null,
  taxId: null,
  taxRate: null,
  defaultCurrency: "USD",
  defaultPaymentTerms: null,
  invoicePrefix: "INV",
  nextInvoiceNumber: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdmin = {
  ...mockUser,
  role: "admin" as const,
};

const createMockContext = (user: typeof mockUser | typeof mockAdmin | null = mockUser): Context => ({
  user,
  req: {} as any,
  res: {} as any,
});

describe("Overdue Invoice Detection", () => {
  let testClientId: number;
  let testInvoiceIds: number[] = [];

  beforeAll(async () => {
    // Create test client
    const client = await db.createClient({
      userId: mockUser.id,
      name: "Overdue Test Client",
      email: "overdue@test.com",
      phone: null,
      address: null,
      taxId: null,
      notes: null,
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    // Cleanup
    for (const invoiceId of testInvoiceIds) {
      await db.deleteInvoice(invoiceId, mockUser.id);
    }
    if (testClientId) {
      await db.deleteClient(testClientId, mockUser.id);
    }
  });

  describe("detectAndMarkOverdueInvoices", () => {
    it("should not mark invoices that are not yet due", async () => {
      // Create invoice due in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "OVERDUE-TEST-001",
        issueDate: new Date(),
        dueDate: futureDate,
        status: "sent",
        currency: "USD",
        subtotal: "100.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "100.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      const result = await detectAndMarkOverdueInvoices();

      expect(result.success).toBe(true);

      // Invoice should still be 'sent'
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("sent");
    });

    it("should mark sent invoices past due date as overdue", async () => {
      // Create invoice due yesterday
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "OVERDUE-TEST-002",
        issueDate: new Date(),
        dueDate: pastDate,
        status: "sent",
        currency: "USD",
        subtotal: "200.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "200.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      const result = await detectAndMarkOverdueInvoices();

      expect(result.success).toBe(true);
      expect(result.markedCount).toBeGreaterThanOrEqual(1);

      // Invoice should now be 'overdue'
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("overdue");
    });

    it("should not mark paid invoices as overdue", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create invoice due yesterday
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "OVERDUE-TEST-003",
        issueDate: new Date(),
        dueDate: pastDate,
        status: "sent",
        currency: "USD",
        subtotal: "300.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "300.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      // Pay the invoice
      await caller.payments.create({
        invoiceId: invoice.id,
        amount: "300.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });

      const result = await detectAndMarkOverdueInvoices();

      expect(result.success).toBe(true);

      // Invoice should be 'paid', not 'overdue'
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("paid");
    });

    it("should mark partially paid overdue invoices as overdue", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create invoice due yesterday
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "OVERDUE-TEST-004",
        issueDate: new Date(),
        dueDate: pastDate,
        status: "sent",
        currency: "USD",
        subtotal: "500.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "500.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      // Partial payment
      await caller.payments.create({
        invoiceId: invoice.id,
        amount: "200.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });

      const result = await detectAndMarkOverdueInvoices();

      expect(result.success).toBe(true);
      expect(result.markedCount).toBeGreaterThanOrEqual(1);

      // Invoice should be 'overdue' even with partial payment
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("overdue");
    });

    it("should mark draft invoices past due date as overdue", async () => {
      // Create draft invoice due yesterday
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "OVERDUE-TEST-005",
        issueDate: new Date(),
        dueDate: pastDate,
        status: "draft",
        currency: "USD",
        subtotal: "150.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "150.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      const result = await detectAndMarkOverdueInvoices();

      expect(result.success).toBe(true);

      // Draft invoice should be marked overdue
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("overdue");
    });

    it("should handle date boundary conditions (due today)", async () => {
      // Create invoice due today (should be marked overdue since due date <= today)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "OVERDUE-TEST-006",
        issueDate: new Date(),
        dueDate: today,
        status: "sent",
        currency: "USD",
        subtotal: "100.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "100.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      const result = await detectAndMarkOverdueInvoices();

      expect(result.success).toBe(true);

      // Invoice due today should be marked overdue
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("overdue");
    });
  });

  describe("Manual Trigger Endpoint", () => {
    it("should allow admin to manually trigger overdue detection", async () => {
      const caller = appRouter.createCaller(createMockContext(mockAdmin));

      const result = await caller.system.detectOverdueInvoices();

      expect(result.success).toBe(true);
      expect(result.markedCount).toBeGreaterThanOrEqual(0);
    });

    it("should deny non-admin users from triggering", async () => {
      const caller = appRouter.createCaller(createMockContext(mockUser));

      await expect(caller.system.detectOverdueInvoices()).rejects.toThrow("You do not have required permission");
    });
  });
});
