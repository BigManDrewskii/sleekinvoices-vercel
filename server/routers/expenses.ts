import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const expensesRouter = router({
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getExpenseCategoriesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          color: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createExpenseCategory({
          userId: ctx.user.id,
          ...input,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteExpenseCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});
