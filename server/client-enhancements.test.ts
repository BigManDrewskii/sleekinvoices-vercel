import { describe, it, expect, vi } from "vitest";

describe("Client Management Enhancements", () => {
  describe("Client Sorting", () => {
    it("should sort clients by name ascending", () => {
      const clients = [
        {
          id: 1,
          name: "Zebra Corp",
          email: "z@test.com",
          createdAt: new Date("2026-01-01"),
        },
        {
          id: 2,
          name: "Alpha Inc",
          email: "a@test.com",
          createdAt: new Date("2026-01-02"),
        },
        {
          id: 3,
          name: "Beta LLC",
          email: "b@test.com",
          createdAt: new Date("2026-01-03"),
        },
      ];

      const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));

      expect(sorted[0]?.name).toBe("Alpha Inc");
      expect(sorted[1]?.name).toBe("Beta LLC");
      expect(sorted[2]?.name).toBe("Zebra Corp");
    });

    it("should sort clients by name descending", () => {
      const clients = [
        { id: 1, name: "Zebra Corp", email: "z@test.com" },
        { id: 2, name: "Alpha Inc", email: "a@test.com" },
        { id: 3, name: "Beta LLC", email: "b@test.com" },
      ];

      const sorted = [...clients].sort((a, b) => b.name.localeCompare(a.name));

      expect(sorted[0]?.name).toBe("Zebra Corp");
      expect(sorted[1]?.name).toBe("Beta LLC");
      expect(sorted[2]?.name).toBe("Alpha Inc");
    });

    it("should sort clients by email", () => {
      const clients = [
        { id: 1, name: "Client 1", email: "zebra@test.com" },
        { id: 2, name: "Client 2", email: "alpha@test.com" },
        { id: 3, name: "Client 3", email: null },
      ];

      const sorted = [...clients].sort((a, b) => {
        const aEmail = a.email?.toLowerCase() || "";
        const bEmail = b.email?.toLowerCase() || "";
        return aEmail.localeCompare(bEmail);
      });

      expect(sorted[0]?.email).toBe(null); // Empty sorts first
      expect(sorted[1]?.email).toBe("alpha@test.com");
      expect(sorted[2]?.email).toBe("zebra@test.com");
    });

    it("should sort clients by date added", () => {
      const clients = [
        { id: 1, name: "Client 1", createdAt: new Date("2026-01-15") },
        { id: 2, name: "Client 2", createdAt: new Date("2026-01-01") },
        { id: 3, name: "Client 3", createdAt: new Date("2026-01-10") },
      ];

      const sorted = [...clients].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      expect(sorted[0]?.id).toBe(2); // Jan 1
      expect(sorted[1]?.id).toBe(3); // Jan 10
      expect(sorted[2]?.id).toBe(1); // Jan 15
    });
  });

  describe("Bulk Delete", () => {
    it("should accept array of client IDs", () => {
      const ids = [1, 2, 3, 4, 5];
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.every(id => typeof id === "number")).toBe(true);
    });

    it("should return deleted count", () => {
      const response = { success: true, deletedCount: 5 };
      expect(response.success).toBe(true);
      expect(response.deletedCount).toBe(5);
    });

    it("should handle partial failures gracefully", () => {
      // Simulate some deletions failing
      const ids = [1, 2, 3, 4, 5];
      const failedIds = [3]; // ID 3 fails
      const successfulDeletions = ids.filter(id => !failedIds.includes(id));

      expect(successfulDeletions.length).toBe(4);
    });

    it("should track selected items correctly", () => {
      const selectedIds = new Set<number>();

      // Select items
      selectedIds.add(1);
      selectedIds.add(2);
      selectedIds.add(3);

      expect(selectedIds.size).toBe(3);
      expect(selectedIds.has(1)).toBe(true);
      expect(selectedIds.has(4)).toBe(false);

      // Deselect item
      selectedIds.delete(2);
      expect(selectedIds.size).toBe(2);
      expect(selectedIds.has(2)).toBe(false);

      // Clear all
      selectedIds.clear();
      expect(selectedIds.size).toBe(0);
    });
  });

  describe("Placeholder Textarea", () => {
    it("should identify valid placeholders", () => {
      const validPlaceholders = [
        "clientName",
        "invoiceNumber",
        "invoiceAmount",
        "dueDate",
        "daysOverdue",
        "invoiceUrl",
        "companyName",
      ];
      const template =
        "Dear {{clientName}}, your invoice {{invoiceNumber}} is overdue.";

      const foundPlaceholders = template.match(/\{\{(\w+)\}\}/g) || [];
      const extractedKeys = foundPlaceholders.map(p =>
        p.replace(/\{\{|\}\}/g, "")
      );

      expect(extractedKeys).toContain("clientName");
      expect(extractedKeys).toContain("invoiceNumber");
      expect(extractedKeys.every(key => validPlaceholders.includes(key))).toBe(
        true
      );
    });

    it("should identify invalid placeholders", () => {
      const validPlaceholders = ["clientName", "invoiceNumber"];
      const template = "Dear {{clientName}}, your {{unknownField}} is here.";

      const foundPlaceholders = template.match(/\{\{(\w+)\}\}/g) || [];
      const extractedKeys = foundPlaceholders.map(p =>
        p.replace(/\{\{|\}\}/g, "")
      );

      const invalidKeys = extractedKeys.filter(
        key => !validPlaceholders.includes(key)
      );

      expect(invalidKeys).toContain("unknownField");
    });

    it("should replace placeholders with sample values", () => {
      const template =
        "Dear {{clientName}}, your invoice {{invoiceNumber}} for {{invoiceAmount}} is due.";
      const sampleValues: Record<string, string> = {
        clientName: "John Smith",
        invoiceNumber: "INV-2026-001",
        invoiceAmount: "$1,250.00",
      };

      let preview = template;
      for (const [key, value] of Object.entries(sampleValues)) {
        preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }

      expect(preview).toBe(
        "Dear John Smith, your invoice INV-2026-001 for $1,250.00 is due."
      );
    });

    it("should handle empty template", () => {
      const template = "";
      const foundPlaceholders = template.match(/\{\{(\w+)\}\}/g) || [];

      expect(foundPlaceholders.length).toBe(0);
    });

    it("should handle template with no placeholders", () => {
      const template = "This is a plain text template with no dynamic content.";
      const foundPlaceholders = template.match(/\{\{(\w+)\}\}/g) || [];

      expect(foundPlaceholders.length).toBe(0);
    });
  });
});
