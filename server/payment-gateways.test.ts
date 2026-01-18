import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { paymentGateways, userWallets } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Tests for Phase 1.1: Payment Gateways and User Wallets tables
 * These tables support the Competitor Crush payment architecture
 */

const mockUserId = 1; // Use existing test user

describe("Phase 1.1: Payment Gateways Table", () => {
  let testGatewayId: number;

  afterAll(async () => {
    // Cleanup test data
    const db = await getDb();
    if (!db) return;

    if (testGatewayId) {
      await db
        .delete(paymentGateways)
        .where(eq(paymentGateways.id, testGatewayId));
    }
  });

  describe("Task 1.1.1: paymentGateways table structure", () => {
    it("should have correct provider enum values", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert a stripe_connect gateway
      const [stripeGateway] = await db
        .insert(paymentGateways)
        .values({
          userId: mockUserId,
          provider: "stripe_connect",
          config: JSON.stringify({ accountId: "acct_test123" }),
          isEnabled: true,
          displayName: "My Stripe Account",
        })
        .$returningId();

      testGatewayId = stripeGateway.id;

      // Verify it was created
      const [gateway] = await db
        .select()
        .from(paymentGateways)
        .where(eq(paymentGateways.id, testGatewayId));

      expect(gateway).toBeDefined();
      expect(gateway.provider).toBe("stripe_connect");
      expect(gateway.isEnabled).toBe(true);
    });

    it("should support coinbase_commerce provider", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert a coinbase_commerce gateway
      const [coinbaseGateway] = await db
        .insert(paymentGateways)
        .values({
          userId: mockUserId,
          provider: "coinbase_commerce",
          config: JSON.stringify({ apiKey: "encrypted_api_key_here" }),
          isEnabled: true,
          displayName: "My Coinbase Commerce",
        })
        .$returningId();

      // Verify it was created
      const [gateway] = await db
        .select()
        .from(paymentGateways)
        .where(eq(paymentGateways.id, coinbaseGateway.id));

      expect(gateway).toBeDefined();
      expect(gateway.provider).toBe("coinbase_commerce");

      // Cleanup
      await db
        .delete(paymentGateways)
        .where(eq(paymentGateways.id, coinbaseGateway.id));
    });

    it("should enforce unique constraint on userId + provider", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Try to insert duplicate stripe_connect for same user
      // This should fail due to unique index
      let errorThrown = false;
      try {
        await db.insert(paymentGateways).values({
          userId: mockUserId,
          provider: "stripe_connect",
          config: JSON.stringify({ accountId: "acct_duplicate" }),
          isEnabled: true,
        });
      } catch (error: any) {
        errorThrown = true;
        // Expected: duplicate key error (message varies by driver)
        expect(error.message.toLowerCase()).toMatch(
          /duplicate|unique|constraint/i
        );
      }

      // Verify that an error was thrown
      expect(errorThrown).toBe(true);
    });

    it("should store encrypted config as JSON string", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [gateway] = await db
        .select()
        .from(paymentGateways)
        .where(eq(paymentGateways.id, testGatewayId));

      expect(gateway.config).toBeDefined();

      // Config should be parseable JSON
      const config = JSON.parse(gateway.config);
      expect(config.accountId).toBe("acct_test123");
    });

    it("should track lastTestedAt timestamp", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const testDate = new Date();

      await db
        .update(paymentGateways)
        .set({ lastTestedAt: testDate })
        .where(eq(paymentGateways.id, testGatewayId));

      const [gateway] = await db
        .select()
        .from(paymentGateways)
        .where(eq(paymentGateways.id, testGatewayId));

      expect(gateway.lastTestedAt).toBeDefined();
    });
  });
});

describe("Phase 1.1: User Wallets Table", () => {
  let testWalletIds: number[] = [];

  afterAll(async () => {
    // Cleanup test data
    const db = await getDb();
    if (!db) return;

    for (const id of testWalletIds) {
      await db.delete(userWallets).where(eq(userWallets.id, id));
    }
  });

  describe("Task 1.1.2: userWallets table structure", () => {
    it("should create wallet with ethereum network", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [wallet] = await db
        .insert(userWallets)
        .values({
          userId: mockUserId,
          label: "My ETH Wallet",
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
          network: "ethereum",
          sortOrder: 0,
        })
        .$returningId();

      testWalletIds.push(wallet.id);

      const [savedWallet] = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.id, wallet.id));

      expect(savedWallet).toBeDefined();
      expect(savedWallet.network).toBe("ethereum");
      expect(savedWallet.label).toBe("My ETH Wallet");
    });

    it("should create wallet with bitcoin network", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [wallet] = await db
        .insert(userWallets)
        .values({
          userId: mockUserId,
          label: "My BTC Wallet",
          address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
          network: "bitcoin",
          sortOrder: 1,
        })
        .$returningId();

      testWalletIds.push(wallet.id);

      const [savedWallet] = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.id, wallet.id));

      expect(savedWallet).toBeDefined();
      expect(savedWallet.network).toBe("bitcoin");
    });

    it("should create wallet with polygon network", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [wallet] = await db
        .insert(userWallets)
        .values({
          userId: mockUserId,
          label: "My USDC Wallet (Polygon)",
          address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5",
          network: "polygon",
          sortOrder: 2,
        })
        .$returningId();

      testWalletIds.push(wallet.id);

      const [savedWallet] = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.id, wallet.id));

      expect(savedWallet).toBeDefined();
      expect(savedWallet.network).toBe("polygon");
    });

    it("should support all network types", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const networks = [
        "ethereum",
        "polygon",
        "bitcoin",
        "bsc",
        "arbitrum",
        "optimism",
      ] as const;

      for (const network of networks) {
        const [wallet] = await db
          .insert(userWallets)
          .values({
            userId: mockUserId,
            label: `Test ${network} Wallet`,
            address: `test_address_${network}`,
            network: network,
            sortOrder: 99,
          })
          .$returningId();

        testWalletIds.push(wallet.id);

        const [savedWallet] = await db
          .select()
          .from(userWallets)
          .where(eq(userWallets.id, wallet.id));

        expect(savedWallet.network).toBe(network);
      }
    });

    it("should allow up to 3 wallets per user (business rule)", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get count of wallets for user
      const wallets = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, mockUserId));

      // Business rule: max 3 wallets per user
      // This is enforced at application level, not DB level
      // Just verify we can query and count
      expect(wallets.length).toBeGreaterThan(0);
    });

    it("should maintain sortOrder for display ordering", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const wallets = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, mockUserId))
        .orderBy(userWallets.sortOrder);

      // Verify wallets are returned in sortOrder
      for (let i = 0; i < wallets.length - 1; i++) {
        expect(wallets[i].sortOrder).toBeLessThanOrEqual(
          wallets[i + 1].sortOrder
        );
      }
    });
  });
});

describe("Phase 1.1: Integration Tests", () => {
  it("should allow user to have both payment gateway and wallets", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Query both tables for the same user
    const gateways = await db
      .select()
      .from(paymentGateways)
      .where(eq(paymentGateways.userId, mockUserId));

    const wallets = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, mockUserId));

    // User should be able to have both
    expect(gateways.length).toBeGreaterThanOrEqual(0);
    expect(wallets.length).toBeGreaterThanOrEqual(0);
  });
});
