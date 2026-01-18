import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, invoices, clients, payments } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as nowpayments from "./lib/nowpayments";

describe("NOWPayments Integration", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testUserId: number;
  let testClientId: number;
  let testInvoiceId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-nowpay-${Date.now()}`,
        name: "NOWPayments Test User",
        email: "nowpaytest@example.com",
      })
      .$returningId();
    testUserId = user.id;

    // Create test client
    const [client] = await db
      .insert(clients)
      .values({
        userId: testUserId,
        name: "Crypto Client",
        email: "crypto@example.com",
      })
      .$returningId();
    testClientId = client.id;

    // Create test invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        userId: testUserId,
        clientId: testClientId,
        invoiceNumber: "CRYPTO-TEST-001",
        status: "sent",
        subtotal: "500.00",
        taxRate: "0",
        taxAmount: "0",
        discountType: "fixed",
        discountValue: "0",
        discountAmount: "0",
        total: "500.00",
        amountPaid: "0",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .$returningId();
    testInvoiceId = invoice.id;
  });

  afterAll(async () => {
    if (db && testUserId) {
      await db.delete(payments).where(eq(payments.userId, testUserId));
      await db.delete(invoices).where(eq(invoices.userId, testUserId));
      await db.delete(clients).where(eq(clients.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("NOWPayments API Client", () => {
    it("should get API status", async () => {
      const status = await nowpayments.getApiStatus();
      expect(status.message).toBe("OK");
    });

    it("should get available currencies", async () => {
      const currencies = await nowpayments.getAvailableCurrencies();
      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
      expect(currencies.map(c => c.toLowerCase())).toContain("btc");
      expect(currencies.map(c => c.toLowerCase())).toContain("eth");
    });

    it("should get popular currencies", () => {
      const popular = nowpayments.getPopularCurrencies();
      expect(popular).toContain("btc");
      expect(popular).toContain("eth");
      expect(popular).toContain("usdt");
      expect(popular).toContain("usdc");
    });

    it("should format currency names correctly", () => {
      expect(nowpayments.formatCurrencyName("btc")).toBe("Bitcoin (BTC)");
      expect(nowpayments.formatCurrencyName("eth")).toBe("Ethereum (ETH)");
      expect(nowpayments.formatCurrencyName("usdt")).toBe("Tether (USDT)");
      expect(nowpayments.formatCurrencyName("unknown")).toBe("UNKNOWN");
    });

    it("should get estimated price for BTC", async () => {
      const estimate = await nowpayments.getEstimatedPrice(100, "usd", "btc");
      expect(estimate).toBeDefined();
      expect(parseFloat(estimate)).toBeGreaterThan(0);
    });

    it("should get minimum payment amount", async () => {
      const minAmount = await nowpayments.getMinimumPaymentAmount("usd", "btc");
      expect(typeof minAmount).toBe("number");
      expect(minAmount).toBeGreaterThan(0);
    });
  });

  describe("Payment Status Helpers", () => {
    it("should correctly identify complete payment status", () => {
      expect(nowpayments.isPaymentComplete("finished")).toBe(true);
      expect(nowpayments.isPaymentComplete("confirmed")).toBe(true);
      expect(nowpayments.isPaymentComplete("waiting")).toBe(false);
      expect(nowpayments.isPaymentComplete("failed")).toBe(false);
    });

    it("should correctly identify pending payment status", () => {
      expect(nowpayments.isPaymentPending("waiting")).toBe(true);
      expect(nowpayments.isPaymentPending("confirming")).toBe(true);
      expect(nowpayments.isPaymentPending("sending")).toBe(true);
      expect(nowpayments.isPaymentPending("finished")).toBe(false);
    });

    it("should correctly identify failed payment status", () => {
      expect(nowpayments.isPaymentFailed("failed")).toBe(true);
      expect(nowpayments.isPaymentFailed("expired")).toBe(true);
      expect(nowpayments.isPaymentFailed("refunded")).toBe(true);
      expect(nowpayments.isPaymentFailed("finished")).toBe(false);
    });
  });

  describe("Database Crypto Fields", () => {
    it("should store crypto payment ID on invoice", async () => {
      await db!
        .update(invoices)
        .set({
          cryptoPaymentId: "test-payment-123",
          cryptoCurrency: "BTC",
          cryptoPaymentUrl: "https://nowpayments.io/payment/test",
        })
        .where(eq(invoices.id, testInvoiceId));

      const [invoice] = await db!
        .select()
        .from(invoices)
        .where(eq(invoices.id, testInvoiceId));

      expect(invoice.cryptoPaymentId).toBe("test-payment-123");
      expect(invoice.cryptoCurrency).toBe("BTC");
      expect(invoice.cryptoPaymentUrl).toBe(
        "https://nowpayments.io/payment/test"
      );
    });

    it("should store crypto payment in payments table", async () => {
      const [payment] = await db!
        .insert(payments)
        .values({
          invoiceId: testInvoiceId,
          userId: testUserId,
          amount: "500.00000000",
          currency: "USD",
          paymentMethod: "crypto",
          paymentDate: new Date(),
          status: "completed",
          cryptoAmount: "0.005123456789012345",
          cryptoCurrency: "BTC",
          cryptoNetwork: "mainnet",
          cryptoTxHash: "0xabc123def456",
          cryptoWalletAddress: "bc1qtest123",
          notes: "NOWPayments ID: test-payment-123",
        })
        .$returningId();

      const [result] = await db!
        .select()
        .from(payments)
        .where(eq(payments.id, payment.id));

      expect(result.paymentMethod).toBe("crypto");
      expect(result.cryptoCurrency).toBe("BTC");
      expect(result.cryptoTxHash).toBe("0xabc123def456");
      expect(result.notes).toContain("NOWPayments");
    });
  });

  describe("Invoice Crypto Payment Flow", () => {
    it("should update invoice when crypto payment is created", async () => {
      // Simulate creating a crypto payment
      const cryptoPaymentId = `pay-${Date.now()}`;
      const cryptoPaymentUrl = `https://nowpayments.io/payment/${cryptoPaymentId}`;

      await db!
        .update(invoices)
        .set({
          cryptoPaymentId,
          cryptoCurrency: "ETH",
          cryptoPaymentUrl,
        })
        .where(eq(invoices.id, testInvoiceId));

      const [invoice] = await db!
        .select()
        .from(invoices)
        .where(eq(invoices.id, testInvoiceId));

      expect(invoice.cryptoPaymentId).toBe(cryptoPaymentId);
      expect(invoice.cryptoCurrency).toBe("ETH");
      expect(invoice.cryptoPaymentUrl).toBe(cryptoPaymentUrl);
    });

    it("should mark invoice as paid when crypto payment completes", async () => {
      // Simulate payment completion
      await db!
        .update(invoices)
        .set({
          status: "paid",
          amountPaid: "500.00000000",
          cryptoAmount: "0.15000000000000000000",
          paidAt: new Date(),
        })
        .where(eq(invoices.id, testInvoiceId));

      const [invoice] = await db!
        .select()
        .from(invoices)
        .where(eq(invoices.id, testInvoiceId));

      expect(invoice.status).toBe("paid");
      expect(parseFloat(invoice.amountPaid)).toBe(500);
      expect(invoice.paidAt).toBeDefined();
    });
  });
});
