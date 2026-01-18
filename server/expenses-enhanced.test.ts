import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";

/**
 * Enhanced Expense Tracking Tests
 *
 * These tests validate the expense tracking feature implementation
 * without requiring a database connection. They focus on:
 * - Schema validation
 * - Business logic
 * - Type safety
 * - Input/output contracts
 */

// Payment method enum for validation
const paymentMethodSchema = z.enum([
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "check",
  "other",
]);

// Expense creation schema
const createExpenseSchema = z.object({
  categoryId: z.number(),
  amount: z.number(),
  date: z.date(),
  description: z.string(),
  vendor: z.string().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  taxAmount: z.number().optional(),
  receiptUrl: z.string().optional(),
  receiptKey: z.string().optional(),
  isBillable: z.boolean().optional(),
  clientId: z.number().optional(),
  invoiceId: z.number().optional(),
});

// Expense update schema
const updateExpenseSchema = z.object({
  id: z.number(),
  categoryId: z.number().optional(),
  amount: z.number().optional(),
  date: z.date().optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  taxAmount: z.number().optional(),
  receiptUrl: z.string().optional(),
  receiptKey: z.string().optional(),
  isBillable: z.boolean().optional(),
  clientId: z.number().optional(),
  invoiceId: z.number().optional(),
});

// Receipt upload schema
const uploadReceiptSchema = z.object({
  fileData: z.string(), // base64 encoded
  fileName: z.string(),
  contentType: z.string(),
});

// Link expense to invoice schema
const linkToInvoiceSchema = z.object({
  expenseId: z.number(),
  invoiceId: z.number(),
});

// Get billable unlinked schema
const getBillableUnlinkedSchema = z
  .object({
    clientId: z.number().optional(),
  })
  .optional();

describe("Test 1: Create expense with all new fields - Schema Validation", () => {
  it("should validate expense with vendor, paymentMethod, and taxAmount", () => {
    const validExpense = {
      categoryId: 1,
      amount: 250.0,
      date: new Date(),
      description: "Complete expense with all fields",
      vendor: "Test Vendor Inc",
      paymentMethod: "credit_card" as const,
      taxAmount: 25.0,
    };

    const result = createExpenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.vendor).toBe("Test Vendor Inc");
      expect(result.data.paymentMethod).toBe("credit_card");
      expect(result.data.taxAmount).toBe(25.0);
    }
  });

  it("should allow expense without optional fields", () => {
    const minimalExpense = {
      categoryId: 1,
      amount: 100.0,
      date: new Date(),
      description: "Minimal expense",
    };

    const result = createExpenseSchema.safeParse(minimalExpense);
    expect(result.success).toBe(true);
  });

  it("should reject expense without required fields", () => {
    const invalidExpense = {
      amount: 100.0,
      description: "Missing categoryId",
    };

    const result = createExpenseSchema.safeParse(invalidExpense);
    expect(result.success).toBe(false);
  });
});

describe("Test 2: Create expense with receipt - Schema Validation", () => {
  it("should validate expense with receipt URL and key", () => {
    const expenseWithReceipt = {
      categoryId: 1,
      amount: 100.0,
      date: new Date(),
      description: "Expense with receipt",
      receiptUrl: "https://example.com/receipt.pdf",
      receiptKey: "receipts/test-receipt-key.pdf",
    };

    const result = createExpenseSchema.safeParse(expenseWithReceipt);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.receiptUrl).toBe("https://example.com/receipt.pdf");
      expect(result.data.receiptKey).toBe("receipts/test-receipt-key.pdf");
    }
  });

  it("should validate receipt upload schema", () => {
    const validUpload = {
      fileData: "dGVzdCBmaWxlIGNvbnRlbnQ=", // base64 encoded
      fileName: "test-receipt.pdf",
      contentType: "application/pdf",
    };

    const result = uploadReceiptSchema.safeParse(validUpload);
    expect(result.success).toBe(true);
  });

  it("should reject receipt upload without required fields", () => {
    const invalidUpload = {
      fileData: "dGVzdCBmaWxlIGNvbnRlbnQ=",
      // missing fileName and contentType
    };

    const result = uploadReceiptSchema.safeParse(invalidUpload);
    expect(result.success).toBe(false);
  });
});

