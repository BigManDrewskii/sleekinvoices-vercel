import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
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

  list: protectedProcedure
    .input(
      z
        .object({
          categoryId: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          isBillable: z.boolean().optional(),
          clientId: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return await db.getExpensesByUserId(ctx.user.id, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getExpenseById(input.id, ctx.user.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        categoryId: z.number(),
        amount: z.number(),
        date: z.date(),
        description: z.string(),
        vendor: z.string().optional(),
        paymentMethod: z
          .enum([
            "cash",
            "credit_card",
            "debit_card",
            "bank_transfer",
            "check",
            "other",
          ])
          .optional(),
        taxAmount: z.number().optional(),
        receiptUrl: z.string().optional(),
        receiptKey: z.string().optional(),
        isBillable: z.boolean().optional(),
        clientId: z.number().optional(),
        invoiceId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { amount, taxAmount, ...rest } = input;
      return await db.createExpense({
        userId: ctx.user.id,
        amount: amount.toString(),
        taxAmount: taxAmount?.toString(),
        ...rest,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        amount: z.number().optional(),
        date: z.date().optional(),
        description: z.string().optional(),
        vendor: z.string().optional(),
        paymentMethod: z
          .enum([
            "cash",
            "credit_card",
            "debit_card",
            "bank_transfer",
            "check",
            "other",
          ])
          .optional(),
        taxAmount: z.number().optional(),
        receiptUrl: z.string().optional(),
        receiptKey: z.string().optional(),
        isBillable: z.boolean().optional(),
        clientId: z.number().optional(),
        invoiceId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount, taxAmount, ...updates } = input;

      // Check if expense exists
      const existing = await db.getExpenseById(id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense not found",
        });
      }

      const dbUpdates: Record<string, unknown> = { ...updates };
      if (amount !== undefined) dbUpdates.amount = amount.toString();
      if (taxAmount !== undefined) dbUpdates.taxAmount = taxAmount.toString();

      await db.updateExpense(id, ctx.user.id, dbUpdates as any);
      return { success: true };
    }),

  uploadReceipt: protectedProcedure
    .input(
      z.object({
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { storagePut } = await import("../storage");

      // Decode base64
      const buffer = Buffer.from(input.fileData, "base64");

      // Generate unique key
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `receipts/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.fileName}`;

      // Upload to S3
      const { url, key } = await storagePut(
        fileKey,
        buffer,
        input.contentType
      );

      return { url, key };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get expense to check for receipt
      const expense = await db.getExpenseById(input.id, ctx.user.id);

      // Delete receipt from S3 if exists
      if (expense?.receiptKey) {
        const { storageDelete } = await import("../storage");
        try {
          await storageDelete(expense.receiptKey);
        } catch (error) {
          console.error("Failed to delete receipt from S3:", error);
          // Continue with expense deletion even if S3 delete fails
        }
      }

      await db.deleteExpense(input.id, ctx.user.id);
      return { success: true };
    }),

  stats: protectedProcedure
    .input(z.object({ months: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await db.getExpenseStats(ctx.user.id, input?.months);
    }),

  getBillableUnlinked: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return await db.getBillableUnlinkedExpenses(
        ctx.user.id,
        input?.clientId
      );
    }),

  linkToInvoice: protectedProcedure
    .input(
      z.object({
        expenseId: z.number(),
        invoiceId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.linkExpenseToInvoice(
        input.expenseId,
        input.invoiceId,
        ctx.user.id
      );
    }),
});