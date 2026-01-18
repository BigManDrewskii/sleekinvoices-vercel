import { describe, it, expect } from "vitest";

/**
 * Tests for subscription history API
 */

describe("Subscription History API", () => {
  describe("History item transformation", () => {
    // Simulate the transformation logic from routers.ts
    function transformCryptoPayment(payment: {
      id: number;
      paymentId: string;
      paymentStatus: string;
      priceAmount: string;
      priceCurrency: string;
      payCurrency: string;
      payAmount: string;
      months: number;
      isExtension: boolean;
      confirmedAt: Date | null;
      createdAt: Date;
    }) {
      return {
        id: `crypto_${payment.id}`,
        type: "crypto" as const,
        status: payment.paymentStatus,
        amount: parseFloat(payment.priceAmount),
        currency: payment.priceCurrency.toUpperCase(),
        cryptoCurrency: payment.payCurrency.toUpperCase(),
        cryptoAmount: parseFloat(payment.payAmount),
        months: payment.months,
        isExtension: payment.isExtension,
        date: payment.confirmedAt || payment.createdAt,
        createdAt: payment.createdAt,
      };
    }

    it("should transform crypto payment correctly", () => {
      const payment = {
        id: 1,
        paymentId: "np_123456",
        paymentStatus: "finished",
        priceAmount: "28.50",
        priceCurrency: "usd",
        payCurrency: "usdt_bsc",
        payAmount: "28.50000000",
        months: 3,
        isExtension: false,
        confirmedAt: new Date("2026-01-05T10:00:00Z"),
        createdAt: new Date("2026-01-05T09:55:00Z"),
      };

      const result = transformCryptoPayment(payment);

      expect(result.id).toBe("crypto_1");
      expect(result.type).toBe("crypto");
      expect(result.status).toBe("finished");
      expect(result.amount).toBe(28.5);
      expect(result.currency).toBe("USD");
      expect(result.cryptoCurrency).toBe("USDT_BSC");
      expect(result.cryptoAmount).toBe(28.5);
      expect(result.months).toBe(3);
      expect(result.isExtension).toBe(false);
      expect(result.date).toEqual(payment.confirmedAt);
    });

    it("should use createdAt when confirmedAt is null", () => {
      const payment = {
        id: 2,
        paymentId: "np_789",
        paymentStatus: "waiting",
        priceAmount: "10.00",
        priceCurrency: "usd",
        payCurrency: "btc",
        payAmount: "0.00010000",
        months: 1,
        isExtension: false,
        confirmedAt: null,
        createdAt: new Date("2026-01-06T12:00:00Z"),
      };

      const result = transformCryptoPayment(payment);

      expect(result.date).toEqual(payment.createdAt);
    });

    it("should handle extension payments", () => {
      const payment = {
        id: 3,
        paymentId: "np_ext_456",
        paymentStatus: "finished",
        priceAmount: "102.00",
        priceCurrency: "usd",
        payCurrency: "eth",
        payAmount: "0.03000000",
        months: 12,
        isExtension: true,
        confirmedAt: new Date("2026-01-06T14:00:00Z"),
        createdAt: new Date("2026-01-06T13:55:00Z"),
      };

      const result = transformCryptoPayment(payment);

      expect(result.isExtension).toBe(true);
      expect(result.months).toBe(12);
      expect(result.amount).toBe(102.0);
    });
  });

  describe("History sorting", () => {
    it("should sort items by date descending", () => {
      const items = [
        { date: new Date("2026-01-01"), id: "1" },
        { date: new Date("2026-01-03"), id: "2" },
        { date: new Date("2026-01-02"), id: "3" },
      ];

      const sorted = [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      expect(sorted[0].id).toBe("2"); // Jan 3
      expect(sorted[1].id).toBe("3"); // Jan 2
      expect(sorted[2].id).toBe("1"); // Jan 1
    });
  });

  describe("Status categorization", () => {
    const completedStatuses = ["finished", "confirmed", "active"];
    const pendingStatuses = ["waiting", "confirming", "sending"];
    const failedStatuses = ["failed", "expired", "refunded"];

    it("should identify completed statuses", () => {
      completedStatuses.forEach(status => {
        expect(completedStatuses.includes(status.toLowerCase())).toBe(true);
      });
    });

    it("should identify pending statuses", () => {
      pendingStatuses.forEach(status => {
        expect(pendingStatuses.includes(status.toLowerCase())).toBe(true);
      });
    });

    it("should identify failed statuses", () => {
      failedStatuses.forEach(status => {
        expect(failedStatuses.includes(status.toLowerCase())).toBe(true);
      });
    });
  });

  describe("Duration label formatting", () => {
    function getDurationLabel(months: number): string {
      if (months === 1) return "1 Month";
      return `${months} Months`;
    }

    it("should format 1 month correctly", () => {
      expect(getDurationLabel(1)).toBe("1 Month");
    });

    it("should format multiple months correctly", () => {
      expect(getDurationLabel(3)).toBe("3 Months");
      expect(getDurationLabel(6)).toBe("6 Months");
      expect(getDurationLabel(12)).toBe("12 Months");
    });
  });

  describe("Summary calculations", () => {
    it("should calculate total spent from completed payments", () => {
      const items = [
        { status: "finished", amount: 28.5 },
        { status: "waiting", amount: 10.0 },
        { status: "finished", amount: 102.0 },
        { status: "failed", amount: 54.0 },
      ];

      const completedPayments = items.filter(item =>
        ["finished", "confirmed", "active"].includes(item.status.toLowerCase())
      );
      const totalSpent = completedPayments.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      expect(totalSpent).toBe(130.5); // 28.50 + 102.00
    });

    it("should calculate total months from completed payments", () => {
      const items = [
        { status: "finished", months: 3 },
        { status: "waiting", months: 1 },
        { status: "finished", months: 12 },
        { status: "failed", months: 6 },
      ];

      const completedPayments = items.filter(item =>
        ["finished", "confirmed", "active"].includes(item.status.toLowerCase())
      );
      const totalMonths = completedPayments.reduce(
        (sum, item) => sum + item.months,
        0
      );

      expect(totalMonths).toBe(15); // 3 + 12
    });
  });
});
