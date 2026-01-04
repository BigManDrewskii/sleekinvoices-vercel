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

const createMockContext = (user: typeof mockUser | null = mockUser): Context => ({
  user,
  req: {} as any,
  res: {} as any,
});

describe("Dashboard Statistics with Payment Integration", () => {
  let testClientId: number;
  let testInvoiceIds: number[] = [];
  let testPaymentIds: number[] = [];

  beforeAll(async () => {
    // Create test client
    const client = await db.createClient({
      userId: mockUser.id,
      name: "Dashboard Test Client",
      email: "dashboard@test.com",
      phone: null,
      address: null,
      taxId: null,
      notes: null,
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    // Cleanup: delete test payments, invoices, and client
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

  describe("getInvoiceStats with No Payments", () => {
    it("should correctly track unpaid invoices", async () => {
      // Create invoice without payment
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "DASH-TEST-001",
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

      const stats = await db.getInvoiceStats(mockUser.id);

      // Stats should include at least our unpaid invoice
      expect(stats.unpaidInvoices).toBeGreaterThanOrEqual(1);
      expect(stats.outstandingBalance).toBeGreaterThanOrEqual(1000);
      expect(stats.totalInvoices).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getInvoiceStats with Full Payment", () => {
    it("should show correct revenue after full payment", async () => {
      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "DASH-TEST-002",
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

      // Record full payment
      const caller = appRouter.createCaller(createMockContext());
      const payment = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "500.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment.id);

      // Get stats
      const stats = await db.getInvoiceStats(mockUser.id);

      expect(stats.totalRevenue).toBeGreaterThanOrEqual(500);
      expect(stats.paidInvoices).toBeGreaterThanOrEqual(1);
      
      // Check invoice status was updated
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("paid");
      expect(Number(updatedInvoice?.amountPaid)).toBe(500);
    });
  });

  describe("getInvoiceStats with Partial Payment", () => {
    it("should show correct revenue and partial status", async () => {
      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "DASH-TEST-003",
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

      // Record partial payment (50%)
      const caller = appRouter.createCaller(createMockContext());
      const payment = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "500.00",
        currency: "USD",
        paymentMethod: "bank_transfer",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment.id);

      // Get stats
      const stats = await db.getInvoiceStats(mockUser.id);

      expect(stats.partiallyPaidInvoices).toBeGreaterThanOrEqual(1);
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(500);
      
      // Check invoice status (should still be 'sent', not 'paid')
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("sent");
      expect(Number(updatedInvoice?.amountPaid)).toBe(500);
      
      // Outstanding balance should reflect partial payment
      const paymentStatus = await db.getInvoicePaymentStatus(invoice.id);
      expect(paymentStatus.status).toBe("partial");
      expect(paymentStatus.totalPaid).toBe(500);
      expect(paymentStatus.amountDue).toBe(500);
    });
  });

  describe("getInvoiceStats with Multiple Payments", () => {
    it("should correctly sum multiple payments to same invoice", async () => {
      // Create invoice
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "DASH-TEST-004",
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

      const caller = appRouter.createCaller(createMockContext());

      // First payment: $300
      const payment1 = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "300.00",
        currency: "USD",
        paymentMethod: "check",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment1.id);

      // Second payment: $400
      const payment2 = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "400.00",
        currency: "USD",
        paymentMethod: "cash",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment2.id);

      // Third payment: $300 (completes payment)
      const payment3 = await caller.payments.create({
        invoiceId: invoice.id,
        amount: "300.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment3.id);

      // Check payment status
      const paymentStatus = await db.getInvoicePaymentStatus(invoice.id);
      expect(paymentStatus.totalPaid).toBe(1000);
      expect(paymentStatus.status).toBe("paid");
      expect(paymentStatus.amountDue).toBe(0);

      // Check invoice was marked as paid
      const updatedInvoice = await db.getInvoiceById(invoice.id, mockUser.id);
      expect(updatedInvoice?.status).toBe("paid");
      expect(Number(updatedInvoice?.amountPaid)).toBe(1000);
    });
  });

  describe("getInvoiceStats with Mixed Statuses", () => {
    it("should correctly calculate stats with mix of paid/partial/unpaid", async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      // Create 3 invoices with different payment statuses
      
      // Invoice 1: Fully paid
      const invoice1 = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "DASH-TEST-005",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      testInvoiceIds.push(invoice1.id);
      
      const payment1 = await caller.payments.create({
        invoiceId: invoice1.id,
        amount: "200.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment1.id);

      // Invoice 2: Partially paid
      const invoice2 = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "DASH-TEST-006",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "sent",
        currency: "USD",
        subtotal: "400.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "400.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice2.id);
      
      const payment2 = await caller.payments.create({
        invoiceId: invoice2.id,
        amount: "150.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });
      testPaymentIds.push(payment2.id);

      // Invoice 3: Unpaid
      const invoice3 = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "DASH-TEST-007",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "sent",
        currency: "USD",
        subtotal: "600.00",
        taxRate: "0",
        taxAmount: "0.00",
        discountType: "percentage",
        discountValue: "0",
        discountAmount: "0.00",
        total: "600.00",
        amountPaid: "0.00",
        notes: null,
        paymentTerms: null,
        stripePaymentLinkUrl: null,
        stripePaymentLinkId: null,
      });
      testInvoiceIds.push(invoice3.id);

      // Get stats
      const stats = await db.getInvoiceStats(mockUser.id);

      // Total revenue should be sum of all payments
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(350); // 200 + 150
      
      // Should have at least 1 paid, 1 partial, 1 unpaid
      expect(stats.paidInvoices).toBeGreaterThanOrEqual(1);
      expect(stats.partiallyPaidInvoices).toBeGreaterThanOrEqual(1);
      expect(stats.unpaidInvoices).toBeGreaterThanOrEqual(1);
      
      // Outstanding balance should be partial + unpaid
      expect(stats.outstandingBalance).toBeGreaterThanOrEqual(850); // (400-150) + 600
    });
  });

  describe("getInvoicePaymentStatus", () => {
    it("should return correct status for unpaid invoice", async () => {
      const invoice = await db.createInvoice({
        userId: mockUser.id,
        clientId: testClientId,
        invoiceNumber: "STATUS-TEST-001",
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
      testInvoiceIds.push(invoice.id);

      const status = await db.getInvoicePaymentStatus(invoice.id);

      expect(status.status).toBe("unpaid");
      expect(status.totalPaid).toBe(0);
      expect(status.amountDue).toBe(100);
      expect(status.invoiceTotal).toBe(100);
    });
  });
});
