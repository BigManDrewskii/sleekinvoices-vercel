import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const productsRouter = router({
  list: protectedProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await db.getProductsByUserId(
        ctx.user.id,
        input?.includeInactive
      );
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getProductById(input.id, ctx.user.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        rate: z.string(), // String for decimal precision
        unit: z.string().max(50).optional(),
        category: z.string().max(100).optional(),
        sku: z.string().max(100).optional(),
        taxable: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createProduct({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).nullable().optional(),
        rate: z.string().optional(),
        unit: z.string().max(50).nullable().optional(),
        category: z.string().max(100).nullable().optional(),
        sku: z.string().max(100).nullable().optional(),
        taxable: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateProduct(id, ctx.user.id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteProduct(input.id, ctx.user.id);
      return { success: true };
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      return await db.searchProducts(ctx.user.id, input.query);
    }),

  incrementUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.incrementProductUsage(input.id, ctx.user.id);
      return { success: true };
    }),
});