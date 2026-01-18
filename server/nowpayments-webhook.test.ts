import { describe, it, expect } from "vitest";

// Test the order_id parsing logic
function parseSubscriptionOrderId(orderId: string): {
  userId: number;
  months: number;
  isExtension: boolean;
} | null {
  // New format: sub_{userId}_{months}mo_{timestamp} or sub_{userId}_{months}mo_ext_{timestamp}
  const newFormatMatch = orderId.match(/^sub_(\d+)_(\d+)mo(?:_(ext))?_(\d+)$/);
  if (newFormatMatch) {
    return {
      userId: parseInt(newFormatMatch[1], 10),
      months: parseInt(newFormatMatch[2], 10),
      isExtension: newFormatMatch[3] === "ext",
    };
  }

  // Legacy format: sub_{userId}_{timestamp} (defaults to 1 month)
  const legacyMatch = orderId.match(/^sub_(\d+)_(\d+)$/);
  if (legacyMatch) {
    return {
      userId: parseInt(legacyMatch[1], 10),
      months: 1,
      isExtension: false,
    };
  }

  return null;
}

describe("NOWPayments Webhook - Order ID Parsing", () => {
  describe("New format parsing", () => {
    it("should parse 1 month subscription", () => {
      const result = parseSubscriptionOrderId("sub_123_1mo_1704067200");
      expect(result).toEqual({
        userId: 123,
        months: 1,
        isExtension: false,
      });
    });

    it("should parse 3 month subscription", () => {
      const result = parseSubscriptionOrderId("sub_456_3mo_1704067200");
      expect(result).toEqual({
        userId: 456,
        months: 3,
        isExtension: false,
      });
    });

    it("should parse 6 month subscription", () => {
      const result = parseSubscriptionOrderId("sub_789_6mo_1704067200");
      expect(result).toEqual({
        userId: 789,
        months: 6,
        isExtension: false,
      });
    });

    it("should parse 12 month subscription", () => {
      const result = parseSubscriptionOrderId("sub_999_12mo_1704067200");
      expect(result).toEqual({
        userId: 999,
        months: 12,
        isExtension: false,
      });
    });

    it("should parse extension subscription", () => {
      const result = parseSubscriptionOrderId("sub_123_6mo_ext_1704067200");
      expect(result).toEqual({
        userId: 123,
        months: 6,
        isExtension: true,
      });
    });

    it("should parse 12 month extension", () => {
      const result = parseSubscriptionOrderId("sub_456_12mo_ext_1704067200");
      expect(result).toEqual({
        userId: 456,
        months: 12,
        isExtension: true,
      });
    });
  });

  describe("Legacy format parsing", () => {
    it("should parse legacy format and default to 1 month", () => {
      const result = parseSubscriptionOrderId("sub_123_1704067200");
      expect(result).toEqual({
        userId: 123,
        months: 1,
        isExtension: false,
      });
    });

    it("should handle different user IDs in legacy format", () => {
      const result = parseSubscriptionOrderId("sub_999999_1704067200");
      expect(result).toEqual({
        userId: 999999,
        months: 1,
        isExtension: false,
      });
    });
  });

  describe("Invalid format handling", () => {
    it("should return null for invoice order IDs", () => {
      const result = parseSubscriptionOrderId("INV-123-1704067200");
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = parseSubscriptionOrderId("");
      expect(result).toBeNull();
    });

    it("should return null for malformed order IDs", () => {
      expect(parseSubscriptionOrderId("sub_abc_3mo_123")).toBeNull();
      expect(parseSubscriptionOrderId("sub_123_mo_123")).toBeNull();
      expect(parseSubscriptionOrderId("subscription_123_3mo_123")).toBeNull();
    });

    it("should return null for partial matches", () => {
      expect(parseSubscriptionOrderId("sub_123")).toBeNull();
      expect(parseSubscriptionOrderId("sub_123_3mo")).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle user ID of 1", () => {
      const result = parseSubscriptionOrderId("sub_1_3mo_1704067200");
      expect(result).toEqual({
        userId: 1,
        months: 3,
        isExtension: false,
      });
    });

    it("should handle large user IDs", () => {
      const result = parseSubscriptionOrderId("sub_9999999999_12mo_1704067200");
      expect(result).toEqual({
        userId: 9999999999,
        months: 12,
        isExtension: false,
      });
    });

    it("should handle large timestamps", () => {
      const result = parseSubscriptionOrderId("sub_123_6mo_9999999999999");
      expect(result).toEqual({
        userId: 123,
        months: 6,
        isExtension: false,
      });
    });
  });
});
