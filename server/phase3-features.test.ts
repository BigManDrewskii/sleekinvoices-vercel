import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    subscriptionStatus: "active", // Pro subscription to bypass invoice limit
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Phase 3: Automated Invoicing, Multi-Currency, Client Portal", () => {
  describe("Currencies", () => {
    it("should list all active currencies", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const currencies = await caller.currencies.list();

      expect(currencies).toBeDefined();
      expect(Array.isArray(currencies)).toBe(true);
      // Should have default currencies initialized
      expect(currencies.length).toBeGreaterThan(0);
    });

    it("should update exchange rates (admin only)", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.currencies.updateRates();

      expect(result).toEqual({
        success: true,
        message: "Exchange rates updated",
      });
    }, 15000); // Increase timeout for external API call

    it("should reject exchange rate updates from non-admin users", async () => {
      const ctx = createAuthContext();
      ctx.user!.role = "user"; // Change to non-admin
      const caller = appRouter.createCaller(ctx);

      await expect(caller.currencies.updateRates()).rejects.toThrow(
        "Only admins can update exchange rates"
      );
    });
  });

  describe("Client Portal", () => {
    it("should generate access token for a client", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First create a client
      const client = await caller.clients.create({
        name: "Portal Test Client",
        email: "portal@example.com",
        phone: "555-0123",
        address: "123 Portal St",
      });

      // Generate access token
      const result = await caller.clientPortal.generateAccessToken({
        clientId: client.id,
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("portalUrl");
      expect(result.accessToken).toBeTruthy();
      expect(result.portalUrl).toContain("/portal/");
    });

    it("should retrieve client info with valid access token", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create client and get access token
      const client = await caller.clients.create({
        name: "Portal Access Test",
        email: "access@example.com",
        phone: "555-0124",
        address: "124 Access St",
      });

      const { accessToken } = await caller.clientPortal.generateAccessToken({
        clientId: client.id,
      });

      // Retrieve client info using token (public endpoint)
      const retrievedClient = await caller.clientPortal.getClientInfo({
        accessToken,
      });

      expect(retrievedClient).toBeDefined();
      expect(retrievedClient.id).toBe(client.id);
      expect(retrievedClient.name).toBe("Portal Access Test");
    });

    it("should reject invalid access tokens", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.clientPortal.getClientInfo({
          accessToken: "invalid-token-12345",
        })
      ).rejects.toThrow("Invalid or expired access token");
    });

    it("should retrieve client invoices with valid access token", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create client
      const client = await caller.clients.create({
        name: "Invoice Portal Test",
        email: "invoices@example.com",
        phone: "555-0125",
        address: "125 Invoice St",
      });

      // Create an invoice for this client
      await caller.invoices.create({
        clientId: client.id,
        invoiceNumber: "TEST-PORTAL-001",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "draft",
        subtotal: "1000",
        taxRate: 10,
        taxAmount: "100",
        discountType: "percentage",
        discountValue: 0,
        discountAmount: "0",
        total: "1100",
        notes: "Test invoice for portal",
        lineItems: [
          {
            description: "Test Service",
            quantity: 1,
            rate: 1000,
            amount: "1000",
          },
        ],
      });

      // Get access token
      const { accessToken } = await caller.clientPortal.generateAccessToken({
        clientId: client.id,
      });

      // Retrieve invoices
      const invoices = await caller.clientPortal.getInvoices({ accessToken });

      expect(invoices).toBeDefined();
      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.length).toBeGreaterThan(0);
      expect(invoices[0]!.invoiceNumber).toBe("TEST-PORTAL-001");
    });
  });

  describe("Recurring Invoices", () => {
    it("should manually trigger invoice generation (admin only)", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.recurringInvoices.triggerGeneration();

      expect(result).toEqual({
        success: true,
        message: "Invoice generation triggered",
      });
    });

    it("should reject manual trigger from non-admin users", async () => {
      const ctx = createAuthContext();
      ctx.user!.role = "user";
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.recurringInvoices.triggerGeneration()
      ).rejects.toThrow("Only admins can manually trigger invoice generation");
    });
  });
});
