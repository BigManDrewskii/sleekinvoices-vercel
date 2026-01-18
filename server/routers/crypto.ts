import {
  publicProcedure,
  protectedProcedure,
  router,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import * as nowpayments from "../lib/nowpayments";
import { invoices } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getCryptoPrice, isPro } from "../../shared/subscription.js";

export const cryptoRouter = router({
  // NOWPayments Crypto Payment Gateway
  getStatus: publicProcedure.query(async () => {
    return await nowpayments.getApiStatus();
  }),

  // Get available cryptocurrencies
  getCurrencies: publicProcedure.query(async () => {
    const currencies = await nowpayments.getAvailableCurrencies();
    const popular = nowpayments.getPopularCurrencies();
    return {
      all: currencies,
      popular: popular.filter(c => currencies.includes(c)),
    };
  }),

  // Get estimated crypto amount for a given fiat amount
  getEstimate: publicProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        fiatCurrency: z.string().default("usd"),
        cryptoCurrency: z.string(),
      })
    )
    .query(async ({ input }) => {
      const estimate = await nowpayments.getEstimatedPrice(
        input.amount,
        input.fiatCurrency,
        input.cryptoCurrency
      );
      return {
        fiatAmount: input.amount,
        fiatCurrency: input.fiatCurrency,
        cryptoAmount: estimate,
        cryptoCurrency: input.cryptoCurrency,
      };
    }),

  // Get minimum payment amount for a currency
  getMinAmount: publicProcedure
    .input(
      z.object({
        fiatCurrency: z.string().default("usd"),
        cryptoCurrency: z.string(),
      })
    )
    .query(async ({ input }) => {
      const minAmount = await nowpayments.getMinimumPaymentAmount(
        input.fiatCurrency,
        input.cryptoCurrency
      );
      return { minAmount };
    }),

  // Create a crypto payment for an invoice
  createPayment: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        cryptoCurrency: z.string().optional(), // Optional - if not provided, customer chooses on NOWPayments checkout
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the invoice
      const invoice = await db.getInvoiceById(input.invoiceId, ctx.user.id);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Calculate remaining amount to pay
      const total = parseFloat(invoice.total);
      const paid = parseFloat(invoice.amountPaid || "0");
      const remaining = total - paid;

      if (remaining <= 0) {
        throw new Error("Invoice is already fully paid");
      }

      // Get the base URL for callbacks
      const baseUrl =
        process.env.VITE_APP_URL ||
        `https://${process.env.VITE_APP_ID}.manus.space`;

      // Create NOWPayments invoice
      // If cryptoCurrency is not provided, NOWPayments will show a currency selector
      const payment = await nowpayments.createInvoice({
        priceAmount: remaining,
        priceCurrency: invoice.currency?.toLowerCase() || "usd",
        payCurrency: input.cryptoCurrency?.toLowerCase(), // Optional - undefined lets customer choose
        orderId: `INV-${invoice.id}-${Date.now()}`,
        orderDescription: `Payment for Invoice ${invoice.invoiceNumber}`,
        ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
        successUrl: `${baseUrl}/invoices/${invoice.id}?payment=success`,
        cancelUrl: `${baseUrl}/invoices/${invoice.id}?payment=cancelled`,
        isFixedRate: true,
      });

      // Store the payment reference in the database
      await db.updateInvoice(invoice.id, ctx.user.id, {
        cryptoPaymentId: payment.id,
        cryptoCurrency: input.cryptoCurrency?.toUpperCase() || "MULTI", // 'MULTI' indicates customer will choose
        cryptoPaymentUrl: payment.invoice_url,
      });

      return {
        paymentId: payment.id,
        invoiceUrl: payment.invoice_url,
        cryptoCurrency: input.cryptoCurrency || "MULTI",
        priceAmount: remaining,
        priceCurrency: invoice.currency || "USD",
      };
    }),

  // Check payment status
  getPaymentStatus: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const status = await nowpayments.getPaymentStatus(input.paymentId);
      return {
        paymentId: status.payment_id,
        status: status.payment_status,
        payAddress: status.pay_address,
        payAmount: status.pay_amount,
        actuallyPaid: status.actually_paid,
        payCurrency: status.pay_currency,
        isComplete: nowpayments.isPaymentComplete(status.payment_status),
        isPending: nowpayments.isPaymentPending(status.payment_status),
        isFailed: nowpayments.isPaymentFailed(status.payment_status),
      };
    }),

  // Format currency name for display
  formatCurrency: publicProcedure
    .input(z.object({ currency: z.string() }))
    .query(({ input }) => {
      return { name: nowpayments.formatCurrencyName(input.currency) };
    }),

  // Create crypto payment for an invoice (public - client initiated)
  createCryptoPayment: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        invoiceId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify access token and get client
      const client = await db.getClientByAccessToken(input.accessToken);
      if (!client) {
        throw new Error("Invalid or expired access token");
      }

      // Get the invoice and verify it belongs to this client
      const invoice = await db.getInvoiceById(input.invoiceId, client.userId);
      if (!invoice || invoice.clientId !== client.id) {
        throw new Error("Invoice not found");
      }

      // Check invoice status - only allow payment for unpaid invoices
      if (invoice.status === "paid") {
        throw new Error("Invoice is already paid");
      }
      if (invoice.status === "draft") {
        throw new Error("Cannot pay a draft invoice");
      }
      if (invoice.status === "canceled") {
        throw new Error("Cannot pay a cancelled invoice");
      }

      // Calculate remaining amount to pay
      const total = parseFloat(invoice.total);
      const paid = parseFloat(invoice.amountPaid || "0");
      const remaining = total - paid;

      if (remaining <= 0) {
        throw new Error("Invoice is already fully paid");
      }

      // Get the base URL for callbacks
      const baseUrl =
        process.env.VITE_APP_URL ||
        `https://${process.env.VITE_APP_ID}.manus.space`;

      // Create NOWPayments invoice - let customer choose currency on checkout
      const payment = await nowpayments.createInvoice({
        priceAmount: remaining,
        priceCurrency: invoice.currency?.toLowerCase() || "usd",
        // Don't specify payCurrency - customer will choose on NOWPayments checkout
        orderId: `INV-${invoice.id}-${Date.now()}`,
        orderDescription: `Payment for Invoice ${invoice.invoiceNumber}`,
        ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
        successUrl: `${baseUrl}/portal/${input.accessToken}?payment=success&invoiceId=${invoice.id}`,
        cancelUrl: `${baseUrl}/portal/${input.accessToken}?payment=cancelled&invoiceId=${invoice.id}`,
        isFixedRate: true,
      });

      // Update invoice with crypto payment info
      // Note: We need to update without userId check since this is client-initiated
      const dbInstance = await db.getDb();
      if (dbInstance) {
        await dbInstance
          .update(invoices)
          .set({
            cryptoPaymentId: payment.id,
            cryptoCurrency: "MULTI", // Customer will choose
            cryptoPaymentUrl: payment.invoice_url,
          })
          .where(eq(invoices.id, invoice.id));
      }

      return {
        paymentId: payment.id,
        invoiceUrl: payment.invoice_url,
        priceAmount: remaining,
        priceCurrency: invoice.currency || "USD",
      };
    }),

  // Get subscription payment history
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

  // Extend an existing Pro subscription with crypto payment
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
});