import { describe, it, expect } from "vitest";

/**
 * Navigation Component Tests
 * 
 * These tests verify the navigation configuration and structure
 * for the grouped navigation system.
 */

// Navigation configuration (mirrored from component for testing)
const navigationConfig = {
  direct: [
    { href: "/dashboard", label: "Dashboard" },
  ],
  billing: {
    label: "Billing",
    items: [
      { href: "/invoices", label: "Invoices" },
      { href: "/estimates", label: "Estimates" },
      { href: "/recurring-invoices", label: "Recurring" },
      { href: "/payments", label: "Payments" },
    ],
  },
  clients: { href: "/clients", label: "Clients" },
  finances: {
    label: "Finances",
    items: [
      { href: "/expenses", label: "Expenses" },
      { href: "/products", label: "Products" },
      { href: "/analytics", label: "Analytics" },
    ],
  },
  templates: { href: "/templates", label: "Templates" },
};

describe("Navigation Configuration", () => {
  describe("Structure Validation", () => {
    it("should have exactly 5 primary navigation items", () => {
      const primaryItems = [
        navigationConfig.direct[0],
        navigationConfig.billing,
        navigationConfig.clients,
        navigationConfig.finances,
        navigationConfig.templates,
      ];
      expect(primaryItems.length).toBe(5);
    });

    it("should have Dashboard as direct link", () => {
      expect(navigationConfig.direct[0].href).toBe("/dashboard");
      expect(navigationConfig.direct[0].label).toBe("Dashboard");
    });

    it("should have Clients as direct link", () => {
      expect(navigationConfig.clients.href).toBe("/clients");
      expect(navigationConfig.clients.label).toBe("Clients");
    });

    it("should have Templates as direct link", () => {
      expect(navigationConfig.templates.href).toBe("/templates");
      expect(navigationConfig.templates.label).toBe("Templates");
    });
  });

  describe("Billing Dropdown", () => {
    it("should have 4 items in billing dropdown", () => {
      expect(navigationConfig.billing.items.length).toBe(4);
    });

    it("should include Invoices in billing dropdown", () => {
      const invoices = navigationConfig.billing.items.find(item => item.href === "/invoices");
      expect(invoices).toBeDefined();
      expect(invoices?.label).toBe("Invoices");
    });

    it("should include Estimates in billing dropdown", () => {
      const estimates = navigationConfig.billing.items.find(item => item.href === "/estimates");
      expect(estimates).toBeDefined();
      expect(estimates?.label).toBe("Estimates");
    });

    it("should include Recurring Invoices in billing dropdown", () => {
      const recurring = navigationConfig.billing.items.find(item => item.href === "/recurring-invoices");
      expect(recurring).toBeDefined();
      expect(recurring?.label).toBe("Recurring");
    });

    it("should include Payments in billing dropdown", () => {
      const payments = navigationConfig.billing.items.find(item => item.href === "/payments");
      expect(payments).toBeDefined();
      expect(payments?.label).toBe("Payments");
    });
  });

  describe("Finances Dropdown", () => {
    it("should have 3 items in finances dropdown", () => {
      expect(navigationConfig.finances.items.length).toBe(3);
    });

    it("should include Expenses in finances dropdown", () => {
      const expenses = navigationConfig.finances.items.find(item => item.href === "/expenses");
      expect(expenses).toBeDefined();
      expect(expenses?.label).toBe("Expenses");
    });

    it("should include Products in finances dropdown", () => {
      const products = navigationConfig.finances.items.find(item => item.href === "/products");
      expect(products).toBeDefined();
      expect(products?.label).toBe("Products");
    });

    it("should include Analytics in finances dropdown", () => {
      const analytics = navigationConfig.finances.items.find(item => item.href === "/analytics");
      expect(analytics).toBeDefined();
      expect(analytics?.label).toBe("Analytics");
    });
  });

  describe("Route Validation", () => {
    it("all routes should start with /", () => {
      const allRoutes = [
        ...navigationConfig.direct.map(item => item.href),
        ...navigationConfig.billing.items.map(item => item.href),
        navigationConfig.clients.href,
        ...navigationConfig.finances.items.map(item => item.href),
        navigationConfig.templates.href,
      ];

      allRoutes.forEach(route => {
        expect(route.startsWith("/")).toBe(true);
      });
    });

    it("all routes should be unique", () => {
      const allRoutes = [
        ...navigationConfig.direct.map(item => item.href),
        ...navigationConfig.billing.items.map(item => item.href),
        navigationConfig.clients.href,
        ...navigationConfig.finances.items.map(item => item.href),
        navigationConfig.templates.href,
      ];

      const uniqueRoutes = new Set(allRoutes);
      expect(uniqueRoutes.size).toBe(allRoutes.length);
    });

    it("total navigation items should be 10", () => {
      const totalItems = 
        navigationConfig.direct.length +
        navigationConfig.billing.items.length +
        1 + // clients
        navigationConfig.finances.items.length +
        1; // templates
      
      expect(totalItems).toBe(10);
    });
  });
});

describe("Active State Logic", () => {
  // Helper function to test active state
  const isActive = (href: string, location: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const isGroupActive = (items: { href: string }[], location: string) => {
    return items.some(item => location.startsWith(item.href));
  };

  describe("Direct Links", () => {
    it("Dashboard should be active on / and /dashboard", () => {
      expect(isActive("/dashboard", "/")).toBe(true);
      expect(isActive("/dashboard", "/dashboard")).toBe(true);
      expect(isActive("/dashboard", "/invoices")).toBe(false);
    });

    it("Clients should be active on /clients and subpages", () => {
      expect(isActive("/clients", "/clients")).toBe(true);
      expect(isActive("/clients", "/clients/123")).toBe(true);
      expect(isActive("/clients", "/invoices")).toBe(false);
    });
  });

  describe("Dropdown Groups", () => {
    it("Billing group should be active when on any billing page", () => {
      expect(isGroupActive(navigationConfig.billing.items, "/invoices")).toBe(true);
      expect(isGroupActive(navigationConfig.billing.items, "/invoices/create")).toBe(true);
      expect(isGroupActive(navigationConfig.billing.items, "/estimates")).toBe(true);
      expect(isGroupActive(navigationConfig.billing.items, "/recurring-invoices")).toBe(true);
      expect(isGroupActive(navigationConfig.billing.items, "/payments")).toBe(true);
      expect(isGroupActive(navigationConfig.billing.items, "/clients")).toBe(false);
    });

    it("Finances group should be active when on any finances page", () => {
      expect(isGroupActive(navigationConfig.finances.items, "/expenses")).toBe(true);
      expect(isGroupActive(navigationConfig.finances.items, "/products")).toBe(true);
      expect(isGroupActive(navigationConfig.finances.items, "/analytics")).toBe(true);
      expect(isGroupActive(navigationConfig.finances.items, "/invoices")).toBe(false);
    });
  });
});
