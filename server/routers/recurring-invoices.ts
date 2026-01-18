import {
  protectedProcedure,
  router,
  TRPCError,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const recurringInvoicesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getRecurringInvoicesByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const recurring = await db.getRecurringInvoiceById(
        input.id,
        ctx.user.id
      );
      if (!recurring) return null;

      const lineItems = await db.getRecurringInvoiceLineItems(input.id);
      const client = await db.getClientById(recurring.clientId, ctx.user.id);

      return { recurring, lineItems, client };
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        frequency: z.enum(["weekly", "monthly", "yearly"]),
        startDate: z.date(),
        endDate: z.date().optional(),
        invoiceNumberPrefix: z.string(),
        lineItems: z.array(
          z.object({
            description: z.string(),
            quantity: z.number(),
            rate: z.number(),
          })
        ),
        taxRate: z.number().default(0),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().default(0),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { lineItems, ...recurringData } = input;

      // Calculate next invoice date based on frequency
      const nextDate = new Date(input.startDate);
      if (input.frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (input.frequency === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (input.frequency === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      // Create recurring invoice
      const recurring = await db.createRecurringInvoice({
        userId: ctx.user.id,
        ...recurringData,
        nextInvoiceDate: nextDate,
        taxRate: input.taxRate.toString(),
        discountValue: input.discountValue.toString(),
      });

      // Create line items
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i]!;
        await db.createRecurringInvoiceLineItem({
          recurringInvoiceId: recurring.id,
          description: item.description,
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          sortOrder: i,
        });
      }

      return recurring;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().optional(),
        frequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        invoiceNumberPrefix: z.string().optional(),
        lineItems: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.number(),
              rate: z.number(),
            })
          )
          .optional(),
        taxRate: z.number().optional(),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().optional(),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, lineItems, ...updateData } = input;

      // Check if recurring invoice exists
      const existing = await db.getRecurringInvoiceById(id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recurring invoice not found",
        });
      }

      // Convert number fields to strings
      const dbUpdateData: Record<string, unknown> = { ...updateData };
      if (dbUpdateData.taxRate !== undefined)
        dbUpdateData.taxRate = dbUpdateData.taxRate!.toString();
      if (dbUpdateData.discountValue !== undefined)
        dbUpdateData.discountValue = dbUpdateData.discountValue!.toString();

      await db.updateRecurringInvoice(id, ctx.user.id, dbUpdateData as any);

      // Update line items if provided
      if (lineItems) {
        await db.deleteRecurringInvoiceLineItems(id);
        for (let i = 0; i < lineItems.length; i++) {
          const item = lineItems[i]!;
          await db.createRecurringInvoiceLineItem({
            recurringInvoiceId: id,
            description: item.description,
            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
            sortOrder: i,
          });
        }
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteRecurringInvoice(input.id, ctx.user.id);
      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateRecurringInvoice(input.id, ctx.user.id, {
        isActive: input.isActive,
      });
      return { success: true };
    }),

  // Manual trigger for testing (admin only)
  triggerGeneration: protectedProcedure.mutation(async ({ ctx }) => {
    // Only allow admin users to manually trigger
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can manually trigger invoice generation");
    }

    const { generateRecurringInvoices } = await import(
      "../jobs/generateRecurringInvoices"
    );
    await generateRecurringInvoices();

    return { success: true, message: "Invoice generation triggered" };
  }),

  // Get generation logs for a recurring invoice
  getGenerationLogs: protectedProcedure
    .input(z.object({ recurringInvoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getGenerationLogsByRecurringId(
        input.recurringInvoiceId
      );
    }),
});