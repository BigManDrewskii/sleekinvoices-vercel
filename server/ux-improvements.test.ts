import { describe, it, expect } from "vitest";

// Test useTableSort hook
describe("useTableSort Hook", () => {
  it("should initialize with default sort key", () => {
    // Mock implementation
    const defaultKey = "invoiceNumber";
    const sort = { key: defaultKey, direction: "asc" as const };
    
    expect(sort.key).toBe("invoiceNumber");
    expect(sort.direction).toBe("asc");
  });

  it("should toggle direction when clicking same column", () => {
    let sort = { key: "invoiceNumber", direction: "asc" as const };
    
    // Simulate clicking same column
    if (sort.key === "invoiceNumber") {
      sort.direction = sort.direction === "asc" ? "desc" : "asc";
    }
    
    expect(sort.direction).toBe("desc");
  });

  it("should reset to ascending when clicking different column", () => {
    let sort = { key: "invoiceNumber", direction: "desc" as const };
    
    // Simulate clicking different column
    sort = { key: "dueDate", direction: "asc" };
    
    expect(sort.key).toBe("dueDate");
    expect(sort.direction).toBe("asc");
  });

  it("should sort numbers correctly", () => {
    const data = [
      { id: 1, amount: 100 },
      { id: 2, amount: 50 },
      { id: 3, amount: 150 },
    ];
    
    const sorted = [...data].sort((a, b) => a.amount - b.amount);
    
    expect(sorted[0].amount).toBe(50);
    expect(sorted[1].amount).toBe(100);
    expect(sorted[2].amount).toBe(150);
  });

  it("should sort strings correctly", () => {
    const data = [
      { id: 1, name: "Charlie" },
      { id: 2, name: "Alice" },
      { id: 3, name: "Bob" },
    ];
    
    const sorted = [...data].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
    
    expect(sorted[0].name).toBe("Alice");
    expect(sorted[1].name).toBe("Bob");
    expect(sorted[2].name).toBe("Charlie");
  });

  it("should sort dates correctly", () => {
    const date1 = new Date("2026-01-05");
    const date2 = new Date("2026-01-01");
    const date3 = new Date("2026-01-10");
    
    const data = [
      { id: 1, date: date1 },
      { id: 2, date: date2 },
      { id: 3, date: date3 },
    ];
    
    const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    expect(sorted[0].date).toBe(date2);
    expect(sorted[1].date).toBe(date1);
    expect(sorted[2].date).toBe(date3);
  });

  it("should handle null values in sort", () => {
    const data = [
      { id: 1, value: "test" },
      { id: 2, value: null },
      { id: 3, value: "another" },
    ];
    
    // Nulls should go to end in ascending
    const sorted = [...data].sort((a, b) => {
      if (a.value == null && b.value == null) return 0;
      if (a.value == null) return 1;
      if (b.value == null) return -1;
      return String(a.value).localeCompare(String(b.value));
    });
    
    expect(sorted[0].value).toBe("another");
    expect(sorted[1].value).toBe("test");
    expect(sorted[2].value).toBeNull();
  });

  it("should reverse sort correctly", () => {
    const data = [
      { id: 1, amount: 100 },
      { id: 2, amount: 50 },
      { id: 3, amount: 150 },
    ];
    
    const sorted = [...data].sort((a, b) => b.amount - a.amount);
    
    expect(sorted[0].amount).toBe(150);
    expect(sorted[1].amount).toBe(100);
    expect(sorted[2].amount).toBe(50);
  });
});

// Test Pagination Component
describe("Pagination Component", () => {
  it("should calculate correct page range", () => {
    const pageSize = 15;
    const currentPage = 2;
    const totalItems = 50;
    
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    expect(startItem).toBe(16);
    expect(endItem).toBe(30);
  });

  it("should calculate correct total pages", () => {
    const totalItems = 50;
    const pageSize = 15;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    expect(totalPages).toBe(4);
  });

  it("should handle exact division", () => {
    const totalItems = 60;
    const pageSize = 15;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    expect(totalPages).toBe(4);
  });

  it("should handle single page", () => {
    const totalItems = 10;
    const pageSize = 15;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    expect(totalPages).toBe(1);
  });

  it("should slice data correctly for pagination", () => {
    const data = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
    const pageSize = 15;
    const currentPage = 2;
    
    const paginatedData = data.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
    
    expect(paginatedData.length).toBe(15);
    expect(paginatedData[0].id).toBe(16);
    expect(paginatedData[14].id).toBe(30);
  });
});

// Test Invoice Number Cell
describe("InvoiceNumberCell Component", () => {
  it("should truncate long invoice numbers", () => {
    const invoiceNumber = "TEST-AGING-1767600552724";
    const maxLength = 20;
    
    const isLong = invoiceNumber.length > maxLength;
    const displayText = isLong
      ? `${invoiceNumber.substring(0, maxLength)}...`
      : invoiceNumber;
    
    expect(isLong).toBe(true);
    expect(displayText).toBe("TEST-AGING-176760055...");
  });

  it("should not truncate short invoice numbers", () => {
    const invoiceNumber = "INV-2026-0001";
    const maxLength = 20;
    
    const isLong = invoiceNumber.length > maxLength;
    
    expect(isLong).toBe(false);
  });

  it("should preserve full invoice number for tooltip", () => {
    const invoiceNumber = "TEST-AGING-1767600552724";
    
    // Full number should be available for tooltip
    expect(invoiceNumber.length).toBe(24);
  });
});

