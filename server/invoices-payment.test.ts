import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import * as db from "./db";

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

const createMockContext = (
  user: typeof mockUser | null = mockUser
): Context => ({
  user,
  req: {} as any,
  res: {} as any,
});

describe("Invoice List with Payment Indicators", () => {
  let testClientId: number;
  let testInvoiceIds: number[] = [];
  let testPaymentIds: number[] = [];

  beforeAll(async () => {
    // Create test client
    const client = await db.createClient({
      userId: mockUser.id,
      name: "Invoice List Test Client",
      email: "invoicelist@test.com",
      phone: null,
      address: null,
      taxId: null,
      notes: null,
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    // Cleanup
    for (const paymentId of testPaymentIds) {
      await db.deletePayment(paymentId);
    }
    for (const invoiceId of testInvoiceIds) {
      await db.deleteInvoice(invoiceId, mockUser.id);
    }
    if (testClientId) {
      await db.deleteClient(testClientId, mockUser.id);
    }
  });

  describe("Invoice List Query", () => {
    it("should include payment status for each invoice", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "LIST-TEST-001",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

      // Get invoice list
      const invoices = await caller.invoices.list();

      // Find our test invoice
      const testInvoice = invoices.find(inv => inv.id === invoice.id);

      expect(testInvoice).toBeDefined();
      expect(testInvoice?.paymentStatus).toBe("unpaid");
      expect(testInvoice?.totalPaid).toBe("0");
      expect(testInvoice?.amountDue).toBe("500");
      expect(testInvoice?.paymentProgress).toBe(0);
    });

    it("should show correct payment status after partial payment", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "LIST-TEST-002",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "sent",
        currency: "USD",
        subtotal: "1000.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "1000.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      // Record partial payment
      const payment = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "400.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment.id);

      // Get invoice list
      const invoices = await caller.invoices.list();
      const testInvoice = invoices.find(inv => inv.id === invoice.id);

      expect(testInvoice?.paymentStatus).toBe("partial");
      expect(testInvoice?.totalPaid).toBe("400");
      expect(testInvoice?.amountDue).toBe("600");
      expect(testInvoice?.paymentProgress).toBe(40);
    });

    it("should show correct payment status after full payment", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "LIST-TEST-003",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "sent",
        currency: "USD",
        subtotal: "750.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "750.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      // Record full payment
      const payment = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "750.00",
        currency: "USD",
        paymentMethod: "bank_transfer",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment.id);

      // Get invoice list
      const invoices = await caller.invoices.list();
      const testInvoice = invoices.find(inv => inv.id === invoice.id);

      expect(testInvoice?.paymentStatus).toBe("paid");
      expect(testInvoice?.totalPaid).toBe("750");
      expect(testInvoice?.amountDue).toBe("0");
      expect(testInvoice?.paymentProgress).toBe(100);
    });

    it("should handle multiple payments correctly", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "LIST-TEST-004",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "sent",
        currency: "USD",
        subtotal: "1200.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "1200.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      // Record multiple payments
      const payment1 = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "500.00",
        currency: "USD",
        paymentMethod: "check",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment1.id);

      const payment2 = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "700.00",
        currency: "USD",
        paymentMethod: "cash",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment2.id);

      // Get invoice list
      const invoices = await caller.invoices.list();
      const testInvoice = invoices.find(inv => inv.id === invoice.id);

      expect(testInvoice?.paymentStatus).toBe("paid");
      expect(testInvoice?.totalPaid).toBe("1200");
      expect(testInvoice?.amountDue).toBe("0");
      expect(testInvoice?.paymentProgress).toBe(100);
    });

    it("should calculate payment progress percentage correctly", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "LIST-TEST-005",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "sent",
        currency: "USD",
        subtotal: "800.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "800.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice.id);

      // Record 25% payment
      const payment = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "200.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment.id);

      // Get invoice list
      const invoices = await caller.invoices.list();
      const testInvoice = invoices.find(inv => inv.id === invoice.id);

      expect(testInvoice?.paymentProgress).toBe(25);
      expect(testInvoice?.paymentStatus).toBe("partial");
    });
  });
});
