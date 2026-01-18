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

describe("Payment Status Filters", () => {
  let testClientId: number;
  let testInvoiceIds: number[] = [];
  let unpaidInvoiceId: number;
  let partialInvoiceId: number;
  let paidInvoiceId: number;

  beforeAll(async () => {
    const caller = appRouter.createCaller(createMockContext());

    // Create test client
    const client = await db.createClient({
      userId: mockUser.id,
      name: "Filter Test Client",
      email: "filter@test.com",
      phone: null,
      address: null,
      taxId: null,
      notes: null,
    });
    testClientId = client.id;

    // Create unpaid invoice
    const unpaidInvoice = await db.createInvoice({
      userId: mockUser.id,
      clientId: testClientId,
      invoiceNumber: "FILTER-UNPAID-001",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
    unpaidInvoiceId = unpaidInvoice.id;
    testInvoiceIds.push(unpaidInvoice.id);

    // Create partially paid invoice
    const partialInvoice = await db.createInvoice({
      userId: mockUser.id,
      clientId: testClientId,
      invoiceNumber: "FILTER-PARTIAL-001",
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
    partialInvoiceId = partialInvoice.id;
    testInvoiceIds.push(partialInvoice.id);

    await caller.payments.create({
      invoiceId: partialInvoice.id,
      amount: "200.00",
      currency: "USD",
      paymentMethod: "manual",
      paymentDate: new Date(),
    });

    // Create fully paid invoice
    const paidInvoice = await db.createInvoice({
      userId: mockUser.id,
      clientId: testClientId,
      invoiceNumber: "FILTER-PAID-001",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
    paidInvoiceId = paidInvoice.id;
    testInvoiceIds.push(paidInvoice.id);

    await caller.payments.create({
      invoiceId: paidInvoice.id,
      amount: "300.00",
      currency: "USD",
      paymentMethod: "bank_transfer",
      paymentDate: new Date(),
    });
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

  describe("Invoice List Payment Status", () => {
    it("should return all invoices with payment status", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const invoices = await caller.invoices.list();

      const testInvoices = invoices.filter(inv =>
        testInvoiceIds.includes(inv.id)
      );

      expect(testInvoices.length).toBe(3);

      // Each invoice should have payment status
      testInvoices.forEach(invoice => {
        expect(invoice.paymentStatus).toBeDefined();
        expect(["unpaid", "partial", "paid"]).toContain(invoice.paymentStatus);
      });
    });

    it("should correctly identify unpaid invoices", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const invoices = await caller.invoices.list();

      const unpaidInvoice = invoices.find(inv => inv.id === unpaidInvoiceId);

      expect(unpaidInvoice).toBeDefined();
      expect(unpaidInvoice?.paymentStatus).toBe("unpaid");
      expect(unpaidInvoice?.totalPaid).toBe("0");
      expect(unpaidInvoice?.paymentProgress).toBe(0);
    });

    it("should correctly identify partially paid invoices", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const invoices = await caller.invoices.list();

      const partialInvoice = invoices.find(inv => inv.id === partialInvoiceId);

      expect(partialInvoice).toBeDefined();
      expect(partialInvoice?.paymentStatus).toBe("partial");
      expect(partialInvoice?.totalPaid).toBe("200");
      expect(partialInvoice?.amountDue).toBe("300");
      expect(partialInvoice?.paymentProgress).toBe(40);
    });

    it("should correctly identify fully paid invoices", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const invoices = await caller.invoices.list();

      const paidInvoice = invoices.find(inv => inv.id === paidInvoiceId);

      expect(paidInvoice).toBeDefined();
      expect(paidInvoice?.paymentStatus).toBe("paid");
      expect(paidInvoice?.totalPaid).toBe("300");
      expect(paidInvoice?.amountDue).toBe("0");
      expect(paidInvoice?.paymentProgress).toBe(100);
    });

    it("should handle filtering by payment status in application logic", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const allInvoices = await caller.invoices.list();

      // Filter unpaid
      const unpaidInvoices = allInvoices.filter(
        inv => testInvoiceIds.includes(inv.id) && inv.paymentStatus === "unpaid"
      );
      expect(unpaidInvoices.length).toBe(1);
      expect(unpaidInvoices[0].id).toBe(unpaidInvoiceId);

      // Filter partial
      const partialInvoices = allInvoices.filter(
        inv =>
          testInvoiceIds.includes(inv.id) && inv.paymentStatus === "partial"
      );
      expect(partialInvoices.length).toBe(1);
      expect(partialInvoices[0].id).toBe(partialInvoiceId);

      // Filter paid
      const paidInvoices = allInvoices.filter(
        inv => testInvoiceIds.includes(inv.id) && inv.paymentStatus === "paid"
      );
      expect(paidInvoices.length).toBe(1);
      expect(paidInvoices[0].id).toBe(paidInvoiceId);
    });
  });
});
