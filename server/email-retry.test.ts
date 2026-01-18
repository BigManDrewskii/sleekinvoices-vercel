import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getEmailLogById: vi.fn(),
  getUserById: vi.fn(),
  getInvoiceById: vi.fn(),
  getClientById: vi.fn(),
  updateEmailLogRetry: vi.fn(),
  getFailedEmailsForRetry: vi.fn(),
}));

// Mock Resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: "retry-msg-123" },
        error: null,
      }),
    },
  })),
}));

import * as db from "./db";
import { calculateNextRetryTime, getRetryStatus } from "./lib/email-retry";

describe("Email Retry System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "test-api-key";
  });

  describe("calculateNextRetryTime", () => {
    it("should return 1 minute delay for first retry", () => {
      const nextRetry = calculateNextRetryTime(0);
      expect(nextRetry).not.toBeNull();

      const delayMs = nextRetry!.getTime() - Date.now();
      // Should be approximately 1 minute (60000ms), with some tolerance
      expect(delayMs).toBeGreaterThan(55000);
      expect(delayMs).toBeLessThan(65000);
    });

    it("should return 5 minute delay for second retry", () => {
      const nextRetry = calculateNextRetryTime(1);
      expect(nextRetry).not.toBeNull();

      const delayMs = nextRetry!.getTime() - Date.now();
      // Should be approximately 5 minutes (300000ms)
      expect(delayMs).toBeGreaterThan(295000);
      expect(delayMs).toBeLessThan(305000);
    });

    it("should return 15 minute delay for third retry", () => {
      const nextRetry = calculateNextRetryTime(2);
      expect(nextRetry).not.toBeNull();

      const delayMs = nextRetry!.getTime() - Date.now();
      // Should be approximately 15 minutes (900000ms)
      expect(delayMs).toBeGreaterThan(895000);
      expect(delayMs).toBeLessThan(905000);
    });

    it("should return null when max retries reached", () => {
      const nextRetry = calculateNextRetryTime(3);
      expect(nextRetry).toBeNull();
    });

    it("should return null when retries exceed max", () => {
      const nextRetry = calculateNextRetryTime(5);
      expect(nextRetry).toBeNull();
    });
  });

  describe("getRetryStatus", () => {
    it("should indicate can retry for failed email with no retries", () => {
      const status = getRetryStatus({
        success: false,
        retryCount: 0,
        nextRetryAt: null,
      });

      expect(status.canRetry).toBe(true);
      expect(status.retriesRemaining).toBe(3);
    });

    it("should indicate can retry for failed email with 1 retry", () => {
      const status = getRetryStatus({
        success: false,
        retryCount: 1,
        nextRetryAt: new Date(),
      });

      expect(status.canRetry).toBe(true);
      expect(status.retriesRemaining).toBe(2);
    });

    it("should indicate cannot retry for successful email", () => {
      const status = getRetryStatus({
        success: true,
        retryCount: 0,
        nextRetryAt: null,
      });

      expect(status.canRetry).toBe(false);
      expect(status.retriesRemaining).toBe(3);
    });

    it("should indicate cannot retry when max retries reached", () => {
      const status = getRetryStatus({
        success: false,
        retryCount: 3,
        nextRetryAt: null,
      });

      expect(status.canRetry).toBe(false);
      expect(status.retriesRemaining).toBe(0);
    });

    it("should return nextRetryAt when can retry", () => {
      const nextRetryAt = new Date();
      const status = getRetryStatus({
        success: false,
        retryCount: 1,
        nextRetryAt,
      });

      expect(status.nextRetryAt).toEqual(nextRetryAt);
    });

    it("should return null nextRetryAt when cannot retry", () => {
      const status = getRetryStatus({
        success: true,
        retryCount: 0,
        nextRetryAt: new Date(),
      });

      expect(status.nextRetryAt).toBeNull();
    });
  });

  describe("Database Functions", () => {
    it("should get email log by ID", async () => {
      const mockLog = {
        id: 1,
        userId: 1,
        invoiceId: 1,
        recipientEmail: "test@example.com",
        subject: "Test Email",
        emailType: "invoice" as const,
        sentAt: new Date(),
        success: false,
        retryCount: 0,
      };

      vi.mocked(db.getEmailLogById).mockResolvedValue(mockLog);

      const result = await db.getEmailLogById(1);
      expect(result).toEqual(mockLog);
      expect(db.getEmailLogById).toHaveBeenCalledWith(1);
    });

    it("should update email log retry info", async () => {
      const updateData = {
        retryCount: 1,
        lastRetryAt: new Date(),
        nextRetryAt: new Date(Date.now() + 300000),
        success: false,
        errorMessage: "Rate limit exceeded",
      };

      await db.updateEmailLogRetry(1, updateData);

      expect(db.updateEmailLogRetry).toHaveBeenCalledWith(1, updateData);
    });

    it("should get failed emails for retry", async () => {
      const mockFailedEmails = [
        {
          id: 1,
          userId: 1,
          invoiceId: 1,
          recipientEmail: "test1@example.com",
          subject: "Failed Email 1",
          emailType: "invoice" as const,
          sentAt: new Date(),
          success: false,
          retryCount: 0,
          nextRetryAt: null,
        },
        {
          id: 2,
          userId: 1,
          invoiceId: 2,
          recipientEmail: "test2@example.com",
          subject: "Failed Email 2",
          emailType: "reminder" as const,
          sentAt: new Date(),
          success: false,
          retryCount: 1,
          nextRetryAt: new Date(Date.now() - 1000), // Past due
        },
      ];

      vi.mocked(db.getFailedEmailsForRetry).mockResolvedValue(mockFailedEmails);

      const result = await db.getFailedEmailsForRetry(3);
      expect(result).toHaveLength(2);
      expect(db.getFailedEmailsForRetry).toHaveBeenCalledWith(3);
    });
  });

  describe("Retry Logic", () => {
    it("should not retry already successful emails", async () => {
      const mockLog = {
        id: 1,
        userId: 1,
        invoiceId: 1,
        recipientEmail: "test@example.com",
        subject: "Test Email",
        emailType: "invoice" as const,
        sentAt: new Date(),
        success: true, // Already successful
        retryCount: 0,
      };

      vi.mocked(db.getEmailLogById).mockResolvedValue(mockLog);

      // Import dynamically to get fresh module
      const { retryEmail } = await import("./lib/email-retry");
      const result = await retryEmail(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email was already sent successfully");
    });

    it("should not retry when max retries reached", async () => {
      const mockLog = {
        id: 1,
        userId: 1,
        invoiceId: 1,
        recipientEmail: "test@example.com",
        subject: "Test Email",
        emailType: "invoice" as const,
        sentAt: new Date(),
        success: false,
        retryCount: 3, // Max retries reached
      };

      vi.mocked(db.getEmailLogById).mockResolvedValue(mockLog);

      const { retryEmail } = await import("./lib/email-retry");
      const result = await retryEmail(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Maximum retry attempts reached");
    });

    it("should return error when email log not found", async () => {
      vi.mocked(db.getEmailLogById).mockResolvedValue(null);

      const { retryEmail } = await import("./lib/email-retry");
      const result = await retryEmail(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email log not found");
    });
  });
});
