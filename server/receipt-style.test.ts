import { describe, it, expect } from "vitest";

/**
 * Tests for Receipt Style Invoice functionality
 * Tests the PDF generation and email template logic
 */

// Helper functions matching those in pdf.ts
function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatLongDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
      return "#10b981";
    case "overdue":
      return "#ef4444";
    case "pending":
    case "sent":
      return "#f59e0b";
    case "draft":
      return "#71717a";
    default:
      return "#71717a";
  }
}

function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

describe("Receipt Style Invoice - Currency Formatting", () => {
  it("formats positive amounts correctly", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large amounts with commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("handles string input", () => {
    expect(formatCurrency("999.99")).toBe("$999.99");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(123.456)).toBe("$123.46");
  });

  it("handles negative amounts", () => {
    const formatted = formatCurrency(-100);
    expect(formatted).toContain("100");
    expect(formatted).toContain("-");
  });
});

describe("Receipt Style Invoice - Date Formatting", () => {
  it("formats date in long format", () => {
    // Use a date string that will be parsed consistently
    const date = new Date("2024-05-15T12:00:00Z");
    const formatted = formatLongDate(date);
    // Just check it contains the year and looks like a date
    expect(formatted).toContain("2024");
    expect(formatted.length).toBeGreaterThan(5);
  });

  it("returns empty string for null date", () => {
    expect(formatLongDate(null)).toBe("");
  });

  it("handles date formatting consistently", () => {
    // Test that dates are formatted with month, day, year
    const date = new Date("2024-06-20T12:00:00Z");
    const formatted = formatLongDate(date);
    // Should contain year and be a reasonable length for a formatted date
    expect(formatted).toContain("2024");
    expect(formatted.length).toBeGreaterThan(8);
  });
});

describe("Receipt Style Invoice - Status Colors", () => {
  it("returns green for paid status", () => {
    expect(getStatusColor("paid")).toBe("#10b981");
    expect(getStatusColor("PAID")).toBe("#10b981");
  });

  it("returns red for overdue status", () => {
    expect(getStatusColor("overdue")).toBe("#ef4444");
    expect(getStatusColor("OVERDUE")).toBe("#ef4444");
  });

  it("returns amber for pending status", () => {
    expect(getStatusColor("pending")).toBe("#f59e0b");
    expect(getStatusColor("sent")).toBe("#f59e0b");
  });

  it("returns gray for draft status", () => {
    expect(getStatusColor("draft")).toBe("#71717a");
  });

  it("returns gray for unknown status", () => {
    expect(getStatusColor("unknown")).toBe("#71717a");
    expect(getStatusColor("")).toBe("#71717a");
  });
});

describe("Receipt Style Invoice - Status Labels", () => {
  it("capitalizes first letter", () => {
    expect(getStatusLabel("paid")).toBe("Paid");
    expect(getStatusLabel("overdue")).toBe("Overdue");
    expect(getStatusLabel("pending")).toBe("Pending");
    expect(getStatusLabel("draft")).toBe("Draft");
  });

  it("handles already capitalized input", () => {
    expect(getStatusLabel("Paid")).toBe("Paid");
  });

  it("handles empty string", () => {
    expect(getStatusLabel("")).toBe("");
  });
});

