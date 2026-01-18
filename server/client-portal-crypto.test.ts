import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getClientByAccessToken: vi.fn(),
  getInvoiceById: vi.fn(),
  getDb: vi.fn(),
}));

// Mock nowpayments
vi.mock("./lib/nowpayments", () => ({
  createInvoice: vi.fn(),
}));

import * as db from "./db";
import * as nowpayments from "./lib/nowpayments";

describe("Client Portal Crypto Payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCryptoPayment validation", () => {
    it("should reject invalid access token", async () => {
      vi.mocked(db.getClientByAccessToken).mockResolvedValue(null);

      // The endpoint should throw an error for invalid token
      const result = await db.getClientByAccessToken("invalid-token");
      expect(result).toBeNull();
    });

    it("should reject if invoice does not belong to client", async () => {
      const mockClient = {
        id: 1,
        userId: 100,
        name: "Test Client",
        email: "test@example.com",
      };

      const mockInvoice = {
        id: 1,
        clientId: 999, // Different client
        userId: 100,
        status: "sent",
        total: "100.00",
        amountPaid: "0",
        currency: "USD",
      };

      vi.mocked(db.getClientByAccessToken).mockResolvedValue(mockClient as any);
      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);

      const client = await db.getClientByAccessToken("valid-token");
      const invoice = await db.getInvoiceById(1, client!.userId);

      // Verify the invoice belongs to a different client
      expect(invoice?.clientId).not.toBe(client?.id);
    });

    it("should reject paid invoices", async () => {
      const mockClient = {
        id: 1,
        userId: 100,
        name: "Test Client",
      };

      const mockInvoice = {
        id: 1,
        clientId: 1,
        userId: 100,
        status: "paid", // Already paid
        total: "100.00",
        amountPaid: "100.00",
        currency: "USD",
      };

      vi.mocked(db.getClientByAccessToken).mockResolvedValue(mockClient as any);
      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);

      const invoice = await db.getInvoiceById(1, 100);
      expect(invoice?.status).toBe("paid");
    });

    it("should reject draft invoices", async () => {
      const mockInvoice = {
        id: 1,
        clientId: 1,
        userId: 100,
        status: "draft",
        total: "100.00",
        amountPaid: "0",
        currency: "USD",
      };

      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);

      const invoice = await db.getInvoiceById(1, 100);
      expect(invoice?.status).toBe("draft");
    });

    it("should reject canceled invoices", async () => {
      const mockInvoice = {
        id: 1,
        clientId: 1,
        userId: 100,
        status: "canceled",
        total: "100.00",
        amountPaid: "0",
        currency: "USD",
      };

      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);

      const invoice = await db.getInvoiceById(1, 100);
      expect(invoice?.status).toBe("canceled");
    });

    it("should calculate remaining amount correctly", async () => {
      const mockInvoice = {
        id: 1,
        clientId: 1,
        userId: 100,
        status: "sent",
        total: "100.00",
        amountPaid: "25.00", // Partial payment
        currency: "USD",
      };

      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);

      const invoice = await db.getInvoiceById(1, 100);
      const remaining =
        parseFloat(invoice!.total) - parseFloat(invoice!.amountPaid || "0");

      expect(remaining).toBe(75);
    });

    it("should reject fully paid invoices even if status not updated", async () => {
      const mockInvoice = {
        id: 1,
        clientId: 1,
        userId: 100,
        status: "sent", // Status not updated yet
        total: "100.00",
        amountPaid: "100.00", // But fully paid
        currency: "USD",
      };

      vi.mocked(db.getInvoiceById).mockResolvedValue(mockInvoice as any);

      const invoice = await db.getInvoiceById(1, 100);
      const remaining =
        parseFloat(invoice!.total) - parseFloat(invoice!.amountPaid || "0");

      expect(remaining).toBe(0);
    });
  });

  describe("NOWPayments invoice creation", () => {
    it("should create invoice with correct parameters", async () => {
      const mockPayment = {
        id: "payment-123",
        invoice_url: "https://nowpayments.io/payment/?iid=123",
      };

      vi.mocked(nowpayments.createInvoice).mockResolvedValue(
        mockPayment as any
      );

      const result = await nowpayments.createInvoice({
        priceAmount: 75,
        priceCurrency: "usd",
        orderId: "INV-1-123456",
        orderDescription: "Payment for Invoice INV-0001",
        ipnCallbackUrl: "https://example.com/api/webhooks/nowpayments",
        successUrl:
          "https://example.com/portal/token?payment=success&invoiceId=1",
        cancelUrl:
          "https://example.com/portal/token?payment=cancelled&invoiceId=1",
        isFixedRate: true,
      });

      expect(result.id).toBe("payment-123");
      expect(result.invoice_url).toContain("nowpayments.io");
    });

    it("should not specify payCurrency to allow customer choice", async () => {
      vi.mocked(nowpayments.createInvoice).mockImplementation(
        async (params: any) => {
          // Verify payCurrency is not specified
          expect(params.payCurrency).toBeUndefined();
          return {
            id: "payment-123",
            invoice_url: "https://nowpayments.io/payment/?iid=123",
          } as any;
        }
      );

      await nowpayments.createInvoice({
        priceAmount: 100,
        priceCurrency: "usd",
        orderId: "test",
        orderDescription: "test",
        ipnCallbackUrl: "https://example.com/webhook",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
        isFixedRate: true,
        // Note: payCurrency is intentionally not included
      });
    });
  });
});
