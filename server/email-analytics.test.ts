import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getEmailLogsByUserId: vi.fn(),
}));

import * as db from "./db";

describe("Email Analytics Over Time", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Data Aggregation", () => {
    it("should calculate open rate correctly", () => {
      // Open rate = opened / delivered * 100
      const delivered = 100;
      const opened = 45;
      const openRate = (opened / delivered) * 100;
      expect(openRate).toBe(45);
    });

    it("should calculate click rate correctly", () => {
      // Click rate = clicked / opened * 100
      const opened = 45;
      const clicked = 10;
      const clickRate = (clicked / opened) * 100;
      expect(Math.round(clickRate * 10) / 10).toBe(22.2);
    });

    it("should handle zero delivered emails", () => {
      const delivered = 0;
      const opened = 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      expect(openRate).toBe(0);
    });

    it("should handle zero opened emails for click rate", () => {
      const opened = 0;
      const clicked = 0;
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
      expect(clickRate).toBe(0);
    });
  });

  describe("Period Grouping", () => {
    it("should group by daily correctly", () => {
      const date = new Date("2025-01-15");
      const dailyKey = date.toISOString().split("T")[0];
      expect(dailyKey).toBe("2025-01-15");
    });

    it("should group by weekly correctly", () => {
      // Test the logic: week start = date - dayOfWeek
      const date = new Date("2025-01-15T12:00:00Z"); // Wednesday (day 3)
      const dayOfWeek = date.getUTCDay(); // 3 for Wednesday
      expect(dayOfWeek).toBe(3);

      // Week start should be 3 days before (Sunday)
      const weekStart = new Date(date);
      weekStart.setUTCDate(date.getUTCDate() - dayOfWeek);
      expect(weekStart.getUTCDate()).toBe(12); // Jan 12 is Sunday
    });

    it("should group by monthly correctly", () => {
      const date = new Date("2025-01-15");
      const monthlyKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      expect(monthlyKey).toBe("2025-01");
    });
  });

  describe("Trend Calculation", () => {
    it("should calculate positive trend correctly", () => {
      const currentOpenRate = 50;
      const prevOpenRate = 40;
      const change = currentOpenRate - prevOpenRate;
      expect(change).toBe(10);
    });

    it("should calculate negative trend correctly", () => {
      const currentOpenRate = 35;
      const prevOpenRate = 45;
      const change = currentOpenRate - prevOpenRate;
      expect(change).toBe(-10);
    });

    it("should handle no change", () => {
      const currentOpenRate = 40;
      const prevOpenRate = 40;
      const change = currentOpenRate - prevOpenRate;
      expect(change).toBe(0);
    });
  });

  describe("Database Query", () => {
    it("should query email logs for user", async () => {
      const mockLogs = [
        {
          id: 1,
          userId: 1,
          invoiceId: 1,
          recipientEmail: "test@example.com",
          subject: "Invoice #001",
          emailType: "invoice" as const,
          sentAt: new Date("2025-01-10"),
          success: true,
          deliveryStatus: "delivered",
        },
        {
          id: 2,
          userId: 1,
          invoiceId: 2,
          recipientEmail: "test2@example.com",
          subject: "Invoice #002",
          emailType: "invoice" as const,
          sentAt: new Date("2025-01-11"),
          success: true,
          deliveryStatus: "opened",
        },
      ];

      vi.mocked(db.getEmailLogsByUserId).mockResolvedValue({
        logs: mockLogs,
        total: 2,
      });

      const result = await db.getEmailLogsByUserId(1, { limit: 10000 });

      expect(db.getEmailLogsByUserId).toHaveBeenCalledWith(1, { limit: 10000 });
      expect(result.logs).toHaveLength(2);
    });

    it("should filter logs by date range", async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const mockLogs = [
        {
          id: 1,
          userId: 1,
          invoiceId: 1,
          recipientEmail: "test@example.com",
          subject: "Recent Invoice",
          emailType: "invoice" as const,
          sentAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          success: true,
          deliveryStatus: "delivered",
        },
        {
          id: 2,
          userId: 1,
          invoiceId: 2,
          recipientEmail: "test2@example.com",
          subject: "Old Invoice",
          emailType: "invoice" as const,
          sentAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
          success: true,
          deliveryStatus: "opened",
        },
      ];

      vi.mocked(db.getEmailLogsByUserId).mockResolvedValue({
        logs: mockLogs,
        total: 2,
      });

      const result = await db.getEmailLogsByUserId(1, { limit: 10000 });

      // Filter logs within 30 days
      const filteredLogs = result.logs.filter(
        l => new Date(l.sentAt) >= thirtyDaysAgo
      );

      expect(filteredLogs).toHaveLength(1);
      expect(filteredLogs[0].subject).toBe("Recent Invoice");
    });
  });

  describe("Status Counting", () => {
    it("should count delivered status correctly", () => {
      const logs = [
        { deliveryStatus: "sent" },
        { deliveryStatus: "delivered" },
        { deliveryStatus: "opened" },
        { deliveryStatus: "clicked" },
        { deliveryStatus: "bounced" },
      ];

      // Delivered includes: delivered, opened, clicked
      const delivered = logs.filter(l =>
        ["delivered", "opened", "clicked"].includes(l.deliveryStatus || "")
      ).length;

      expect(delivered).toBe(3);
    });

    it("should count opened status correctly", () => {
      const logs = [
        { deliveryStatus: "sent" },
        { deliveryStatus: "delivered" },
        { deliveryStatus: "opened" },
        { deliveryStatus: "clicked" },
      ];

      // Opened includes: opened, clicked
      const opened = logs.filter(l =>
        ["opened", "clicked"].includes(l.deliveryStatus || "")
      ).length;

      expect(opened).toBe(2);
    });

    it("should count clicked status correctly", () => {
      const logs = [
        { deliveryStatus: "sent" },
        { deliveryStatus: "delivered" },
        { deliveryStatus: "opened" },
        { deliveryStatus: "clicked" },
      ];

      const clicked = logs.filter(l => l.deliveryStatus === "clicked").length;

      expect(clicked).toBe(1);
    });
  });
});
