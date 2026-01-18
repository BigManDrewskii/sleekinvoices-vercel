import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const batchTemplatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getBatchInvoiceTemplates(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getBatchInvoiceTemplateById(input.id, ctx.user.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        dueInDays: z.number().min(0).max(365).default(30),
        currency: z.string().default("USD"),
        taxRate: z.string().default("0"),
        invoiceTemplateId: z.number().optional(),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
        frequency: z
          .enum(["one-time", "weekly", "monthly", "quarterly", "yearly"])
          .default("monthly"),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.string(),
            rate: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { lineItems, ...templateData } = input;
      return await db.createBatchInvoiceTemplate(
        { ...templateData, userId: ctx.user.id },
        lineItems
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().nullable().optional(),
        dueInDays: z.number().min(0).max(365).optional(),
        currency: z.string().optional(),
        taxRate: z.string().optional(),
        invoiceTemplateId: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
        paymentTerms: z.string().nullable().optional(),
        frequency: z
          .enum(["one-time", "weekly", "monthly", "quarterly", "yearly"])
          .optional(),
        lineItems: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.string(),
              rate: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, lineItems, ...data } = input;
      await db.updateBatchInvoiceTemplate(id, ctx.user.id, data, lineItems);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteBatchInvoiceTemplate(input.id, ctx.user.id);
      return { success: true };
    }),

  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.incrementBatchTemplateUsage(input.id, ctx.user.id);
      return { success: true };
    }),
});