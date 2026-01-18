import { describe, expect, it } from "vitest";
import { parseCSV } from "../shared/csv-parser";

describe("CSV Parser", () => {
  describe("parseCSV", () => {
    it("parses valid CSV with headers", () => {
      const csv = `name,email,company
John Doe,john@example.com,Acme Inc
Jane Smith,jane@example.com,Tech Corp`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.clients).toHaveLength(2);
      expect(result.clients[0].name).toBe("John Doe");
      expect(result.clients[0].email).toBe("john@example.com");
    });

    it("handles empty email values", () => {
      const csv = `name,email,company
John Doe,,Acme Inc`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.clients[0].name).toBe("John Doe");
      expect(result.clients[0].email).toBeUndefined();
    });

    it("handles quoted values with commas", () => {
      const csv = `name,email,address
John Doe,john@example.com,"123 Main St, Suite 100"`;

      const result = parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.clients[0].address).toBe("123 Main St, Suite 100");
    });

    it("returns error for missing name", () => {
      const csv = `name,email
,john@example.com`;

      const result = parseCSV(csv);

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("returns error for invalid email", () => {
      const csv = `name,email
John Doe,invalid-email`;

      const result = parseCSV(csv);

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("detects duplicate emails", () => {
      const csv = `name,email
John Doe,john@example.com
Jane Doe,john@example.com`;

      const result = parseCSV(csv);

      expect(result.duplicates).toContain("john@example.com");
    });
  });
});

describe("Partial Payments Logic", () => {
  it("calculates remaining balance correctly", () => {
    const invoiceTotal = 1000;
    const payments = [{ amount: "250" }, { amount: "300" }];

    const totalPaid = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );
    const remaining = invoiceTotal - totalPaid;

    expect(totalPaid).toBe(550);
    expect(remaining).toBe(450);
  });

  it("handles full payment", () => {
    const invoiceTotal = 500;
    const payments = [{ amount: "500" }];

    const totalPaid = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );
    const remaining = invoiceTotal - totalPaid;

    expect(remaining).toBe(0);
  });

  it("handles overpayment scenario", () => {
    const invoiceTotal = 500;
    const payments = [{ amount: "300" }, { amount: "300" }];

    const totalPaid = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount),
      0
    );
    const remaining = invoiceTotal - totalPaid;

    expect(remaining).toBe(-100); // Overpaid by 100
  });

  it("determines correct invoice status based on payments", () => {
    const determineStatus = (total: number, paid: number) => {
      if (paid >= total) return "paid";
      if (paid > 0) return "partial";
      return "unpaid";
    };

    expect(determineStatus(1000, 0)).toBe("unpaid");
    expect(determineStatus(1000, 500)).toBe("partial");
    expect(determineStatus(1000, 1000)).toBe("paid");
    expect(determineStatus(1000, 1100)).toBe("paid");
  });
});

describe("Estimates Logic", () => {
  it("generates correct estimate number format", () => {
    const year = new Date().getFullYear();
    const prefix = `EST-${year}-`;
    const number = 1;
    const estimateNumber = `${prefix}${String(number).padStart(4, "0")}`;

    expect(estimateNumber).toBe(`EST-${year}-0001`);
  });

  it("calculates estimate totals correctly", () => {
    const lineItems = [
      { quantity: "2", rate: "100", amount: "200" },
      { quantity: "1", rate: "150", amount: "150" },
    ];

    const subtotal = lineItems.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      0
    );
    const taxRate = 10; // 10%
    const discountPercent = 5; // 5%

    const discountAmount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    expect(subtotal).toBe(350);
    expect(discountAmount).toBe(17.5);
    expect(afterDiscount).toBe(332.5);
    expect(taxAmount).toBe(33.25);
    expect(total).toBe(365.75);
  });

  it("determines estimate expiration correctly", () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
    const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

    const isExpired = (validUntil: Date) => validUntil < now;

    expect(isExpired(futureDate)).toBe(false);
    expect(isExpired(pastDate)).toBe(true);
  });

  it("validates estimate status transitions", () => {
    const validTransitions: Record<string, string[]> = {
      draft: ["sent"],
      sent: ["viewed", "accepted", "rejected", "expired"],
      viewed: ["accepted", "rejected", "expired"],
      accepted: ["converted"],
      rejected: [],
      expired: [],
      converted: [],
    };

    const canTransition = (from: string, to: string) => {
      return validTransitions[from]?.includes(to) ?? false;
    };

    expect(canTransition("draft", "sent")).toBe(true);
    expect(canTransition("draft", "accepted")).toBe(false);
    expect(canTransition("sent", "accepted")).toBe(true);
    expect(canTransition("accepted", "converted")).toBe(true);
    expect(canTransition("rejected", "accepted")).toBe(false);
  });
});
