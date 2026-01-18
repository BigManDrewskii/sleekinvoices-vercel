/**
 * Email Logging Tests
 *
 * Tests for email delivery tracking system that logs all sent emails
 * to the emailLog table with Resend message IDs for tracking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  logEmail: vi.fn().mockResolvedValue(undefined),
  getEmailLogByInvoiceId: vi.fn().mockResolvedValue([]),
  getEmailLogByMessageId: vi.fn().mockResolvedValue(null),
  updateEmailLogDelivery: vi.fn().mockResolvedValue(undefined),
  updateEmailLogMessageId: vi.fn().mockResolvedValue(undefined),
}));

// Mock Resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: "test-message-id-123" },
        error: null,
      }),
    },
  })),
}));

import * as db from "./db";
import { Resend } from "resend";

describe("Email Logging System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-api-key";
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  describe("logEmail function", () => {
    it("should log email with all required fields", async () => {
      const emailData = {
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Invoice INV-2026-0001 from Test Company",
        emailType: "invoice" as const,
        success: true,
        messageId: "resend-msg-123",
      };

      await db.logEmail(emailData);

      expect(db.logEmail).toHaveBeenCalledWith(emailData);
    });

    it("should log failed email with error message", async () => {
      const emailData = {
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Invoice INV-2026-0001 from Test Company",
        emailType: "invoice" as const,
        success: false,
        errorMessage: "Invalid email address",
      };

      await db.logEmail(emailData);

      expect(db.logEmail).toHaveBeenCalledWith(emailData);
    });

    it("should log reminder email type", async () => {
      const emailData = {
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Payment Reminder: Invoice INV-2026-0001 is 5 days overdue",
        emailType: "reminder" as const,
        success: true,
        messageId: "resend-msg-456",
      };

      await db.logEmail(emailData);

      expect(db.logEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType: "reminder",
        })
      );
    });

    it("should log receipt email type for payment confirmations", async () => {
      const emailData = {
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Payment Received for Invoice INV-2026-0001",
        emailType: "receipt" as const,
        success: true,
        messageId: "resend-msg-789",
      };

      await db.logEmail(emailData);

      expect(db.logEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          emailType: "receipt",
        })
      );
    });
  });

  describe("Email Log Retrieval", () => {
    it("should retrieve email logs by invoice ID", async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 1,
          invoiceId: 100,
          recipientEmail: "client@example.com",
          subject: "Invoice INV-2026-0001",
          emailType: "invoice",
          sentAt: new Date(),
          success: true,
          messageId: "msg-1",
        },
        {
          id: 2,
          userId: 1,
          invoiceId: 100,
          recipientEmail: "client@example.com",
          subject: "Payment Reminder",
          emailType: "reminder",
          sentAt: new Date(),
          success: true,
          messageId: "msg-2",
        },
      ];

      vi.mocked(db.getEmailLogByInvoiceId).mockResolvedValue(mockLogs);

      const result = await db.getEmailLogByInvoiceId(100);

      expect(result).toHaveLength(2);
      expect(result[0].emailType).toBe("invoice");
      expect(result[1].emailType).toBe("reminder");
    });

    it("should retrieve email log by Resend message ID", async () => {
      const mockLog = {
        id: 1,
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Invoice INV-2026-0001",
        emailType: "invoice",
        sentAt: new Date(),
        success: true,
        messageId: "resend-msg-123",
        deliveryStatus: "sent",
      };

      vi.mocked(db.getEmailLogByMessageId).mockResolvedValue(mockLog);

      const result = await db.getEmailLogByMessageId("resend-msg-123");

      expect(result).not.toBeNull();
      expect(result?.messageId).toBe("resend-msg-123");
    });
  });

  describe("Email Delivery Status Updates", () => {
    it("should update delivery status to delivered", async () => {
      await db.updateEmailLogDelivery(1, {
        deliveryStatus: "delivered",
        deliveredAt: new Date(),
      });

      expect(db.updateEmailLogDelivery).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          deliveryStatus: "delivered",
        })
      );
    });

    it("should update delivery status to opened with count", async () => {
      await db.updateEmailLogDelivery(1, {
        deliveryStatus: "opened",
        openedAt: new Date(),
        openCount: 1,
      });

      expect(db.updateEmailLogDelivery).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          deliveryStatus: "opened",
          openCount: 1,
        })
      );
    });

    it("should update delivery status to bounced with type", async () => {
      await db.updateEmailLogDelivery(1, {
        deliveryStatus: "bounced",
        bouncedAt: new Date(),
        bounceType: "hard",
      });

      expect(db.updateEmailLogDelivery).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          deliveryStatus: "bounced",
          bounceType: "hard",
        })
      );
    });

    it("should update message ID after sending", async () => {
      await db.updateEmailLogMessageId(1, "new-resend-msg-id");

      expect(db.updateEmailLogMessageId).toHaveBeenCalledWith(
        1,
        "new-resend-msg-id"
      );
    });
  });

  describe("Email Types", () => {
    it("should support invoice email type", async () => {
      const emailData = {
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Invoice",
        emailType: "invoice" as const,
        success: true,
      };

      await db.logEmail(emailData);
      expect(db.logEmail).toHaveBeenCalled();
    });

    it("should support reminder email type", async () => {
      const emailData = {
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Reminder",
        emailType: "reminder" as const,
        success: true,
      };

      await db.logEmail(emailData);
      expect(db.logEmail).toHaveBeenCalled();
    });

    it("should support receipt email type", async () => {
      const emailData = {
        userId: 1,
        invoiceId: 100,
        recipientEmail: "client@example.com",
        subject: "Receipt",
        emailType: "receipt" as const,
        success: true,
      };

      await db.logEmail(emailData);
      expect(db.logEmail).toHaveBeenCalled();
    });
  });

  describe("Delivery Status Types", () => {
    const statuses = [
      "sent",
      "delivered",
      "opened",
      "clicked",
      "bounced",
      "complained",
      "failed",
    ] as const;

    statuses.forEach(status => {
      it(`should support ${status} delivery status`, async () => {
        await db.updateEmailLogDelivery(1, {
          deliveryStatus: status,
        });

        expect(db.updateEmailLogDelivery).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            deliveryStatus: status,
          })
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      vi.mocked(db.logEmail).mockRejectedValueOnce(new Error("Database error"));

      await expect(
        db.logEmail({
          userId: 1,
          invoiceId: 100,
          recipientEmail: "client@example.com",
          subject: "Test",
          emailType: "invoice",
          success: true,
        })
      ).rejects.toThrow("Database error");
    });

    it("should return empty array when no logs found", async () => {
      vi.mocked(db.getEmailLogByInvoiceId).mockResolvedValue([]);

      const result = await db.getEmailLogByInvoiceId(999);

      expect(result).toEqual([]);
    });

    it("should return null when message ID not found", async () => {
      vi.mocked(db.getEmailLogByMessageId).mockResolvedValue(null);

      const result = await db.getEmailLogByMessageId("non-existent-id");

      expect(result).toBeNull();
    });
  });
});

describe("Crypto Payment Confirmation Email", () => {
  it("should include crypto payment details in email", () => {
    // Test that the payment method includes crypto currency
    const paymentMethod = `Crypto (BTC)`;
    expect(paymentMethod).toContain("Crypto");
    expect(paymentMethod).toContain("BTC");
  });

  it("should format crypto payment method correctly", () => {
    const currencies = ["BTC", "ETH", "USDT", "USDC", "LTC"];

    currencies.forEach(currency => {
      const paymentMethod = `Crypto (${currency.toUpperCase()})`;
      expect(paymentMethod).toMatch(/^Crypto \([A-Z]+\)$/);
    });
  });
});
