import { protectedProcedure, router, TRPCError } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import {
  createStripeCustomer,
  createSubscriptionCheckout,
  createCustomerPortalSession,
} from "../stripe";
import * as nowpayments from "../lib/nowpayments";

export const subscriptionRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const {
      getEffectiveEndDate,
      getDaysRemaining,
      formatTimeRemaining,
      isExpiringSoon,
      isExpired,
    } = await import("../lib/subscription-utils.js");

    const userData = {
      currentPeriodEnd: ctx.user.currentPeriodEnd,
      subscriptionEndDate: ctx.user.subscriptionEndDate,
    };

    const effectiveEndDate = getEffectiveEndDate(userData);
    const daysRemaining = getDaysRemaining(userData);
    const timeRemaining = formatTimeRemaining(userData);
    const expiringSoon = isExpiringSoon(userData);
    const expired = isExpired(userData);

    return {
      status: ctx.user.subscriptionStatus,
      currentPeriodEnd: ctx.user.currentPeriodEnd,
      subscriptionEndDate: ctx.user.subscriptionEndDate,
      subscriptionSource: ctx.user.subscriptionSource,
      effectiveEndDate,
      daysRemaining,
      timeRemaining,
      isExpiringSoon: expiringSoon,
      isExpired: expired,
    };
  }),

  /**
   * Get subscription payment history
   * Returns all crypto payments and subscription events
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const cryptoPayments = await db.getSubscriptionHistory(ctx.user.id);

    // Transform crypto payments into history items
    const historyItems = cryptoPayments.map(payment => ({
      id: `crypto_${payment.id}`,
      type: "crypto" as const,
      status: payment.paymentStatus,
      amount: parseFloat(payment.priceAmount),
      currency: payment.priceCurrency.toUpperCase(),
      cryptoCurrency: payment.payCurrency.toUpperCase(),
      cryptoAmount: parseFloat(payment.payAmount),
      months: payment.months,
      isExtension: payment.isExtension,
      date: payment.confirmedAt || payment.createdAt,
      createdAt: payment.createdAt,
    }));

    // Add Stripe subscription info if available
    const stripeItems: Array<{
      id: string;
      type: "stripe";
      status: string;
      amount: number;
      currency: string;
      months: number;
      isExtension: boolean;
      date: Date;
      createdAt: Date;
    }> = [];

    if (ctx.user.stripeCustomerId && ctx.user.subscriptionId) {
      // Add current Stripe subscription as a history item
      stripeItems.push({
        id: `stripe_${ctx.user.subscriptionId}`,
        type: "stripe",
        status: ctx.user.subscriptionStatus,
        amount: 12, // Monthly price
        currency: "USD",
        months: 1, // Stripe is monthly recurring
        isExtension: false,
        date: ctx.user.createdAt,
        createdAt: ctx.user.createdAt,
      });
    }

    // Combine and sort by date descending
    const allItems = [...historyItems, ...stripeItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      items: allItems,
      totalCryptoPayments: cryptoPayments.length,
      hasStripeSubscription: !!ctx.user.subscriptionId,
    };
  }),

  /**
   * Get current month's usage for invoice limit tracking
   * Returns invoices created this month and the limit based on subscription
   */
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const usage = await db.getCurrentMonthUsage(ctx.user.id);
    const { SUBSCRIPTION_PLANS, isPro, getRemainingInvoices } = await import(
      "../../shared/subscription.js"
    );

    const isProUser = isPro(ctx.user.subscriptionStatus);
    const limit = isProUser ? null : SUBSCRIPTION_PLANS.FREE.invoiceLimit;
    const remaining = isProUser
      ? null
      : getRemainingInvoices(usage.invoicesCreated);

    return {
      invoicesCreated: usage.invoicesCreated,
      limit,
      remaining,
      isPro: isProUser,
    };
  }),

  createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    // Create Stripe customer if not exists
    let customerId = ctx.user.stripeCustomerId;
    if (!customerId) {
      customerId = await createStripeCustomer(
        ctx.user.email!,
        ctx.user.name || undefined
      );
      await db.updateUserSubscription(ctx.user.id, {
        stripeCustomerId: customerId,
      });
    }

    /**
     * STRIPE PRICE ID SETUP:
     * 1. Log into Stripe Dashboard (https://dashboard.stripe.com)
     * 2. Go to Products → Create Product
     * 3. Name: "InvoiceFlow Pro"
     * 4. Add recurring price: $12/month
     * 5. Copy the Price ID (format: price_xxxxxxxxxxxxx)
     * 6. Set environment variable: STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
     */
    const priceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      throw new Error(
        "Stripe price ID not configured. Please set STRIPE_PRO_PRICE_ID environment variable."
      );
    }

    if (priceId.includes("PLACEHOLDER") || priceId === "price_1234567890") {
      throw new Error(
        "Stripe price ID is still a placeholder. Please create a product in Stripe Dashboard and update STRIPE_PRO_PRICE_ID."
      );
    }

    // Use the request host to build correct redirect URLs
    const protocol = ctx.req.protocol || "https";
    const host = ctx.req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const { url } = await createSubscriptionCheckout({
      customerId,
      priceId,
      successUrl: `${baseUrl}/subscription/success`,
      cancelUrl: `${baseUrl}/subscription`,
    });

    return { url };
  }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.stripeCustomerId) {
      throw new Error("No Stripe customer found");
    }

    const url = await createCustomerPortalSession({
      customerId: ctx.user.stripeCustomerId,
      returnUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/subscription`,
    });

    return { url };
  }),

  /**
   * Create crypto checkout for new Pro subscription
   * Supports Bitcoin and other cryptocurrencies via NOWPayments
   */
  createCryptoCheckout: protectedProcedure
    .input(
      z.object({
        months: z
          .number()
          .refine(m => [1, 3, 6, 12].includes(m), {
            message: "Duration must be 1, 3, 6, or 12 months",
          })
          .default(1),
        payCurrency: z.string().default("btc"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getCryptoPrice, isValidCryptoDuration } = await import(
        "../../shared/subscription.js"
      );

      // Validate duration
      if (!isValidCryptoDuration(input.months)) {
        throw new Error("Invalid subscription duration");
      }

      // Get crypto price for the selected duration
      const priceAmount = getCryptoPrice(input.months);
      if (priceAmount === 0) {
        throw new Error("Invalid subscription duration");
      }

      // Create NOWPayments payment for Pro subscription
      const protocol = ctx.req.protocol || "https";
      const host = ctx.req.get("host") || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;

      // Include months in orderId for webhook processing
      const orderId = `sub_${ctx.user.id}_${input.months}mo_${Date.now()}`;

      const payment = await nowpayments.createPayment({
        priceAmount,
        priceCurrency: "usd",
        payCurrency: input.payCurrency,
        orderId,
        orderDescription: `SleekInvoices Pro - ${input.months} month${input.months > 1 ? "s" : ""} - ${ctx.user.email}`,
        ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
        successUrl: `${baseUrl}/subscription/success?crypto=true`,
        cancelUrl: `${baseUrl}/subscription`,
      });

      // Store the payment reference for webhook processing
      await db.createCryptoSubscriptionPayment({
        userId: ctx.user.id,
        paymentId: payment.payment_id,
        paymentStatus: payment.payment_status,
        priceAmount: priceAmount.toString(),
        priceCurrency: "usd",
        payCurrency: input.payCurrency,
        payAmount: payment.pay_amount?.toString() || "0",
        months: input.months,
        isExtension: false,
      });

      return {
        paymentUrl: payment.invoice_url || "",
        paymentId: payment.payment_id,
        cryptoAmount: payment.pay_amount?.toString() || "0",
        cryptoCurrency: input.payCurrency,
      };
    }),

  /**
   * Extend an existing Pro subscription with crypto payment
   * For users who already have an active subscription
   */
  extendCryptoSubscription: protectedProcedure
    .input(
      z.object({
        months: z.number().refine(m => [1, 3, 6, 12].includes(m), {
          message: "Duration must be 1, 3, 6, or 12 months",
        }),
        payCurrency: z.string().default("btc"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getCryptoPrice, isPro } = await import(
        "../../shared/subscription.js"
      );

      // User must be Pro to extend
      if (!isPro(ctx.user.subscriptionStatus)) {
        throw new Error("Only Pro subscribers can extend their subscription");
      }

      const priceAmount = getCryptoPrice(input.months);
      if (priceAmount === 0) {
        throw new Error("Invalid subscription duration");
      }

      const protocol = ctx.req.protocol || "https";
      const host = ctx.req.get("host") || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;

      // Include 'ext' in orderId to mark as extension
      const orderId = `sub_${ctx.user.id}_${input.months}mo_ext_${Date.now()}`;

      const payment = await nowpayments.createPayment({
        priceAmount,
        priceCurrency: "usd",
        payCurrency: input.payCurrency,
        orderId,
        orderDescription: `SleekInvoices Pro Extension - ${input.months} month${input.months > 1 ? "s" : ""} - ${ctx.user.email}`,
        ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
        successUrl: `${baseUrl}/subscription/success?crypto=true&extended=true`,
        cancelUrl: `${baseUrl}/subscription`,
      });

      await db.createCryptoSubscriptionPayment({
        userId: ctx.user.id,
        paymentId: payment.payment_id,
        paymentStatus: payment.payment_status,
        priceAmount: priceAmount.toString(),
        priceCurrency: "usd",
        payCurrency: input.payCurrency,
        payAmount: payment.pay_amount?.toString() || "0",
        months: input.months,
        isExtension: true,
      });

      return {
        paymentUrl: payment.invoice_url || "",
        paymentId: payment.payment_id,
        cryptoAmount: payment.pay_amount?.toString() || "0",
        cryptoCurrency: input.payCurrency,
      };
    }),

  syncStatus: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.stripeCustomerId) {
      throw new Error(
        "No Stripe customer found. Please create a subscription first."
      );
    }

    const { syncSubscriptionStatus } = await import("../stripe");
    const syncResult = await syncSubscriptionStatus(ctx.user.stripeCustomerId);

    // Update user in database
    await db.updateUserSubscription(ctx.user.id, {
      subscriptionStatus: syncResult.status,
      subscriptionId: syncResult.subscriptionId || undefined,
      currentPeriodEnd: syncResult.currentPeriodEnd || undefined,
    });

    return {
      success: true,
      status: syncResult.status,
      message:
        syncResult.status === "active"
          ? "Pro subscription activated!"
          : `Subscription status: ${syncResult.status}`,
    };
  }),
});
