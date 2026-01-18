import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  users,
  invoices,
  clients,
  invoiceViews,
  payments,
} from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

describe("Phase 3: Settings, View Tracking, and Crypto Payments", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testUserId: number;
  let testClientId: number;
  let testInvoiceId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user with taxId
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-phase3-${Date.now()}`,
        name: "Phase 3 Test User",
        email: "phase3test@example.com",
        taxId: "US123456789",
      })
      .$returningId();
    testUserId = user.id;

    // Create test client
    const [client] = await db
      .insert(clients)
      .values({
        userId: testUserId,
        name: "Test Client",
        email: "client@example.com",
      })
      .$returningId();
    testClientId = client.id;

    // Create test invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        userId: testUserId,
        clientId: testClientId,
        invoiceNumber: "TEST-PHASE3-001",
        status: "sent",
        subtotal: "1000.00",
        taxRate: "0",
        taxAmount: "0",
        discountType: "fixed",
        discountValue: "0",
        discountAmount: "0",
        total: "1000.00",
        amountPaid: "0",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .$returningId();
    testInvoiceId = invoice.id;
  });

  afterAll(async () => {
    if (db && testUserId) {
      // Clean up in reverse order of dependencies
      await db.delete(payments).where(eq(payments.userId, testUserId));
      await db
        .delete(invoiceViews)
        .where(eq(invoiceViews.invoiceId, testInvoiceId));
      await db.delete(invoices).where(eq(invoices.userId, testUserId));
      await db.delete(clients).where(eq(clients.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("3.1 User Tax ID in Settings", () => {
    it("should store user taxId in database", async () => {
      const [user] = await db!
        .select({ taxId: users.taxId })
        .from(users)
        .where(eq(users.id, testUserId));

      expect(user.taxId).toBe("US123456789");
    });

    it("should update user taxId", async () => {
      await db!
        .update(users)
        .set({ taxId: "EU987654321" })
        .where(eq(users.id, testUserId));

      const [user] = await db!
        .select({ taxId: users.taxId })
        .from(users)
        .where(eq(users.id, testUserId));

      expect(user.taxId).toBe("EU987654321");
    });
  });

  describe("3.2 Invoice View Tracking", () => {
    it("should record invoice view", async () => {
      await db!.insert(invoiceViews).values({
        invoiceId: testInvoiceId,
        ipAddress: "192.168.1.1",
        userAgent: "Test Browser",
      });

      const views = await db!
        .select()
        .from(invoiceViews)
        .where(eq(invoiceViews.invoiceId, testInvoiceId));

      expect(views.length).toBeGreaterThan(0);
      expect(views[0].ipAddress).toBe("192.168.1.1");
    });

    it("should count invoice views", async () => {
      // Add another view
      await db!.insert(invoiceViews).values({
        invoiceId: testInvoiceId,
        ipAddress: "192.168.1.2",
        userAgent: "Another Browser",
      });

      const result = await db!
        .select({ count: sql<number>`COUNT(*)` })
        .from(invoiceViews)
        .where(eq(invoiceViews.invoiceId, testInvoiceId));

      expect(result[0].count).toBeGreaterThanOrEqual(2);
    });

    it("should update firstViewedAt on invoice", async () => {
      const now = new Date();
      await db!
        .update(invoices)
        .set({ firstViewedAt: now, status: "viewed" })
        .where(eq(invoices.id, testInvoiceId));

      const [invoice] = await db!
        .select({
          firstViewedAt: invoices.firstViewedAt,
          status: invoices.status,
        })
        .from(invoices)
        .where(eq(invoices.id, testInvoiceId));

      expect(invoice.firstViewedAt).toBeDefined();
      expect(invoice.status).toBe("viewed");
    });
  });

  describe("3.3 Crypto Payment Support", () => {
    it("should create crypto payment with all fields", async () => {
      const [payment] = await db!
        .insert(payments)
        .values({
          invoiceId: testInvoiceId,
          userId: testUserId,
          amount: "1000.00000000",
          currency: "USD",
          paymentMethod: "crypto",
          paymentDate: new Date(),
          status: "completed",
          cryptoAmount: "0.025000000000000000",
          cryptoCurrency: "BTC",
          cryptoNetwork: "mainnet",
          cryptoTxHash: "0x1234567890abcdef",
          cryptoWalletAddress: "bc1qtest123",
        })
        .$returningId();

      const [result] = await db!
        .select()
        .from(payments)
        .where(eq(payments.id, payment.id));

      expect(result.paymentMethod).toBe("crypto");
      expect(result.cryptoCurrency).toBe("BTC");
      expect(result.cryptoNetwork).toBe("mainnet");
      expect(result.cryptoTxHash).toBe("0x1234567890abcdef");
    });

    it("should store high-precision crypto amounts", async () => {
      const [payment] = await db!
        .insert(payments)
        .values({
          invoiceId: testInvoiceId,
          userId: testUserId,
          amount: "500.00000000",
          currency: "USD",
          paymentMethod: "crypto",
          paymentDate: new Date(),
          status: "completed",
          cryptoAmount: "0.123456789012345678", // 18 decimal places
          cryptoCurrency: "ETH",
          cryptoNetwork: "mainnet",
        })
        .$returningId();

      const [result] = await db!
        .select({ cryptoAmount: payments.cryptoAmount })
        .from(payments)
        .where(eq(payments.id, payment.id));

      // Verify high precision is maintained
      expect(result.cryptoAmount).toBeDefined();
      expect(parseFloat(result.cryptoAmount!)).toBeCloseTo(
        0.123456789012345678,
        10
      );
    });

    it("should support multiple crypto currencies", async () => {
      const currencies = ["BTC", "ETH", "USDT", "USDC", "SOL"];

      for (const crypto of currencies) {
        const [payment] = await db!
          .insert(payments)
          .values({
            invoiceId: testInvoiceId,
            userId: testUserId,
            amount: "100.00000000",
            currency: "USD",
            paymentMethod: "crypto",
            paymentDate: new Date(),
            status: "completed",
            cryptoCurrency: crypto,
          })
          .$returningId();

        const [result] = await db!
          .select({ cryptoCurrency: payments.cryptoCurrency })
          .from(payments)
          .where(eq(payments.id, payment.id));

        expect(result.cryptoCurrency).toBe(crypto);
      }
    });

    it("should support multiple networks", async () => {
      const networks = ["mainnet", "polygon", "arbitrum", "optimism", "bsc"];

      for (const network of networks) {
        const [payment] = await db!
          .insert(payments)
          .values({
            invoiceId: testInvoiceId,
            userId: testUserId,
            amount: "50.00000000",
            currency: "USD",
            paymentMethod: "crypto",
            paymentDate: new Date(),
            status: "completed",
            cryptoCurrency: "ETH",
            cryptoNetwork: network,
          })
          .$returningId();

        const [result] = await db!
          .select({ cryptoNetwork: payments.cryptoNetwork })
          .from(payments)
          .where(eq(payments.id, payment.id));

        expect(result.cryptoNetwork).toBe(network);
      }
    });
  });
});
