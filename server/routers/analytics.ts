import { z } from "zod";
import {
  protectedProcedure,
  router,
} from "../_core/trpc";
import * as db from "../db";

export const analyticsRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return await db.getInvoiceStats(ctx.user.id);
  }),

  getMonthlyRevenue: protectedProcedure
    .input(z.object({ months: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      return await db.getMonthlyRevenue(ctx.user.id, input.months);
    }),

  getAgingReport: protectedProcedure.query(async ({ ctx }) => {
    return await db.getAgingReport(ctx.user.id);
  }),

  getClientProfitability: protectedProcedure.query(async ({ ctx }) => {
    return await db.getClientProfitability(ctx.user.id);
  }),

  getTopClients: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }).optional())
    .query(async ({ ctx, input }) => {
      return await db.getTopClientsByRevenue(ctx.user.id, input?.limit ?? 5);
    }),

  getCashFlowProjection: protectedProcedure
    .input(z.object({ months: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      return await db.getCashFlowProjection(ctx.user.id, input.months);
    }),

  getRevenueVsExpenses: protectedProcedure
    .input(z.object({ year: z.number().default(new Date().getFullYear()) }))
    .query(async ({ ctx, input }) => {
      return await db.getRevenueVsExpensesByMonth(ctx.user.id, input.year);
    }),
});