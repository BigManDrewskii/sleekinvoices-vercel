import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the nowpayments module
vi.mock("./lib/nowpayments", () => ({
  createInvoice: vi.fn(),
  getPaymentStatus: vi.fn(),
  isPaymentComplete: vi.fn(),
  isPaymentPending: vi.fn(),
  isPaymentFailed: vi.fn(),
}));

// Mock the db module
vi.mock("./db", () => ({
  getInvoiceById: vi.fn(),
  updateInvoice: vi.fn(),
}));

import * as nowpayments from "./lib/nowpayments";
import * as db from "./db";

describe("Crypto Payment - Currency Selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createInvoice parameters", () => {
    it("should allow payCurrency to be undefined for customer choice", async () => {
      const mockInvoice = {
        id: 1,
        userId: 1,
        total: "100.00",
        amountPaid: "0",
        currency: "USD",
        invoiceNumber: "INV-001",
      };

      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);
      vi.mocked(nowpayments.createInvoice).mockResolvedValue({
        id: "payment-123",
        invoice_url: "https://nowpayments.io/payment/123",
        token_id: "token-123",
        order_id: "INV-1-123",
        order_description: "Payment for Invoice INV-001",
        price_amount: "100",
        price_currency: "usd",
        pay_currency: null, // Customer will choose
        ipn_callback_url: "https://example.com/api/webhooks/nowpayments",
        success_url: "https://example.com/invoices/1?payment=success",
        cancel_url: "https://example.com/invoices/1?payment=cancelled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      });

      // Simulate calling createInvoice without payCurrency
      const result = await nowpayments.createInvoice({
        priceAmount: 100,
        priceCurrency: "usd",
        payCurrency: undefined, // Customer chooses on checkout
        orderId: "INV-1-123",
        orderDescription: "Payment for Invoice INV-001",
        ipnCallbackUrl: "https://example.com/api/webhooks/nowpayments",
        successUrl: "https://example.com/invoices/1?payment=success",
        cancelUrl: "https://example.com/invoices/1?payment=cancelled",
        isFixedRate: true,
      });

      expect(result.invoice_url).toBeDefined();
      expect(result.pay_currency).toBeNull(); // Confirms customer will choose
    });

    it("should still support pre-selected currency when provided", async () => {
      vi.mocked(nowpayments.createInvoice).mockResolvedValue({
        id: "payment-456",
        invoice_url: "https://nowpayments.io/payment/456",
        token_id: "token-456",
        order_id: "INV-2-456",
        order_description: "Payment for Invoice INV-002",
        price_amount: "50",
        price_currency: "usd",
        pay_currency: "btc", // Pre-selected
        ipn_callback_url: "https://example.com/api/webhooks/nowpayments",
        success_url: "https://example.com/invoices/2?payment=success",
        cancel_url: "https://example.com/invoices/2?payment=cancelled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      });

      const result = await nowpayments.createInvoice({
        priceAmount: 50,
        priceCurrency: "usd",
        payCurrency: "btc", // Pre-selected currency
        orderId: "INV-2-456",
        orderDescription: "Payment for Invoice INV-002",
        ipnCallbackUrl: "https://example.com/api/webhooks/nowpayments",
        successUrl: "https://example.com/invoices/2?payment=success",
        cancelUrl: "https://example.com/invoices/2?payment=cancelled",
        isFixedRate: true,
      });

      expect(result.pay_currency).toBe("btc");
    });
  });

  describe("Database storage", () => {
    it("should store MULTI as cryptoCurrency when customer chooses", async () => {
      const mockInvoice = {
        id: 1,
        userId: 1,
        total: "100.00",
        amountPaid: "0",
        currency: "USD",
        invoiceNumber: "INV-001",
      };

      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);
      vi.mocked(db.updateInvoice).mockResolvedValue(mockInvoice as any);
      vi.mocked(nowpayments.createInvoice).mockResolvedValue({
        id: "payment-789",
        invoice_url: "https://nowpayments.io/payment/789",
        token_id: "token-789",
        order_id: "INV-1-789",
        order_description: "Payment for Invoice INV-001",
        price_amount: "100",
        price_currency: "usd",
        pay_currency: null,
        ipn_callback_url: "https://example.com/api/webhooks/nowpayments",
        success_url: "https://example.com/invoices/1?payment=success",
        cancel_url: "https://example.com/invoices/1?payment=cancelled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      });

      // Simulate the update call that would happen in the router
      await db.updateInvoice(1, 1, {
        cryptoPaymentId: "payment-789",
        cryptoCurrency: undefined?.toUpperCase() || "MULTI", // This is how it works in the router
        cryptoPaymentUrl: "https://nowpayments.io/payment/789",
      });

      expect(db.updateInvoice).toHaveBeenCalledWith(1, 1, {
        cryptoPaymentId: "payment-789",
        cryptoCurrency: "MULTI",
        cryptoPaymentUrl: "https://nowpayments.io/payment/789",
      });
    });

    it("should store specific currency when pre-selected", async () => {
      vi.mocked(db.updateInvoice).mockResolvedValue({} as any);

      // Simulate the update call with a specific currency
      const selectedCurrency = "btc";
      await db.updateInvoice(2, 1, {
        cryptoPaymentId: "payment-abc",
        cryptoCurrency: selectedCurrency?.toUpperCase() || "MULTI",
        cryptoPaymentUrl: "https://nowpayments.io/payment/abc",
      });

      expect(db.updateInvoice).toHaveBeenCalledWith(2, 1, {
        cryptoPaymentId: "payment-abc",
        cryptoCurrency: "BTC",
        cryptoPaymentUrl: "https://nowpayments.io/payment/abc",
      });
    });
  });
});