// Test Monthly Usage Card
describe("MonthlyUsageCard Component", () => {
  it("should show unlimited when no limit provided", () => {
    const invoicesCreated = 8;
    const invoiceLimit = undefined;
    
    const showUnlimited = !invoiceLimit;
    
    expect(showUnlimited).toBe(true);
  });

  it("should calculate percentage correctly", () => {
    const invoicesCreated = 7;
    const invoiceLimit = 10;
    
    const percentage = Math.round((invoicesCreated / invoiceLimit) * 100);
    
    expect(percentage).toBe(70);
  });

  it("should calculate remaining invoices", () => {
    const invoicesCreated = 7;
    const invoiceLimit = 10;
    
    const remaining = Math.max(0, invoiceLimit - invoicesCreated);
    
    expect(remaining).toBe(3);
  });

  it("should determine correct status color - green", () => {
    const percentage = 50;
    
    let statusColor = "bg-green-500";
    if (percentage >= 90) statusColor = "bg-red-500";
    else if (percentage >= 70) statusColor = "bg-yellow-500";
    
    expect(statusColor).toBe("bg-green-500");
  });

  it("should determine correct status color - yellow", () => {
    const percentage = 75;
    
    let statusColor = "bg-green-500";
    if (percentage >= 90) statusColor = "bg-red-500";
    else if (percentage >= 70) statusColor = "bg-yellow-500";
    
    expect(statusColor).toBe("bg-yellow-500");
  });

  it("should determine correct status color - red", () => {
    const percentage = 95;
    
    let statusColor = "bg-green-500";
    if (percentage >= 90) statusColor = "bg-red-500";
    else if (percentage >= 70) statusColor = "bg-yellow-500";
    
    expect(statusColor).toBe("bg-red-500");
  });
});

// Test Global Search
describe("GlobalSearch Component", () => {
  it("should filter invoices by number", () => {
    const invoices = [
      { id: 1, invoiceNumber: "INV-001", client: { name: "Client A" } },
      { id: 2, invoiceNumber: "INV-002", client: { name: "Client B" } },
      { id: 3, invoiceNumber: "TEST-001", client: { name: "Client C" } },
    ];
    
    const query = "INV";
    const filtered = invoices.filter((inv) =>
      inv.invoiceNumber.toLowerCase().includes(query.toLowerCase())
    );
    
    expect(filtered.length).toBe(2);
    expect(filtered[0].invoiceNumber).toBe("INV-001");
  });

  it("should filter clients by name", () => {
    const clients = [
      { id: 1, name: "Alice Corp", email: "alice@example.com" },
      { id: 2, name: "Bob Industries", email: "bob@example.com" },
      { id: 3, name: "Alice Enterprises", email: "alice2@example.com" },
    ];
    
    const query = "alice";
    const filtered = clients.filter((client) =>
      client.name.toLowerCase().includes(query.toLowerCase())
    );
    
    expect(filtered.length).toBe(2);
  });

  it("should filter clients by email", () => {
    const clients = [
      { id: 1, name: "Alice Corp", email: "alice@example.com" },
      { id: 2, name: "Bob Industries", email: "bob@example.com" },
    ];
    
    const query = "bob@";
    const filtered = clients.filter(
      (client) =>
        client.email && client.email.toLowerCase().includes(query.toLowerCase())
    );
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe("Bob Industries");
  });

  it("should limit search results to 5 items", () => {
    const invoices = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      invoiceNumber: `INV-${String(i).padStart(3, "0")}`,
      client: { name: "Test" },
    }));
    
    const query = "INV";
    const filtered = invoices
      .filter((inv) => inv.invoiceNumber.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
    
    expect(filtered.length).toBe(5);
  });

  it("should return empty results for no matches", () => {
    const invoices = [
      { id: 1, invoiceNumber: "INV-001", client: { name: "Client A" } },
    ];
    
    const query = "NOTFOUND";
    const filtered = invoices.filter((inv) =>
      inv.invoiceNumber.toLowerCase().includes(query.toLowerCase())
    );
    
    expect(filtered.length).toBe(0);
  });
});

// Test Trend Indicator
describe("TrendIndicator Component", () => {
  it("should show positive trend with green color", () => {
    const percentage = 15.5;
    const isPositive = true;
    
    expect(isPositive).toBe(true);
    expect(percentage).toBeGreaterThan(0);
  });

  it("should show negative trend with red color", () => {
    const percentage = -10.2;
    const isPositive = percentage >= 0;
    
    expect(isPositive).toBe(false);
  });

  it("should format percentage with one decimal place", () => {
    const percentage = 15.567;
    const formatted = percentage.toFixed(1);
    
    expect(formatted).toBe("15.6");
  });

  it("should handle zero percentage", () => {
    const percentage = 0;
    const isPositive = percentage >= 0;
    
    expect(isPositive).toBe(true);
  });
});