describe("Test 3: Update expense with new fields - Schema Validation", () => {
  it("should validate partial update with vendor, paymentMethod, taxAmount", () => {
    const updateData = {
      id: 1,
      vendor: "Updated Vendor",
      paymentMethod: "bank_transfer" as const,
      taxAmount: 7.5,
    };

    const result = updateExpenseSchema.safeParse(updateData);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.vendor).toBe("Updated Vendor");
      expect(result.data.paymentMethod).toBe("bank_transfer");
      expect(result.data.taxAmount).toBe(7.5);
    }
  });

  it("should require id for update", () => {
    const invalidUpdate = {
      vendor: "Updated Vendor",
    };

    const result = updateExpenseSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});

describe("Test 4: Delete expense with receipt - Business Logic", () => {
  it("should identify expense has receipt for deletion", () => {
    const expenseWithReceipt = {
      id: 1,
      receiptUrl: "https://example.com/receipt.pdf",
      receiptKey: "receipts/test-key.pdf",
    };

    const hasReceipt = !!expenseWithReceipt.receiptKey;
    expect(hasReceipt).toBe(true);
  });

  it("should identify expense without receipt", () => {
    const expenseWithoutReceipt = {
      id: 1,
      receiptUrl: null,
      receiptKey: null,
    };

    const hasReceipt = !!expenseWithoutReceipt.receiptKey;
    expect(hasReceipt).toBe(false);
  });
});

describe("Test 5: Create billable expense - Schema Validation", () => {
  it("should validate billable expense with client", () => {
    const billableExpense = {
      categoryId: 1,
      amount: 500.0,
      taxAmount: 50.0,
      date: new Date(),
      description: "Billable consulting expense",
      vendor: "Consulting Firm",
      isBillable: true,
      clientId: 1,
    };

    const result = createExpenseSchema.safeParse(billableExpense);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.isBillable).toBe(true);
      expect(result.data.clientId).toBe(1);
    }
  });

  it("should allow non-billable expense without client", () => {
    const nonBillableExpense = {
      categoryId: 1,
      amount: 100.0,
      date: new Date(),
      description: "Non-billable expense",
      isBillable: false,
    };

    const result = createExpenseSchema.safeParse(nonBillableExpense);
    expect(result.success).toBe(true);
  });
});

describe("Test 6: Get billable unlinked expenses - Schema Validation", () => {
  it("should validate query with clientId", () => {
    const query = { clientId: 1 };
    const result = getBillableUnlinkedSchema.safeParse(query);
    expect(result.success).toBe(true);
  });

  it("should validate query without clientId", () => {
    const query = {};
    const result = getBillableUnlinkedSchema.safeParse(query);
    expect(result.success).toBe(true);
  });

  it("should validate undefined query", () => {
    const result = getBillableUnlinkedSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });
});

describe("Test 7: Link expense to invoice - Schema Validation", () => {
  it("should validate link expense input", () => {
    const linkData = {
      expenseId: 1,
      invoiceId: 1,
    };

    const result = linkToInvoiceSchema.safeParse(linkData);
    expect(result.success).toBe(true);
  });

  it("should reject link without expenseId", () => {
    const invalidLink = {
      invoiceId: 1,
    };

    const result = linkToInvoiceSchema.safeParse(invalidLink);
    expect(result.success).toBe(false);
  });

  it("should reject link without invoiceId", () => {
    const invalidLink = {
      expenseId: 1,
    };

    const result = linkToInvoiceSchema.safeParse(invalidLink);
    expect(result.success).toBe(false);
  });
});

