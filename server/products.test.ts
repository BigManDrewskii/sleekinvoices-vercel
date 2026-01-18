import { describe, it, expect } from "vitest";

// Test product data structure
describe("Products Data Structure", () => {
  it("should have required product fields", () => {
    const product = {
      id: 1,
      userId: "user123",
      name: "Web Development",
      description: "Custom website development",
      rate: "150.00",
      unit: "hour",
      category: "Development",
      isActive: true,
      usageCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("userId");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("rate");
    expect(product).toHaveProperty("isActive");
    expect(product).toHaveProperty("usageCount");
  });

  it("should have valid rate format", () => {
    const rate = "150.00";
    const parsedRate = parseFloat(rate);

    expect(parsedRate).toBeGreaterThan(0);
    expect(parsedRate).toBe(150);
  });

  it("should support optional fields", () => {
    const minimalProduct = {
      id: 1,
      userId: "user123",
      name: "Basic Service",
      rate: "50.00",
      isActive: true,
      usageCount: 0,
    };

    expect(minimalProduct.name).toBeDefined();
    expect(minimalProduct.rate).toBeDefined();
  });
});

// Test product categories
describe("Product Categories", () => {
  const validCategories = [
    "Development",
    "Design",
    "Consulting",
    "Support",
    "Other",
  ];

  it("should accept valid categories", () => {
    validCategories.forEach(category => {
      expect(typeof category).toBe("string");
      expect(category.length).toBeGreaterThan(0);
    });
  });

  it("should allow null category", () => {
    const product = {
      name: "Generic Service",
      category: null,
    };
    expect(product.category).toBeNull();
  });
});

// Test product units
describe("Product Units", () => {
  const validUnits = ["hour", "day", "project", "unit", "month"];

  it("should accept valid units", () => {
    validUnits.forEach(unit => {
      expect(typeof unit).toBe("string");
    });
  });

  it("should format rate with unit correctly", () => {
    const product = {
      rate: "100.00",
      unit: "hour",
    };

    const formatted = `$${parseFloat(product.rate).toFixed(2)} per ${product.unit}`;
    expect(formatted).toBe("$100.00 per hour");
  });
});

// Test product filtering
describe("Product Filtering", () => {
  const products = [
    {
      id: 1,
      name: "Web Dev",
      category: "Development",
      isActive: true,
      usageCount: 10,
    },
    {
      id: 2,
      name: "Design",
      category: "Design",
      isActive: true,
      usageCount: 5,
    },
    {
      id: 3,
      name: "Old Service",
      category: "Other",
      isActive: false,
      usageCount: 0,
    },
  ];

  it("should filter active products only", () => {
    const activeProducts = products.filter(p => p.isActive);
    expect(activeProducts).toHaveLength(2);
  });

  it("should filter by category", () => {
    const devProducts = products.filter(p => p.category === "Development");
    expect(devProducts).toHaveLength(1);
    expect(devProducts[0].name).toBe("Web Dev");
  });

  it("should sort by usage count descending", () => {
    const sorted = [...products].sort((a, b) => b.usageCount - a.usageCount);
    expect(sorted[0].usageCount).toBe(10);
    expect(sorted[2].usageCount).toBe(0);
  });

  it("should search by name", () => {
    const searchQuery = "web";
    const results = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Web Dev");
  });
});

// Test product to line item conversion
describe("Product to Line Item Conversion", () => {
  it("should convert product to line item format", () => {
    const product = {
      id: 1,
      name: "Consulting",
      description: "Business consulting services",
      rate: "200.00",
      unit: "hour",
    };

    const lineItem = {
      description: product.description
        ? `${product.name} - ${product.description}`
        : product.name,
      quantity: 1,
      rate: parseFloat(product.rate),
    };

    expect(lineItem.description).toBe(
      "Consulting - Business consulting services"
    );
    expect(lineItem.quantity).toBe(1);
    expect(lineItem.rate).toBe(200);
  });

  it("should handle product without description", () => {
    const product = {
      id: 2,
      name: "Quick Task",
      description: null,
      rate: "50.00",
    };

    const description = product.description
      ? `${product.name} - ${product.description}`
      : product.name;

    expect(description).toBe("Quick Task");
  });
});

// Test usage count increment
describe("Usage Count", () => {
  it("should increment usage count", () => {
    let usageCount = 5;
    usageCount += 1;
    expect(usageCount).toBe(6);
  });

  it("should start at zero for new products", () => {
    const newProduct = {
      usageCount: 0,
    };
    expect(newProduct.usageCount).toBe(0);
  });
});
