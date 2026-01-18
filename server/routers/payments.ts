import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const paymentsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        amount: z.string(),
        currency: z.string().default("USD"),
        paymentMethod: z.enum([
          "stripe",
          "manual",
          "bank_transfer",
          "check",
          "cash",
          "crypto",
        ]),
        paymentDate: z.date(),
        receivedDate: z.date().optional(),
        notes: z.string().optional(),
        // Crypto payment fields
        cryptoAmount: z.string().optional(),
        cryptoCurrency: z.string().max(10).optional(), // BTC, ETH, USDT, etc.
        cryptoNetwork: z.string().max(20).optional(), // mainnet, polygon, arbitrum, etc.
        cryptoTxHash: z.string().max(100).optional(), // Transaction hash
        cryptoWalletAddress: z.string().max(100).optional(), // Receiving wallet
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the payment
      const payment = await db.createPayment({
        ...input,
        userId: ctx.user.id,
        status: "completed",
      });

      // Check payment status and update invoice if fully paid
      const paymentStatus = await db.getInvoicePaymentStatus(input.invoiceId);

      console.log(
        `[Payment] Invoice ${input.invoiceId} payment status:`,
        paymentStatus
      );

      if (paymentStatus.status === "paid") {
        // Update invoice status to paid
        await db.updateInvoice(input.invoiceId, ctx.user.id, {
          status: "paid",
          amountPaid: paymentStatus.totalPaid.toString(),
        });
        console.log(`[Payment] Invoice ${input.invoiceId} marked as paid`);

        // ============================================================================
        // AUTOMATIC QUICKBOOKS SYNC ON PAYMENT
        // Sync invoice to QuickBooks when marked as paid to update payment status
        // ============================================================================
        try {
          const { getConnectionStatus, syncInvoiceToQB } = await import(
            "../quickbooks"
          );
          const qbStatus = await getConnectionStatus(ctx.user.id);
          if (qbStatus.connected) {
            // Fire and forget - don't block payment recording on QB sync
            syncInvoiceToQB(ctx.user.id, input.invoiceId).catch(err => {
              console.error(
                "[QuickBooks] Auto-sync on payment failed for invoice",
                input.invoiceId,
                err
              );
            });
          }
        } catch (err) {
          console.error("[QuickBooks] Auto-sync on payment error:", err);
        }
      } else if (paymentStatus.status === "partial") {
        // Update amount paid but keep status as sent
        await db.updateInvoice(input.invoiceId, ctx.user.id, {
          amountPaid: paymentStatus.totalPaid.toString(),
        });
        console.log(
          `[Payment] Invoice ${input.invoiceId} partially paid: $${paymentStatus.totalPaid}`
        );
      }

      return payment;
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        paymentMethod: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await db.getPaymentsByUser(ctx.user.id, input);
    }),

  getByInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getPaymentsByInvoice(input.invoiceId);
    }),

  // Get payment summary for an invoice (total, paid, remaining)
  getSummary: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getInvoicePaymentSummary(input.invoiceId, ctx.user.id);
    }),

  // Record a partial payment
  recordPartial: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        amount: z.string(),
        paymentMethod: z.enum([
          "manual",
          "bank_transfer",
          "check",
          "cash",
          "crypto",
        ]),
        paymentDate: z.date(),
        notes: z.string().optional(),
        cryptoCurrency: z.string().max(10).optional(),
        cryptoNetwork: z.string().max(20).optional(),
        cryptoTxHash: z.string().max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.recordPartialPayment(
        input.invoiceId,
        ctx.user.id,
        input
      );
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return await db.getPaymentStats(ctx.user.id);
  }),

  delete: protectedProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deletePayment(input.paymentId);
      return { success: true };
    }),
});