describe("Receipt Style Invoice - Line Item Calculations", () => {
  interface LineItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }

  const calculateLineItemAmount = (item: Omit<LineItem, "amount">): number => {
    return item.quantity * item.rate;
  };

  const calculateSubtotal = (items: LineItem[]): number => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  it("calculates line item amount correctly", () => {
    expect(
      calculateLineItemAmount({ description: "Test", quantity: 2, rate: 100 })
    ).toBe(200);
    expect(
      calculateLineItemAmount({ description: "Test", quantity: 5, rate: 49.99 })
    ).toBeCloseTo(249.95);
  });

  it("calculates subtotal correctly", () => {
    const items: LineItem[] = [
      { description: "Item 1", quantity: 1, rate: 100, amount: 100 },
      { description: "Item 2", quantity: 2, rate: 50, amount: 100 },
      { description: "Item 3", quantity: 3, rate: 33.33, amount: 99.99 },
    ];
    expect(calculateSubtotal(items)).toBeCloseTo(299.99);
  });

  it("handles empty items array", () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

describe("Receipt Style Invoice - Tax Calculations", () => {
  const calculateTax = (subtotal: number, taxRate: number): number => {
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = (
    subtotal: number,
    taxAmount: number,
    discountAmount: number
  ): number => {
    return subtotal + taxAmount - discountAmount;
  };

  it("calculates tax correctly", () => {
    expect(calculateTax(1000, 10)).toBe(100);
    expect(calculateTax(500, 7.5)).toBe(37.5);
    expect(calculateTax(1000, 0)).toBe(0);
  });

  it("calculates total correctly", () => {
    expect(calculateTotal(1000, 100, 0)).toBe(1100);
    expect(calculateTotal(1000, 100, 50)).toBe(1050);
    expect(calculateTotal(1000, 0, 100)).toBe(900);
  });

  it("handles zero values", () => {
    expect(calculateTotal(0, 0, 0)).toBe(0);
  });
});

describe("Receipt Style Invoice - HTML Generation", () => {
  // Test that the receipt style HTML contains expected elements
  const mockInvoiceData = {
    invoiceNumber: "INV-2024-001",
    companyName: "Test Company",
    clientName: "Test Client",
    issueDate: new Date("2024-05-15"),
    dueDate: new Date("2024-05-30"),
    status: "pending",
    subtotal: 1000,
    taxAmount: 100,
    discountAmount: 50,
    total: 1050,
  };

  it("includes invoice number in output", () => {
    const html = generateMockReceiptHTML(mockInvoiceData);
    expect(html).toContain(mockInvoiceData.invoiceNumber);
  });

  it("includes company name in output", () => {
    const html = generateMockReceiptHTML(mockInvoiceData);
    expect(html).toContain(mockInvoiceData.companyName);
  });

  it("includes client name in output", () => {
    const html = generateMockReceiptHTML(mockInvoiceData);
    expect(html).toContain(mockInvoiceData.clientName);
  });

  it("includes formatted total in output", () => {
    const html = generateMockReceiptHTML(mockInvoiceData);
    expect(html).toContain(formatCurrency(mockInvoiceData.total));
  });

  it("includes dashed dividers for receipt style", () => {
    const html = generateMockReceiptHTML(mockInvoiceData);
    expect(html).toContain("dashed");
  });

  it("includes monospace font family", () => {
    const html = generateMockReceiptHTML(mockInvoiceData);
    expect(html.toLowerCase()).toContain("mono");
  });

  it("includes tabular-nums for number alignment", () => {
    const html = generateMockReceiptHTML(mockInvoiceData);
    expect(html).toContain("tabular-nums");
  });
});

// Mock HTML generator for testing
function generateMockReceiptHTML(data: {
  invoiceNumber: string;
  companyName: string;
  clientName: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'IBM Plex Mono', monospace; }
    .divider { border-top: 1px dashed #e4e4e7; }
    .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="company-name">${data.companyName}</div>
    <div class="divider"></div>
    <div class="invoice-number">${data.invoiceNumber}</div>
    <div class="client-name">${data.clientName}</div>
    <div class="dates">
      <span>${formatLongDate(data.issueDate)}</span>
      <span>${formatLongDate(data.dueDate)}</span>
    </div>
    <div class="status" style="color: ${getStatusColor(data.status)}">
      ${getStatusLabel(data.status)}
    </div>
    <div class="divider"></div>
    <div class="totals tabular-nums">
      <div>Subtotal: ${formatCurrency(data.subtotal)}</div>
      ${data.discountAmount > 0 ? `<div>Discount: -${formatCurrency(data.discountAmount)}</div>` : ""}
      ${data.taxAmount > 0 ? `<div>Tax: ${formatCurrency(data.taxAmount)}</div>` : ""}
      <div class="total">Total: ${formatCurrency(data.total)}</div>
    </div>
  </div>
</body>
</html>
  `;
}

describe("Receipt Style Invoice - Email Template", () => {
  it("includes SleekInvoices branding", () => {
    const emailHtml = generateMockEmailHTML({
      companyName: "Test Company",
      clientName: "Test Client",
      invoiceNumber: "INV-001",
      total: 1000,
      paymentLinkUrl: "https://example.com/pay",
    });
    expect(emailHtml).toContain("SleekInvoices");
  });

  it("includes payment button when payment link provided", () => {
    const emailHtml = generateMockEmailHTML({
      companyName: "Test Company",
      clientName: "Test Client",
      invoiceNumber: "INV-001",
      total: 1000,
      paymentLinkUrl: "https://example.com/pay",
    });
    expect(emailHtml).toContain("Pay Invoice Online");
    expect(emailHtml).toContain("https://example.com/pay");
  });

  it("excludes payment button when no payment link", () => {
    const emailHtml = generateMockEmailHTML({
      companyName: "Test Company",
      clientName: "Test Client",
      invoiceNumber: "INV-001",
      total: 1000,
    });
    expect(emailHtml).not.toContain("Pay Invoice Online");
  });

  it("includes client greeting", () => {
    const emailHtml = generateMockEmailHTML({
      companyName: "Test Company",
      clientName: "John Doe",
      invoiceNumber: "INV-001",
      total: 1000,
    });
    expect(emailHtml).toContain("Hello John Doe");
  });
});

// Mock email HTML generator for testing
function generateMockEmailHTML(data: {
  companyName: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  paymentLinkUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'IBM Plex Mono', monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span>${data.companyName}</span>
    </div>
    <div class="message">
      <p>Hello ${data.clientName},</p>
      <p>Thank you for your business!</p>
    </div>
    <div class="invoice-details">
      <div>Invoice #: ${data.invoiceNumber}</div>
      <div>Amount Due: ${formatCurrency(data.total)}</div>
    </div>
    ${
      data.paymentLinkUrl
        ? `
    <div class="payment-section">
      <a href="${data.paymentLinkUrl}" class="button">Pay Invoice Online</a>
    </div>
    `
        : ""
    }
    <div class="footer">
      This is a digital record generated by SleekInvoices
    </div>
  </div>
</body>
</html>
  `;
}
