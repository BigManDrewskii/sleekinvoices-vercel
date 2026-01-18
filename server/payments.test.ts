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

describe("Payment Reconciliation", () => {
  let testInvoiceId: number;
  let testClientId: number;
  let testPaymentId: number;

  beforeAll(async () => {
    // Create test client
    const client = await db.createClient({
      userId: mockUser.id,
      name: "Test Payment Client",
      email: "payment@test.com",
      phone: null,
      address: null,
      taxId: null,
      notes: null,
    });
    testClientId = client.id;

    // Create test invoice
    const invoice = await db.createInvoice({
      userId: mockUser.id,
      clientId: testClientId,
      invoiceNumber: "PAY-TEST-001",
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
    testInvoiceId = invoice.id;
  });

  afterAll(async () => {
    // Cleanup: delete test payment, invoice, and client
    if (testPaymentId) {
      await db.deletePayment(testPaymentId);
    }
    if (testInvoiceId) {
      await db.deleteInvoice(testInvoiceId, mockUser.id);
    }
    if (testClientId) {
      await db.deleteClient(testClientId, mockUser.id);
    }
  });

  describe("Payment Creation", () => {
    it("should create a manual payment record", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const payment = await caller.payments.create({
        invoiceId: testInvoiceId,
        amount: "500.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
        notes: "Test manual payment",
      });

      expect(payment).toBeDefined();
      expect(payment.invoiceId).toBe(testInvoiceId);
      expect(payment.amount).toBe("500.00000000");
      expect(payment.paymentMethod).toBe("manual");
      expect(payment.status).toBe("completed");

      testPaymentId = payment.id;
    });

    it("should create a bank transfer payment", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const payment = await caller.payments.create({
        invoiceId: testInvoiceId,
        amount: "250.00",
        currency: "USD",
        paymentMethod: "bank_transfer",
        paymentDate: new Date(),
        notes: "Bank transfer payment",
      });

      expect(payment).toBeDefined();
      expect(payment.paymentMethod).toBe("bank_transfer");
      expect(payment.amount).toBe("250.00000000");

      // Cleanup this test payment
      await db.deletePayment(payment.id);
    });

    it("should create a check payment", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const payment = await caller.payments.create({
        invoiceId: testInvoiceId,
        amount: "100.00",
        currency: "USD",
        paymentMethod: "check",
        paymentDate: new Date(),
        notes: "Check #12345",
      });

      expect(payment).toBeDefined();
      expect(payment.paymentMethod).toBe("check");

      // Cleanup
      await db.deletePayment(payment.id);
    });
  });

  describe("Payment Queries", () => {
    it("should list all payments for a user", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const payments = await caller.payments.list({});

      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0]).toHaveProperty("id");
      expect(payments[0]).toHaveProperty("amount");
      expect(payments[0]).toHaveProperty("paymentMethod");
    });

    it("should get payments for a specific invoice", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const payments = await caller.payments.getByInvoice({
        invoiceId: testInvoiceId,
      });

      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0].invoiceId).toBe(testInvoiceId);
    });

    it("should filter payments by status", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const payments = await caller.payments.list({
        status: "completed",
      });

      expect(Array.isArray(payments)).toBe(true);
      payments.forEach(payment => {
        expect(payment.status).toBe("completed");
      });
    });

    it("should filter payments by payment method", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const payments = await caller.payments.list({
        paymentMethod: "manual",
      });

      expect(Array.isArray(payments)).toBe(true);
      payments.forEach(payment => {
        expect(payment.paymentMethod).toBe("manual");
      });
    });

    it("should get payment statistics", async () => {
      const caller = appRouter.createCaller(createMockContext());

      const stats = await caller.payments.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalAmount");
      expect(stats).toHaveProperty("totalCount");
      expect(stats).toHaveProperty("byMethod");
      expect(Array.isArray(stats.byMethod)).toBe(true);
      expect(typeof stats.totalAmount).toBe("number");
      expect(typeof stats.totalCount).toBe("number");
    });
  });

  describe("Payment Calculations", () => {
    it("should calculate total paid for an invoice", async () => {
      const totalPaid = await db.getTotalPaidForInvoice(testInvoiceId);

      expect(typeof totalPaid).toBe("number");
      expect(totalPaid).toBeGreaterThanOrEqual(0);
    });

    it("should track multiple payments for same invoice", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create two partial payments
      const payment1 = await caller.payments.create({
        invoiceId: testInvoiceId,
        amount: "200.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });

      const payment2 = await caller.payments.create({
        invoiceId: testInvoiceId,
        amount: "150.00",
        currency: "USD",
        paymentMethod: "cash",
        paymentDate: new Date(),
      });

      const totalPaid = await db.getTotalPaidForInvoice(testInvoiceId);
      expect(totalPaid).toBeGreaterThanOrEqual(350); // At least our two payments

      // Cleanup
      await db.deletePayment(payment1.id);
      await db.deletePayment(payment2.id);
    });
  });

  describe("Payment Deletion", () => {
    it("should delete a payment record", async () => {
      const caller = appRouter.createCaller(createMockContext());

      // Create a payment to delete
      const payment = await caller.payments.create({
        invoiceId: testInvoiceId,
        amount: "50.00",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date(),
      });

      // Delete it
      const result = await caller.payments.delete({
        paymentId: payment.id,
      });

      expect(result.success).toBe(true);

      // Verify it's gone
      const paymentRecord = await db.getPaymentById(payment.id);
      expect(paymentRecord).toBeNull();
    });
  });

  describe("Stripe Webhook Integration", () => {
    it("should log webhook events", async () => {
      const eventId = "evt_test_" + Date.now();
      const eventType = "payment_intent.succeeded";
      const payload = {
        id: eventId,
        type: eventType,
        data: { object: { id: "pi_test", amount: 10000 } },
      };

      await db.logStripeWebhookEvent(eventId, eventType, payload);

      const isProcessed = await db.isWebhookEventProcessed(eventId);
      expect(isProcessed).toBe(false);

      await db.markWebhookEventProcessed(eventId);

      const isNowProcessed = await db.isWebhookEventProcessed(eventId);
      expect(isNowProcessed).toBe(true);
    });

    it("should prevent duplicate webhook processing", async () => {
      const eventId = "evt_duplicate_test_" + Date.now();

      await db.logStripeWebhookEvent(eventId, "payment_intent.succeeded", {});
      await db.markWebhookEventProcessed(eventId);

      const isProcessed = await db.isWebhookEventProcessed(eventId);
      expect(isProcessed).toBe(true);
    });
  });

  describe("Payment Authorization", () => {
    it("should not allow unauthenticated payment creation", async () => {
      const caller = appRouter.createCaller(createMockContext(null));

      await expect(
        caller.payments.create({
          invoiceId: testInvoiceId,
          amount: "100.00",
          currency: "USD",
          paymentMethod: "manual",
          paymentDate: new Date(),
        })
      ).rejects.toThrow();
    });

    it("should not allow unauthenticated payment listing", async () => {
      const caller = appRouter.createCaller(createMockContext(null));

      await expect(caller.payments.list({})).rejects.toThrow();
    });
  });
});
