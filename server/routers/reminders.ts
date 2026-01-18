import { z } from "zod";
import { router, protectedProcedure, TRPCError } from "../_core/trpc";
import * as db from "../db";
import { sendReminderEmail } from "../email";

export const remindersRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const settings = await db.getReminderSettings(ctx.user.id);
    if (!settings) {
      // Return default settings
      return {
        enabled: true,
        intervals: [3, 7, 14],
        emailSubject: null, // Will use default subject
        emailTemplate: null, // Will use DEFAULT_REMINDER_TEMPLATE
        ccEmail: null,
      };
    }
    return {
      enabled: settings.enabled === 1,
      intervals: JSON.parse(settings.intervals),
      emailSubject: settings.emailSubject,
      emailTemplate: settings.emailTemplate,
      ccEmail: settings.ccEmail,
    };
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean(),
        intervals: z.array(z.number()),
        emailSubject: z
          .string()
          .min(1)
          .default("Payment Reminder - Invoice {{invoiceNumber}}"),
        emailTemplate: z.string().optional(),
        ccEmail: z.string().email().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertReminderSettings(ctx.user.id, input);
      return { success: true };
    }),

  sendManual: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get invoice
      const invoice = await db.getInvoiceById(input.invoiceId, ctx.user.id);
      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Get client
      const client = await db.getClientById(invoice.clientId, ctx.user.id);
      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Calculate days overdue
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
      if (!dueDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice has no due date",
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice is not overdue yet",
        });
      }

      // Get reminder settings
      const settings = await db.getReminderSettings(ctx.user.id);

      // Send reminder
      const result = await sendReminderEmail({
        invoice,
        client,
        user: ctx.user,
        daysOverdue,
        template: settings?.emailTemplate,
        ccEmail: settings?.ccEmail || undefined,
      });

      // Log the reminder
      await db.logReminderSent({
        invoiceId: invoice.id,
        userId: ctx.user.id,
        daysOverdue,
        recipientEmail: client.email || "N/A",
        status: result.success ? "sent" : "failed",
        errorMessage: result.error,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || "Failed to send reminder",
        });
      }

      return { success: true, messageId: result.messageId };
    }),

  getLogs: protectedProcedure
    .input(z.object({ invoiceId: z.number() }).optional())
    .query(async ({ ctx, input }) => {
      if (!input?.invoiceId) {
        // Return all logs for user if no invoiceId provided
        return await db.getAllReminderLogs(ctx.user.id);
      }
      // Verify invoice belongs to user
      const invoice = await db.getInvoiceById(input.invoiceId, ctx.user.id);
      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }
      return await db.getReminderLogs(input.invoiceId);
    }),
});