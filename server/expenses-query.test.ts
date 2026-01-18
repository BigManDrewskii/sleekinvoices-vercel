import { describe, it, expect, beforeAll } from "vitest";
import { getExpensesByUserId } from "./db";

describe("Expenses Query Fix", () => {
  let testUserId: number;

  beforeAll(() => {
    testUserId = 1; // Using existing test user
  });

  it("should fetch expenses without SQL ambiguity errors", async () => {
    const expenses = await getExpensesByUserId(testUserId);

    // Should not throw an error
    expect(expenses).toBeDefined();
    expect(Array.isArray(expenses)).toBe(true);
  });

  it("should fetch expenses with category filter", async () => {
    const expenses = await getExpensesByUserId(testUserId, {
      categoryId: 1,
    });

    expect(expenses).toBeDefined();
    expect(Array.isArray(expenses)).toBe(true);
  });

  it("should fetch expenses with date range filter", async () => {
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-12-31");

    const expenses = await getExpensesByUserId(testUserId, {
      startDate,
      endDate,
    });

    expect(expenses).toBeDefined();
    expect(Array.isArray(expenses)).toBe(true);
  });

  it("should fetch expenses with billable filter", async () => {
    const expenses = await getExpensesByUserId(testUserId, {
      isBillable: true,
    });

    expect(expenses).toBeDefined();
    expect(Array.isArray(expenses)).toBe(true);
  });

  it("should fetch expenses with client filter", async () => {
    const expenses = await getExpensesByUserId(testUserId, {
      clientId: 1,
    });

    expect(expenses).toBeDefined();
    expect(Array.isArray(expenses)).toBe(true);
  });

  it("should fetch expenses with multiple filters", async () => {
    const expenses = await getExpensesByUserId(testUserId, {
      categoryId: 1,
      isBillable: true,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
    });

    expect(expenses).toBeDefined();
    expect(Array.isArray(expenses)).toBe(true);
  });

  it("should return expenses with category name and client name", async () => {
    const expenses = await getExpensesByUserId(testUserId);

    if (expenses.length > 0) {
      const expense = expenses[0];

      // Should have all expected fields
      expect(expense).toHaveProperty("id");
      expect(expense).toHaveProperty("categoryName");
      expect(expense).toHaveProperty("clientName");
      expect(expense).toHaveProperty("amount");
      expect(expense).toHaveProperty("date");
    }
  });

  it("should order expenses by date descending", async () => {
    const expenses = await getExpensesByUserId(testUserId);

    if (expenses.length > 1) {
      const firstDate = new Date(expenses[0].date);
      const secondDate = new Date(expenses[1].date);

      // First expense should have a date >= second expense
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    }
  });
});