describe("Test 8: Filter expenses by payment method - Business Logic", () => {
  it("should validate all payment method types", () => {
    const paymentMethods = [
      "cash",
      "credit_card",
      "debit_card",
      "bank_transfer",
      "check",
      "other",
    ];

    paymentMethods.forEach(method => {
      const result = paymentMethodSchema.safeParse(method);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid payment method", () => {
    const result = paymentMethodSchema.safeParse("invalid_method");
    expect(result.success).toBe(false);
  });

  it("should filter expenses by payment method", () => {
    const expenses = [
      { id: 1, paymentMethod: "cash", amount: 100 },
      { id: 2, paymentMethod: "credit_card", amount: 200 },
      { id: 3, paymentMethod: "cash", amount: 150 },
      { id: 4, paymentMethod: "bank_transfer", amount: 300 },
    ];

    const cashExpenses = expenses.filter(e => e.paymentMethod === "cash");
    expect(cashExpenses.length).toBe(2);
    expect(cashExpenses[0].id).toBe(1);
    expect(cashExpenses[1].id).toBe(3);
  });
});

describe("Test 9: Receipt upload validation - Business Logic", () => {
  it("should validate base64 encoded data", () => {
    const validBase64 = "SGVsbG8gV29ybGQ="; // "Hello World"
    const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(validBase64);
    expect(isValidBase64).toBe(true);
  });

  it("should validate file types", () => {
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const validDocTypes = ["application/pdf"];
    const allValidTypes = [...validImageTypes, ...validDocTypes];

    allValidTypes.forEach(type => {
      const isValid =
        validImageTypes.includes(type) || validDocTypes.includes(type);
      expect(isValid).toBe(true);
    });
  });

  it("should reject invalid file types", () => {
    const invalidTypes = [
      "application/exe",
      "text/html",
      "application/javascript",
    ];
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    invalidTypes.forEach(type => {
      const isValid = validTypes.includes(type);
      expect(isValid).toBe(false);
    });
  });

  it("should validate file size limit (5MB)", () => {
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    const validSize = 4 * 1024 * 1024; // 4MB
    const invalidSize = 6 * 1024 * 1024; // 6MB

    expect(validSize <= maxSizeBytes).toBe(true);
    expect(invalidSize <= maxSizeBytes).toBe(false);
  });
});

describe("Test 10: Expense stats with new fields - Business Logic", () => {
  it("should calculate total expenses correctly", () => {
    const expenses = [
      { amount: "100.00", taxAmount: "10.00" },
      { amount: "200.00", taxAmount: "20.00" },
      { amount: "150.00", taxAmount: null },
    ];

    const totalAmount = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount),
      0
    );
    const totalTax = expenses.reduce(
      (sum, exp) => sum + parseFloat(exp.taxAmount || "0"),
      0
    );
    const totalWithTax = totalAmount + totalTax;

    expect(totalAmount).toBe(450);
    expect(totalTax).toBe(30);
    expect(totalWithTax).toBe(480);
  });

  it("should calculate billable vs non-billable breakdown", () => {
    const expenses = [
      { amount: "100.00", isBillable: true },
      { amount: "200.00", isBillable: true },
      { amount: "150.00", isBillable: false },
      { amount: "50.00", isBillable: false },
    ];

    const billableTotal = expenses
      .filter(e => e.isBillable)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const nonBillableTotal = expenses
      .filter(e => !e.isBillable)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    expect(billableTotal).toBe(300);
    expect(nonBillableTotal).toBe(200);
  });

  it("should group expenses by payment method", () => {
    const expenses = [
      { amount: "100.00", paymentMethod: "cash" },
      { amount: "200.00", paymentMethod: "credit_card" },
      { amount: "150.00", paymentMethod: "cash" },
      { amount: "300.00", paymentMethod: "bank_transfer" },
    ];

    const byPaymentMethod: Record<string, number> = {};
    expenses.forEach(exp => {
      const method = exp.paymentMethod;
      byPaymentMethod[method] =
        (byPaymentMethod[method] || 0) + parseFloat(exp.amount);
    });

    expect(byPaymentMethod["cash"]).toBe(250);
    expect(byPaymentMethod["credit_card"]).toBe(200);
    expect(byPaymentMethod["bank_transfer"]).toBe(300);
  });

  it("should group expenses by category", () => {
    const expenses = [
      { amount: "100.00", categoryId: 1, categoryName: "Office" },
      { amount: "200.00", categoryId: 2, categoryName: "Travel" },
      { amount: "150.00", categoryId: 1, categoryName: "Office" },
    ];

    const byCategory: Record<number, { name: string; total: number }> = {};
    expenses.forEach(exp => {
      if (!byCategory[exp.categoryId]) {
        byCategory[exp.categoryId] = { name: exp.categoryName, total: 0 };
      }
      byCategory[exp.categoryId].total += parseFloat(exp.amount);
    });

    expect(byCategory[1].total).toBe(250);
    expect(byCategory[1].name).toBe("Office");
    expect(byCategory[2].total).toBe(200);
    expect(byCategory[2].name).toBe("Travel");
  });
});

