import {
  protectedProcedure,
  router,
  TRPCError,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const estimatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Update expired estimates first
    await db.updateExpiredEstimates(ctx.user.id);
    return await db.getEstimatesByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getEstimateById(input.id, ctx.user.id);
    }),

  generateNumber: protectedProcedure.query(async ({ ctx }) => {
    return await db.generateEstimateNumber(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        estimateNumber: z.string(),
        title: z.string().optional(),
        currency: z.string().default("USD"),
        subtotal: z.string(),
        taxRate: z.string().default("0"),
        taxAmount: z.string().default("0"),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.string().default("0"),
        discountAmount: z.string().default("0"),
        total: z.string(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        issueDate: z.date(),
        validUntil: z.date(),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.string(),
            rate: z.string(),
            amount: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { lineItems, ...estimateData } = input;

      // Create estimate
      const estimate = await db.createEstimate({
        userId: ctx.user.id,
        ...estimateData,
      });

      // Create line items
      if (lineItems.length > 0) {
        await db.createEstimateLineItems(
          lineItems.map((item, index) => ({
            estimateId: estimate.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            sortOrder: index,
          }))
        );
      }

      return estimate;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().optional(),
        title: z.string().nullable().optional(),
        status: z
          .enum([
            "draft",
            "sent",
            "viewed",
            "accepted",
            "rejected",
            "expired",
            "converted",
          ])
          .optional(),
        currency: z.string().optional(),
        subtotal: z.string().optional(),
        taxRate: z.string().optional(),
        taxAmount: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.string().optional(),
        discountAmount: z.string().optional(),
        total: z.string().optional(),
        notes: z.string().nullable().optional(),
        terms: z.string().nullable().optional(),
        issueDate: z.date().optional(),
        validUntil: z.date().optional(),
        lineItems: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.string(),
              rate: z.string(),
              amount: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, lineItems, ...data } = input;

      // Check if estimate exists
      const existing = await db.getEstimateById(id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estimate not found",
        });
      }

      // Update estimate
      await db.updateEstimate(id, ctx.user.id, data);

      // Update line items if provided
      if (lineItems) {
        await db.deleteEstimateLineItems(id);
        if (lineItems.length > 0) {
          await db.createEstimateLineItems(
            lineItems.map((item, index) => ({
              estimateId: id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              sortOrder: index,
            }))
          );
        }
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteEstimate(input.id, ctx.user.id);
      return { success: true };
    }),

  convertToInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await db.convertEstimateToInvoice(input.id, ctx.user.id);
    }),

  markAsSent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateEstimate(input.id, ctx.user.id, {
        status: "sent",
        sentAt: new Date(),
      });
      return { success: true };
    }),

  markAsAccepted: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateEstimate(input.id, ctx.user.id, {
        status: "accepted",
        acceptedAt: new Date(),
      });
      return { success: true };
    }),

  markAsRejected: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateEstimate(input.id, ctx.user.id, {
        status: "rejected",
        rejectedAt: new Date(),
      });
      return { success: true };
    }),
});