import {
  publicProcedure,
  protectedProcedure,
  router,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { extractInvoiceData } from "../ai/smartCompose";
import { clients } from "../../drizzle/schema";

export const aiRouter = router({
  // Get current AI credits status
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    const isPro = ctx.user.subscriptionStatus === "active";
    const credits = await db.getAiCredits(ctx.user.id, isPro);
    const totalLimit = credits.creditsLimit + credits.purchasedCredits;
    return {
      used: credits.creditsUsed,
      limit: credits.creditsLimit,
      purchased: credits.purchasedCredits,
      totalLimit,
      remaining: totalLimit - credits.creditsUsed,
      isPro,
    };
  }),

  // Get credit packs pricing
  getCreditPacks: protectedProcedure.query(async () => {
    const { CREDIT_PACKS } = await import("../stripe");
    return Object.entries(CREDIT_PACKS).map(([key, pack]) => ({
      id: key,
      name: pack.name,
      credits: pack.credits,
      price: pack.price / 100, // Convert to dollars
      pricePerCredit:
        Math.round((pack.price / pack.credits) * 100) / 100 / 100, // Price per credit in dollars
    }));
  }),

  // Create checkout session for credit purchase
  createCreditPurchase: protectedProcedure
    .input(
      z.object({
        packType: z.enum(["starter", "standard", "pro_pack"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { createCreditPurchaseCheckout, CREDIT_PACKS } = await import(
        "../stripe"
      );

      // Ensure user has Stripe customer ID
      let customerId = ctx.user.stripeCustomerId;
      if (!customerId) {
        const { createStripeCustomer } = await import("../stripe");
        customerId = await createStripeCustomer(
          ctx.user.email || `user-${ctx.user.id}@sleekinvoices.com`,
          ctx.user.name || undefined
        );
        // Update user with customer ID
        await db.updateUserProfile(ctx.user.id, {
          stripeCustomerId: customerId,
        });
      }

      const pack = CREDIT_PACKS[input.packType];
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "https://sleekinvoices.com"
          : "http://localhost:3000";

      const { sessionId, url } = await createCreditPurchaseCheckout({
        customerId,
        userId: ctx.user.id,
        packType: input.packType,
        successUrl: `${baseUrl}/settings/ai?purchase=success`,
        cancelUrl: `${baseUrl}/settings/ai?purchase=canceled`,
      });

      // Create pending purchase record
      await db.createCreditPurchase({
        userId: ctx.user.id,
        stripeSessionId: sessionId,
        packType: input.packType,
        creditsAmount: pack.credits,
        amountPaid: pack.price,
      });

      return { sessionId, url };
    }),

  // Get credit purchase history
  getPurchaseHistory: protectedProcedure.query(async ({ ctx }) => {
    return await db.getCreditPurchaseHistory(ctx.user.id);
  }),

  // Smart Compose - Extract invoice data from natural language
  smartCompose: protectedProcedure
    .input(
      z.object({
        text: z.string().min(3).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isPro = ctx.user.subscriptionStatus === "active";

      // Get existing clients for better matching
      const clients = await db.getClientsByUserId(ctx.user.id);
      const clientList = clients.map(c => ({
        id: c.id,
        name: c.name || "",
        email: c.email || undefined,
      }));

      const result = await extractInvoiceData(
        input.text,
        ctx.user.id,
        isPro,
        clientList
      );

      // Get updated credits
      const credits = await db.getAiCredits(ctx.user.id, isPro);
      const totalLimit = credits.creditsLimit + credits.purchasedCredits;

      return {
        ...result,
        creditsRemaining: totalLimit - credits.creditsUsed,
      };
    }),

  // Get AI usage stats
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    return await db.getAiUsageStats(ctx.user.id, 30);
  }),

  // AI Chat - Conversational assistant
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        context: z
          .object({
            currentPage: z.string().optional(),
            conversationHistory: z
              .array(
                z.object({
                  role: z.enum(["user", "assistant"]),
                  content: z.string(),
                })
              )
              .optional(),
            stats: z
              .object({
                totalRevenue: z.number().optional(),
                outstandingBalance: z.number().optional(),
                totalInvoices: z.number().optional(),
                paidInvoices: z.number().optional(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { chatWithAssistant } = await import("../ai/assistant");
      const isPro = ctx.user.subscriptionStatus === "active";

      const result = await chatWithAssistant(
        input.message,
        ctx.user.id,
        isPro,
        input.context
      );

      return result;
    }),
});