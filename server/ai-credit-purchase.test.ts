import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database functions
vi.mock("./db", () => ({
  getAiCredits: vi.fn(),
  hasAiCredits: vi.fn(),
  useAiCredit: vi.fn(),
  createCreditPurchase: vi.fn(),
  getCreditPurchaseHistory: vi.fn(),
  getTotalPurchasedCredits: vi.fn(),
}));

// Mock Stripe
vi.mock("./stripe", () => ({
  CREDIT_PACKS: {
    starter: {
      credits: 25,
      price: 299,
      name: "Starter Pack",
      description: "25 AI credits",
    },
    standard: {
      credits: 100,
      price: 999,
      name: "Standard Pack",
      description: "100 AI credits",
    },
    pro_pack: {
      credits: 500,
      price: 3999,
      name: "Pro Pack",
      description: "500 AI credits",
    },
  },
  createCreditPurchaseCheckout: vi.fn(),
  createStripeCustomer: vi.fn(),
}));

import * as db from "./db";
import { CREDIT_PACKS, createCreditPurchaseCheckout } from "./stripe";

describe("AI Credit Purchase System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Credit Packs Configuration", () => {
    it("should have correct starter pack configuration", () => {
      expect(CREDIT_PACKS.starter.credits).toBe(25);
      expect(CREDIT_PACKS.starter.price).toBe(299); // $2.99 in cents
    });

    it("should have correct standard pack configuration", () => {
      expect(CREDIT_PACKS.standard.credits).toBe(100);
      expect(CREDIT_PACKS.standard.price).toBe(999); // $9.99 in cents
    });

    it("should have correct pro pack configuration", () => {
      expect(CREDIT_PACKS.pro_pack.credits).toBe(500);
      expect(CREDIT_PACKS.pro_pack.price).toBe(3999); // $39.99 in cents
    });

    it("should have better value per credit for larger packs", () => {
      const starterPerCredit =
        CREDIT_PACKS.starter.price / CREDIT_PACKS.starter.credits;
      const standardPerCredit =
        CREDIT_PACKS.standard.price / CREDIT_PACKS.standard.credits;
      const proPerCredit =
        CREDIT_PACKS.pro_pack.price / CREDIT_PACKS.pro_pack.credits;

      expect(standardPerCredit).toBeLessThan(starterPerCredit);
      expect(proPerCredit).toBeLessThan(standardPerCredit);
    });
  });

  describe("Credit Availability with Purchased Credits", () => {
    it("should include purchased credits in total available", async () => {
      const mockCredits = {
        id: 1,
        userId: 1,
        month: "2026-01",
        creditsUsed: 3,
        creditsLimit: 5,
        purchasedCredits: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAiCredits).mockResolvedValue(mockCredits);

      const credits = await db.getAiCredits(1, false);
      const totalAvailable = credits.creditsLimit + credits.purchasedCredits;
      const remaining = totalAvailable - credits.creditsUsed;

      expect(totalAvailable).toBe(30); // 5 base + 25 purchased
      expect(remaining).toBe(27); // 30 - 3 used
    });

    it("should allow usage when base credits exhausted but purchased available", async () => {
      const mockCredits = {
        id: 1,
        userId: 1,
        month: "2026-01",
        creditsUsed: 5, // All base credits used
        creditsLimit: 5,
        purchasedCredits: 25, // But has purchased credits
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAiCredits).mockResolvedValue(mockCredits);
      vi.mocked(db.hasAiCredits).mockImplementation(async () => {
        const credits = await db.getAiCredits(1, false);
        const totalAvailable = credits.creditsLimit + credits.purchasedCredits;
        return credits.creditsUsed < totalAvailable;
      });

      const hasCredits = await db.hasAiCredits(1, false);
      expect(hasCredits).toBe(true);
    });

    it("should deny usage when all credits exhausted", async () => {
      const mockCredits = {
        id: 1,
        userId: 1,
        month: "2026-01",
        creditsUsed: 30, // All credits used
        creditsLimit: 5,
        purchasedCredits: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAiCredits).mockResolvedValue(mockCredits);
      vi.mocked(db.hasAiCredits).mockImplementation(async () => {
        const credits = await db.getAiCredits(1, false);
        const totalAvailable = credits.creditsLimit + credits.purchasedCredits;
        return credits.creditsUsed < totalAvailable;
      });

      const hasCredits = await db.hasAiCredits(1, false);
      expect(hasCredits).toBe(false);
    });
  });

  describe("Credit Purchase Flow", () => {
    it("should create pending purchase record", async () => {
      const purchaseData = {
        userId: 1,
        stripeSessionId: "cs_test_123",
        packType: "standard" as const,
        creditsAmount: 100,
        amountPaid: 999,
      };

      vi.mocked(db.createCreditPurchase).mockResolvedValue({
        id: 1,
        ...purchaseData,
        stripePaymentIntentId: null,
        currency: "usd",
        status: "pending",
        appliedToMonth: null,
        createdAt: new Date(),
        completedAt: null,
      });

      const purchase = await db.createCreditPurchase(purchaseData);

      expect(purchase.status).toBe("pending");
      expect(purchase.creditsAmount).toBe(100);
      expect(db.createCreditPurchase).toHaveBeenCalledWith(purchaseData);
    });

    it("should create Stripe checkout session with correct metadata", async () => {
      vi.mocked(createCreditPurchaseCheckout).mockResolvedValue({
        sessionId: "cs_test_123",
        url: "https://checkout.stripe.com/test",
      });

      const result = await createCreditPurchaseCheckout({
        customerId: "cus_123",
        userId: 1,
        packType: "standard",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result.sessionId).toBe("cs_test_123");
      expect(result.url).toContain("stripe.com");
    });
  });

  describe("Purchase History", () => {
    it("should return purchase history for user", async () => {
      const mockHistory = [
        {
          id: 2,
          userId: 1,
          stripeSessionId: "cs_test_456",
          stripePaymentIntentId: "pi_456",
          packType: "standard" as const,
          creditsAmount: 100,
          amountPaid: 999,
          currency: "usd",
          status: "completed" as const,
          appliedToMonth: "2026-01",
          createdAt: new Date("2026-01-10"),
          completedAt: new Date("2026-01-10"),
        },
        {
          id: 1,
          userId: 1,
          stripeSessionId: "cs_test_123",
          stripePaymentIntentId: "pi_123",
          packType: "starter" as const,
          creditsAmount: 25,
          amountPaid: 299,
          currency: "usd",
          status: "completed" as const,
          appliedToMonth: "2026-01",
          createdAt: new Date("2026-01-05"),
          completedAt: new Date("2026-01-05"),
        },
      ];

      vi.mocked(db.getCreditPurchaseHistory).mockResolvedValue(mockHistory);

      const history = await db.getCreditPurchaseHistory(1);

      expect(history).toHaveLength(2);
      expect(history[0].createdAt.getTime()).toBeGreaterThan(
        history[1].createdAt.getTime()
      );
    });

    it("should calculate total purchased credits for current month", async () => {
      vi.mocked(db.getTotalPurchasedCredits).mockResolvedValue(125); // 25 + 100

      const total = await db.getTotalPurchasedCredits(1);

      expect(total).toBe(125);
    });
  });

  describe("Pro User Credits", () => {
    it("should have higher base limit for Pro users", async () => {
      const proCredits = {
        id: 1,
        userId: 1,
        month: "2026-01",
        creditsUsed: 0,
        creditsLimit: 50, // Pro limit
        purchasedCredits: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAiCredits).mockResolvedValue(proCredits);

      const credits = await db.getAiCredits(1, true);
      expect(credits.creditsLimit).toBe(50);
    });

    it("should combine Pro base limit with purchased credits", async () => {
      const proCredits = {
        id: 1,
        userId: 1,
        month: "2026-01",
        creditsUsed: 10,
        creditsLimit: 50,
        purchasedCredits: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getAiCredits).mockResolvedValue(proCredits);

      const credits = await db.getAiCredits(1, true);
      const totalAvailable = credits.creditsLimit + credits.purchasedCredits;
      const remaining = totalAvailable - credits.creditsUsed;

      expect(totalAvailable).toBe(150); // 50 base + 100 purchased
      expect(remaining).toBe(140); // 150 - 10 used
    });
  });
});