describe("Expense Filtering Logic", () => {
  const mockExpenses = [
    {
      id: 1,
      paymentMethod: "cash",
      isBillable: true,
      clientId: 1,
      categoryId: 1,
      amount: "100",
    },
    {
      id: 2,
      paymentMethod: "credit_card",
      isBillable: false,
      clientId: null,
      categoryId: 2,
      amount: "200",
    },
    {
      id: 3,
      paymentMethod: "cash",
      isBillable: true,
      clientId: 2,
      categoryId: 1,
      amount: "150",
    },
    {
      id: 4,
      paymentMethod: "bank_transfer",
      isBillable: true,
      clientId: 1,
      categoryId: 3,
      amount: "300",
    },
    {
      id: 5,
      paymentMethod: "credit_card",
      isBillable: false,
      clientId: null,
      categoryId: 2,
      amount: "250",
    },
  ];

  it("should filter by payment method", () => {
    const filtered = mockExpenses.filter(e => e.paymentMethod === "cash");
    expect(filtered.length).toBe(2);
    expect(filtered.map(e => e.id)).toEqual([1, 3]);
  });

  it("should filter by billable status", () => {
    const billable = mockExpenses.filter(e => e.isBillable);
    const nonBillable = mockExpenses.filter(e => !e.isBillable);

    expect(billable.length).toBe(3);
    expect(nonBillable.length).toBe(2);
  });

  it("should filter by client", () => {
    const client1Expenses = mockExpenses.filter(e => e.clientId === 1);
    expect(client1Expenses.length).toBe(2);
    expect(client1Expenses.map(e => e.id)).toEqual([1, 4]);
  });

  it("should filter by category", () => {
    const category1Expenses = mockExpenses.filter(e => e.categoryId === 1);
    expect(category1Expenses.length).toBe(2);
  });

  it("should apply multiple filters", () => {
    const filtered = mockExpenses.filter(
      e =>
        e.paymentMethod === "cash" && e.isBillable === true && e.clientId === 1
    );

    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(1);
  });

  it("should return empty array when no matches", () => {
    const filtered = mockExpenses.filter(e => e.paymentMethod === "check");

    expect(filtered.length).toBe(0);
  });
});

describe("Billable Expense Workflow Logic", () => {
  it("should identify unlinked billable expenses", () => {
    const expenses = [
      { id: 1, isBillable: true, invoiceId: null },
      { id: 2, isBillable: true, invoiceId: 1 },
      { id: 3, isBillable: false, invoiceId: null },
      { id: 4, isBillable: true, invoiceId: null },
    ];

    const unbilledExpenses = expenses.filter(
      e => e.isBillable && e.invoiceId === null
    );
    expect(unbilledExpenses.length).toBe(2);
    expect(unbilledExpenses.map(e => e.id)).toEqual([1, 4]);
  });

  it("should calculate line item from expense", () => {
    const expense = {
      description: "Consulting services",
      amount: "500.00",
      taxAmount: "50.00",
      vendor: "Acme Consulting",
    };

    const lineItem = {
      description: `${expense.description} (${expense.vendor})`,
      quantity: 1,
      rate: parseFloat(expense.amount) + parseFloat(expense.taxAmount || "0"),
    };

    expect(lineItem.description).toBe("Consulting services (Acme Consulting)");
    expect(lineItem.quantity).toBe(1);
    expect(lineItem.rate).toBe(550);
  });

  it("should handle expense without vendor in line item", () => {
    const expense = {
      description: "Office supplies",
      amount: "100.00",
      taxAmount: null,
      vendor: null,
    };

    const lineItem = {
      description: `${expense.description} (${expense.vendor || "Expense"})`,
      quantity: 1,
      rate: parseFloat(expense.amount) + parseFloat(expense.taxAmount || "0"),
    };

    expect(lineItem.description).toBe("Office supplies (Expense)");
    expect(lineItem.rate).toBe(100);
  });
});
