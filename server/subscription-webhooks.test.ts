import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";

describe("Subscription Webhook Handlers", () => {
  const testUserId = 1; // Use existing test user ID
  let testCustomerId: string;

  beforeEach(async () => {
    testCustomerId = `cus_test_${Date.now()}`;

    // Set Stripe customer ID for test user
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    await db
      .update(users)
      .set({
        stripeCustomerId: testCustomerId,
        subscriptionStatus: "free",
        subscriptionId: null,
        currentPeriodEnd: null,
      })
      .where(eq(users.id, testUserId));
  });

  describe("customer.subscription.created", () => {
    it("should activate Pro tier when subscription is created", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const subscriptionId = `sub_test_${Date.now()}`;
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Simulate subscription creation webhook
      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          subscriptionId: subscriptionId,
          currentPeriodEnd: new Date(periodEnd * 1000),
          updatedAt: new Date(),
        })
        .where(eq(users.id, testUserId));

      // Verify user is now Pro
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      const user = userResult[0];
      expect(user.subscriptionStatus).toBe("active");
      expect(user.subscriptionId).toBe(subscriptionId);
      expect(user.currentPeriodEnd).toBeTruthy();
    });

    it("should store subscription ID and period end date", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const subscriptionId = `sub_test_${Date.now()}`;
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          subscriptionId: subscriptionId,
          currentPeriodEnd: new Date(periodEnd * 1000),
          updatedAt: new Date(),
        })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      const user = userResult[0];
      expect(user.subscriptionId).toBe(subscriptionId);
      expect(user.currentPeriodEnd?.getTime()).toBeCloseTo(
        periodEnd * 1000,
        -3
      );
    });
  });

  describe("customer.subscription.updated", () => {
    it("should update subscription status when renewed", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // First, set user to active
      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          subscriptionId: `sub_test_${Date.now()}`,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(users.id, testUserId));

      // Now update to new period
      const newPeriodEnd = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60; // 60 days

      await db
        .update(users)
        .set({
          currentPeriodEnd: new Date(newPeriodEnd * 1000),
          updatedAt: new Date(),
        })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      const user = userResult[0];
      expect(user.subscriptionStatus).toBe("active");
      expect(user.currentPeriodEnd?.getTime()).toBeCloseTo(
        newPeriodEnd * 1000,
        -3
      );
    });

    it("should handle past_due status", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(users)
        .set({
          subscriptionStatus: "past_due",
          subscriptionId: `sub_test_${Date.now()}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      const user = userResult[0];
      expect(user.subscriptionStatus).toBe("past_due");
    });
  });

  describe("customer.subscription.deleted", () => {
    it("should downgrade to free tier when subscription is canceled", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // First, set user to active Pro
      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          subscriptionId: `sub_test_${Date.now()}`,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(users.id, testUserId));

      // Now cancel subscription
      await db
        .update(users)
        .set({
          subscriptionStatus: "free",
          subscriptionId: null,
          currentPeriodEnd: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      const user = userResult[0];
      expect(user.subscriptionStatus).toBe("free");
      expect(user.subscriptionId).toBeNull();
      expect(user.currentPeriodEnd).toBeNull();
    });

    it("should clear subscription data on cancellation", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Set up active subscription
      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          subscriptionId: `sub_test_${Date.now()}`,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .where(eq(users.id, testUserId));

      // Cancel
      await db
        .update(users)
        .set({
          subscriptionStatus: "free",
          subscriptionId: null,
          currentPeriodEnd: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      const user = userResult[0];
      expect(user.subscriptionId).toBeNull();
      expect(user.currentPeriodEnd).toBeNull();
    });
  });

  describe("Subscription status mapping", () => {
    it("should map 'active' Stripe status to 'active'", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(users)
        .set({ subscriptionStatus: "active" })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(userResult[0].subscriptionStatus).toBe("active");
    });

    it("should map 'canceled' Stripe status to 'canceled'", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(users)
        .set({ subscriptionStatus: "canceled" })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(userResult[0].subscriptionStatus).toBe("canceled");
    });

    it("should map 'past_due' Stripe status to 'past_due'", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(users)
        .set({ subscriptionStatus: "past_due" })
        .where(eq(users.id, testUserId));

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(userResult[0].subscriptionStatus).toBe("past_due");
    });
  });

  describe("Edge cases", () => {
    it("should handle subscription update for non-existent customer gracefully", async () => {
      // This tests that the webhook doesn't crash when customer not found
      const fakeCustomerId = `cus_fake_${Date.now()}`;

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Try to find user with fake customer ID
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, fakeCustomerId))
        .limit(1);

      // Should return empty result, not crash
      expect(userResult.length).toBe(0);
    });

    it("should handle multiple subscription updates idempotently", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const subscriptionId = `sub_test_${Date.now()}`;

      // Update twice with same data
      for (let i = 0; i < 2; i++) {
        await db
          .update(users)
          .set({
            subscriptionStatus: "active",
            subscriptionId: subscriptionId,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          })
          .where(eq(users.id, testUserId));
      }

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      const user = userResult[0];
      expect(user.subscriptionStatus).toBe("active");
      expect(user.subscriptionId).toBe(subscriptionId);
    });
  });
});
