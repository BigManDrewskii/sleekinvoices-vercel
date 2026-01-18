import { protectedProcedure, router, TRPCError } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { createPaymentLink } from "../stripe";
import { generateInvoicePDF } from "../pdf";
import { sendInvoiceEmail, sendPaymentReminderEmail } from "../email";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { eq, and, sql } from "drizzle-orm";

export const invoicesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getInvoicesByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const invoice = await db.getInvoiceById(input.id, ctx.user.id);
      if (!invoice) return null;

      const lineItems = await db.getLineItemsByInvoiceId(input.id);
      const client = await db.getClientById(invoice.clientId, ctx.user.id);
      const viewCount = await db.getInvoiceViewCount(input.id);

      return { invoice, lineItems, client, viewCount };
    }),

  getNextNumber: protectedProcedure.query(async ({ ctx }) => {
    return await db.getNextInvoiceNumber(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        invoiceNumber: z.string().max(50),
        status: z.enum(["draft", "sent", "paid", "overdue", "canceled"]),
        issueDate: z.date(),
        dueDate: z.date(),
        lineItems: z.array(
          z.object({
            description: z.string().max(500),
            quantity: z.number(),
            rate: z.number(),
          })
        ),
        taxRate: z.number().default(0),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().default(0),
        notes: z.string().max(5000).optional(),
        paymentTerms: z.string().max(500).optional(),
        expenseIds: z.array(z.number()).optional(),
        templateId: z.number().optional(), // Template to use for this invoice
        currency: z.string().default("USD"), // Invoice currency (fiat or crypto)
      })
    )
    .mutation(async ({ ctx, input }) => {
      // ============================================================================
      // INVOICE LIMIT ENFORCEMENT (Phase 2)
      // Check if user can create invoice based on subscription status and usage
      // Free users: 3 invoices/month | Pro users: unlimited
      // ============================================================================
      const canCreate = await db.canUserCreateInvoice(
        ctx.user.id,
        ctx.user.subscriptionStatus
      );

      if (!canCreate) {
        throw new Error(
          "Monthly invoice limit reached. You have created 3 invoices this month. " +
            "Upgrade to Pro for unlimited invoices at $12/month."
        );
      }

      // Calculate totals
      const subtotal = input.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.rate,
        0
      );

      let discountAmount = 0;
      if (input.discountValue > 0) {
        if (input.discountType === "percentage") {
          discountAmount = (subtotal * input.discountValue) / 100;
        } else {
          discountAmount = input.discountValue;
        }
      }

      const afterDiscount = subtotal - discountAmount;
      const taxAmount = (afterDiscount * input.taxRate) / 100;
      const total = afterDiscount + taxAmount;

      // Create invoice with retry on duplicate key error
      let invoice: Awaited<ReturnType<typeof db.createInvoice>> | undefined =
        undefined;
      let invoiceNumber = input.invoiceNumber;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          invoice = await db.createInvoice({
            userId: ctx.user.id,
            clientId: input.clientId,
            invoiceNumber,
            status: input.status,
            subtotal: subtotal.toString(),
            taxRate: input.taxRate.toString(),
            taxAmount: taxAmount.toString(),
            discountType: input.discountType,
            discountValue: input.discountValue.toString(),
            discountAmount: discountAmount.toString(),
            total: total.toString(),
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            notes: input.notes,
            paymentTerms: input.paymentTerms,
            templateId: input.templateId,
            currency: input.currency,
          });
          break; // Success, exit retry loop
        } catch (err: any) {
          // Check for duplicate key error
          if (
            err.code === "ER_DUP_ENTRY" ||
            err.code === "23505" ||
            err.message?.includes("Duplicate entry")
          ) {
            retries++;
            if (retries >= maxRetries) {
              throw new TRPCError({
                code: "CONFLICT",
                message: `Invoice number "${invoiceNumber}" already exists. Please use a unique invoice number.`,
              });
            }
            // Generate new invoice number and retry
            invoiceNumber = await db.getNextInvoiceNumber(ctx.user.id);
            console.log(
              `[Invoice Create] Duplicate detected, retrying with ${invoiceNumber} (attempt ${retries + 1})`
            );
          } else {
            throw err; // Re-throw non-duplicate errors
          }
        }
      }

      if (!invoice) {
        throw new Error("Failed to create invoice after retries");
      }

      // Create line items
      for (let i = 0; i < input.lineItems.length; i++) {
        const item = input.lineItems[i]!;
        await db.createLineItem({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          amount: (item.quantity * item.rate).toString(),
          sortOrder: i,
        });
      }

      // Link billable expenses to this invoice
      if (input.expenseIds && input.expenseIds.length > 0) {
        for (const expenseId of input.expenseIds) {
          await db.linkExpenseToInvoice(expenseId, invoice.id, ctx.user.id);
        }
      }

      // ============================================================================
      // INCREMENT USAGE COUNTER (Phase 2)
      // Track invoice creation for free tier limit enforcement
      // This runs AFTER successful creation to ensure accurate counting
      // ============================================================================
      await db.incrementInvoiceCount(ctx.user.id);

      // ============================================================================
      // AUTOMATIC QUICKBOOKS SYNC
      // Sync invoice to QuickBooks if connected and invoice is being sent
      // Only sync non-draft invoices to avoid syncing incomplete work
      // ============================================================================
      if (input.status === "sent") {
        try {
          const { getConnectionStatus, syncInvoiceToQB } = await import(
            "../quickbooks"
          );
          const qbStatus = await getConnectionStatus(ctx.user.id);
          if (qbStatus.connected) {
            // Fire and forget - don't block invoice creation on QB sync
            syncInvoiceToQB(ctx.user.id, invoice.id).catch(err => {
              console.error(
                "[QuickBooks] Auto-sync failed for invoice",
                invoice.id,
                err
              );
            });
          }
        } catch (err) {
          // QuickBooks sync failure should not block invoice creation
          console.error("[QuickBooks] Auto-sync error:", err);
        }
      }

      return invoice;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().optional(),
        status: z
          .enum(["draft", "sent", "paid", "overdue", "canceled"])
          .optional(),
        issueDate: z.date().optional(),
        dueDate: z.date().optional(),
        lineItems: z
          .array(
            z.object({
              description: z.string().max(500),
              quantity: z.number(),
              rate: z.number(),
            })
          )
          .optional(),
        taxRate: z.number().optional(),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().optional(),
        notes: z.string().max(5000).optional(),
        paymentTerms: z.string().max(500).optional(),
        templateId: z.number().optional(), // Template to use for this invoice
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, lineItems, ...updateData } = input;

      // Check if invoice exists
      const existingInvoice = await db.getInvoiceById(id, ctx.user.id);
      if (!existingInvoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // If line items are provided, recalculate totals
      if (lineItems) {
        const subtotal = lineItems.reduce(
          (sum, item) => sum + item.quantity * item.rate,
          0
        );

        const discountValue = input.discountValue ?? 0;
        let discountAmount = 0;
        if (discountValue > 0) {
          if (input.discountType === "percentage") {
            discountAmount = (subtotal * discountValue) / 100;
          } else {
            discountAmount = discountValue;
          }
        }

        const afterDiscount = subtotal - discountAmount;
        const taxRate = input.taxRate ?? 0;
        const taxAmount = (afterDiscount * taxRate) / 100;
        const total = afterDiscount + taxAmount;

        await db.updateInvoice(id, ctx.user.id, {
          ...updateData,
          taxRate: input.taxRate?.toString(),
          discountValue: input.discountValue?.toString(),
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          discountAmount: discountAmount.toString(),
          total: total.toString(),
        });

        // Delete old line items and create new ones
        await db.deleteLineItemsByInvoiceId(id);
        for (let i = 0; i < lineItems.length; i++) {
          const item = lineItems[i]!;
          await db.createLineItem({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
            amount: (item.quantity * item.rate).toString(),
            sortOrder: i,
          });
        }
      } else {
        // Convert number fields to strings for database
        const dbUpdateData: Record<string, unknown> = { ...updateData };
        if (dbUpdateData.taxRate !== undefined)
          dbUpdateData.taxRate = dbUpdateData.taxRate!.toString();
        if (dbUpdateData.discountValue !== undefined)
          dbUpdateData.discountValue = dbUpdateData.discountValue!.toString();
        await db.updateInvoice(id, ctx.user.id, dbUpdateData as any);
      }

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteInvoice(input.id, ctx.user.id);
      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) {
        throw new Error("Database not available");
      }

      const { invoices, invoiceLineItems, invoiceCustomFieldValues } =
        await import("../../drizzle/schema");

      // Use transaction for atomicity
      return await database.transaction(async tx => {
        let deletedCount = 0;
        const errors: string[] = [];

        for (const id of input.ids) {
          try {
            // Verify ownership before deletion
            const invoice = await tx
              .select({ id: invoices.id })
              .from(invoices)
              .where(and(eq(invoices.id, id), eq(invoices.userId, ctx.user.id)))
              .limit(1);

            if (!invoice[0]) {
              errors.push(`Invoice ${id}: Not found or access denied`);
              continue;
            }

            // Delete related records first (foreign key relationships)
            await tx
              .delete(invoiceLineItems)
              .where(eq(invoiceLineItems.invoiceId, id));

            await tx
              .delete(invoiceCustomFieldValues)
              .where(eq(invoiceCustomFieldValues.invoiceId, id));

            // Delete the invoice
            await tx
              .delete(invoices)
              .where(
                and(eq(invoices.id, id), eq(invoices.userId, ctx.user.id))
              );

            deletedCount++;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            console.error(`Failed to delete invoice ${id}:`, error);
            errors.push(`Invoice ${id}: ${message}`);
          }
        }

        return { success: true, deletedCount, errors };
      });
    }),

  // Bulk update status for multiple invoices
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        status: z.enum(["draft", "sent", "paid", "overdue", "canceled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) {
        throw new Error("Database not available");
      }

      const { invoices } = await import("../../drizzle/schema");

      // Use transaction for atomicity
      return await database.transaction(async tx => {
        // First, verify all invoices belong to user
        const validInvoices = await tx
          .select({ id: invoices.id })
          .from(invoices)
          .where(
            and(
              eq(invoices.userId, ctx.user.id),
              ...input.ids.map(id => eq(invoices.id, id))
            )
          );

        const validIds = new Set(validInvoices.map(inv => inv.id));
        const invalidIds = input.ids.filter(id => !validIds.has(id));

        if (invalidIds.length > 0) {
          return {
            success: false,
            updatedCount: 0,
            errors: invalidIds.map(
              id => `Invoice ${id}: Not found or access denied`
            ),
          };
        }

        // Update all valid invoices in transaction
        await tx
          .update(invoices)
          .set({
            status: input.status,
            paidAt: input.status === "paid" ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(invoices.userId, ctx.user.id),
              ...input.ids.map(id => eq(invoices.id, id))
            )
          );

        return {
          success: true,
          updatedCount: input.ids.length,
          errors: [],
        };
      });
    }),

  // Bulk send emails for multiple invoices
  bulkSendEmail: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      let sentCount = 0;
      const errors: string[] = [];

      for (const id of input.ids) {
        try {
          const invoice = await db.getInvoiceById(id, ctx.user.id);
          if (!invoice) {
            errors.push(`Invoice ${id}: Not found`);
            continue;
          }

          const lineItems = await db.getLineItemsByInvoiceId(id);
          const client = await db.getClientById(invoice.clientId, ctx.user.id);
          if (!client) {
            errors.push(`Invoice ${id}: Client not found`);
            continue;
          }

          if (!client.email) {
            errors.push(
              `Invoice ${invoice.invoiceNumber}: Client has no email`
            );
            continue;
          }

          // Get user's default template
          const template = await db.getDefaultTemplate(ctx.user.id);

          // Generate PDF
          const pdfBuffer = await generateInvoicePDF({
            invoice,
            client,
            lineItems,
            user: ctx.user,
            template,
          });

          // Send email
          const result = await sendInvoiceEmail({
            invoice,
            client,
            user: ctx.user,
            pdfBuffer,
            paymentLinkUrl: invoice.stripePaymentLinkUrl || undefined,
          });

          if (result.success) {
            // Update invoice status to 'sent' if it was draft
            if (invoice.status === "draft") {
              await db.updateInvoice(id, ctx.user.id, {
                status: "sent",
                sentAt: new Date(),
              });
            }

            // Log email
            await db.logEmail({
              userId: ctx.user.id,
              invoiceId: invoice.id,
              recipientEmail: client.email,
              subject: `Invoice ${invoice.invoiceNumber}`,
              emailType: "invoice",
              success: true,
            });

            sentCount++;
          } else {
            errors.push(`Invoice ${invoice.invoiceNumber}: ${result.error}`);
          }
        } catch (error: any) {
          console.error(`Failed to send invoice ${id}:`, error);
          errors.push(`Invoice ${id}: ${error.message}`);
        }
      }

      return { success: true, sentCount, errors };
    }),

  // Bulk create payment links for multiple invoices
  bulkCreatePaymentLinks: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      let createdCount = 0;
      const errors: string[] = [];
      const links: {
        invoiceId: number;
        invoiceNumber: string;
        url: string;
      }[] = [];

      for (const id of input.ids) {
        try {
          const invoice = await db.getInvoiceById(id, ctx.user.id);
          if (!invoice) {
            errors.push(`Invoice ${id}: Not found`);
            continue;
          }

          // Skip if already has payment link
          if (invoice.stripePaymentLinkUrl) {
            links.push({
              invoiceId: id,
              invoiceNumber: invoice.invoiceNumber,
              url: invoice.stripePaymentLinkUrl,
            });
            continue;
          }

          const { paymentLinkId, url } = await createPaymentLink({
            amount: Number(invoice.total),
            description: `Invoice ${invoice.invoiceNumber}`,
            metadata: {
              invoiceId: invoice.id.toString(),
              userId: ctx.user.id.toString(),
            },
          });

          await db.updateInvoice(id, ctx.user.id, {
            stripePaymentLinkId: paymentLinkId,
            stripePaymentLinkUrl: url,
          });

          links.push({
            invoiceId: id,
            invoiceNumber: invoice.invoiceNumber,
            url,
          });
          createdCount++;
        } catch (error: any) {
          console.error(
            `Failed to create payment link for invoice ${id}:`,
            error
          );
          errors.push(`Invoice ${id}: ${error.message}`);
        }
      }

      return { success: true, createdCount, links, errors };
    }),

  generatePDF: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await db.getInvoiceById(input.id, ctx.user.id);
      if (!invoice) throw new Error("Invoice not found");

      const lineItems = await db.getLineItemsByInvoiceId(input.id);
      const client = await db.getClientById(invoice.clientId, ctx.user.id);
      if (!client) throw new Error("Client not found");

      // Get user's default template
      const template = await db.getDefaultTemplate(ctx.user.id);

      try {
        const pdfBuffer = await generateInvoicePDF({
          invoice,
          client,
          lineItems,
          user: ctx.user,
          template,
        });

        // Upload to S3
        const fileKey = `invoices/${ctx.user.id}/${invoice.invoiceNumber}-${nanoid()}.pdf`;
        const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

        return { url };
      } catch (error: unknown) {
        console.error(
          `Failed to generate PDF for invoice ${invoice.invoiceNumber}:`,
          error
        );
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(`PDF generation failed: ${errorMessage}`);
      }
    }),

  createPaymentLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await db.getInvoiceById(input.id, ctx.user.id);
      if (!invoice) throw new Error("Invoice not found");

      const { paymentLinkId, url } = await createPaymentLink({
        amount: Number(invoice.total),
        description: `Invoice ${invoice.invoiceNumber}`,
        metadata: {
          invoiceId: invoice.id.toString(),
          userId: ctx.user.id.toString(),
        },
      });

      await db.updateInvoice(input.id, ctx.user.id, {
        stripePaymentLinkId: paymentLinkId,
        stripePaymentLinkUrl: url,
      });

      return { url };
    }),

  sendEmail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await db.getInvoiceById(input.id, ctx.user.id);
      if (!invoice) throw new Error("Invoice not found");

      const lineItems = await db.getLineItemsByInvoiceId(input.id);
      const client = await db.getClientById(invoice.clientId, ctx.user.id);
      if (!client) throw new Error("Client not found");

      // Get user's default template
      const template = await db.getDefaultTemplate(ctx.user.id);

      try {
        // Generate PDF
        const pdfBuffer = await generateInvoicePDF({
          invoice,
          client,
          lineItems,
          user: ctx.user,
          template,
        });

        // Send email
        const result = await sendInvoiceEmail({
          invoice,
          client,
          user: ctx.user,
          pdfBuffer,
          paymentLinkUrl: invoice.stripePaymentLinkUrl || undefined,
        });

        // Always update invoice status to 'sent' when user clicks send
        // This ensures status updates even if email delivery fails
        if (invoice.status === "draft") {
          await db.updateInvoice(input.id, ctx.user.id, {
            status: "sent",
            sentAt: new Date(),
          });

          // ============================================================================
          // AUTOMATIC QUICKBOOKS SYNC ON SEND
          // Sync invoice to QuickBooks when first sent (status changes from draft)
          // ============================================================================
          try {
            const { getConnectionStatus, syncInvoiceToQB } = await import(
              "../quickbooks"
            );
            const qbStatus = await getConnectionStatus(ctx.user.id);
            if (qbStatus.connected) {
              // Fire and forget - don't block email sending on QB sync
              syncInvoiceToQB(ctx.user.id, input.id).catch(err => {
                console.error(
                  "[QuickBooks] Auto-sync on send failed for invoice",
                  input.id,
                  err
                );
              });
            }
          } catch (err) {
            console.error("[QuickBooks] Auto-sync on send error:", err);
          }
        }

        // Log email result
        await db.logEmail({
          userId: ctx.user.id,
          invoiceId: invoice.id,
          recipientEmail: client.email!,
          subject: `Invoice ${invoice.invoiceNumber}`,
          emailType: "invoice",
          success: result.success,
          errorMessage: result.error,
        });

        return {
          success: true, // Status updated successfully
          emailSent: result.success, // Separate flag for email delivery
          error: result.error,
        };
      } catch (error: unknown) {
        console.error(
          `Failed to generate PDF or send email for invoice ${invoice.invoiceNumber}:`,
          error
        );
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to send invoice: ${errorMessage}`);
      }
    }),

  sendReminder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await db.getInvoiceById(input.id, ctx.user.id);
      if (!invoice) throw new Error("Invoice not found");

      const client = await db.getClientById(invoice.clientId, ctx.user.id);
      if (!client) throw new Error("Client not found");

      const lineItems = await db.getLineItemsByInvoiceId(input.id);

      // Get user's default template
      const template = await db.getDefaultTemplate(ctx.user.id);

      // Generate PDF for attachment
      const pdfBuffer = await generateInvoicePDF({
        invoice,
        client,
        lineItems,
        user: ctx.user,
        template,
      });

      // Send reminder email
      const result = await sendPaymentReminderEmail({
        invoice,
        client,
        user: ctx.user,
        pdfBuffer,
        paymentLinkUrl: invoice.stripePaymentLinkUrl || undefined,
      });

      // Log email
      await db.logEmail({
        userId: ctx.user.id,
        invoiceId: invoice.id,
        recipientEmail: client.email!,
        subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
        emailType: "reminder",
        success: result.success,
        errorMessage: result.error,
      });

      return result;
    }),

  // Duplicate an existing invoice
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get the original invoice
      const originalInvoice = await db.getInvoiceById(input.id, ctx.user.id);
      if (!originalInvoice) throw new Error("Invoice not found");

      // Check if user can create invoice (limit enforcement)
      const canCreate = await db.canUserCreateInvoice(
        ctx.user.id,
        ctx.user.subscriptionStatus
      );

      if (!canCreate) {
        throw new Error(
          "Monthly invoice limit reached. You have created 3 invoices this month. " +
            "Upgrade to Pro for unlimited invoices at $12/month."
        );
      }

      // Get line items from original invoice
      const originalLineItems = await db.getLineItemsByInvoiceId(input.id);

      // Generate new invoice number
      const newInvoiceNumber = await db.getNextInvoiceNumber(ctx.user.id);

      // Calculate new dates (issue date = today, due date = today + original difference)
      const originalIssueDateMs = new Date(originalInvoice.issueDate).getTime();
      const originalDueDateMs = new Date(originalInvoice.dueDate).getTime();
      const daysDifference = Math.ceil(
        (originalDueDateMs - originalIssueDateMs) / (1000 * 60 * 60 * 24)
      );

      const newIssueDate = new Date();
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + daysDifference);

      // Create the duplicated invoice
      const newInvoice = await db.createInvoice({
        userId: ctx.user.id,
        clientId: originalInvoice.clientId,
        invoiceNumber: newInvoiceNumber,
        status: "draft", // Always start as draft
        subtotal: originalInvoice.subtotal,
        taxRate: originalInvoice.taxRate,
        taxAmount: originalInvoice.taxAmount,
        discountType: originalInvoice.discountType,
        discountValue: originalInvoice.discountValue,
        discountAmount: originalInvoice.discountAmount,
        total: originalInvoice.total,
        amountPaid: "0",
        issueDate: newIssueDate,
        dueDate: newDueDate,
        notes: originalInvoice.notes,
        paymentTerms: originalInvoice.paymentTerms,
        templateId: originalInvoice.templateId,
        currency: originalInvoice.currency,
      });

      // Duplicate line items
      for (let i = 0; i < originalLineItems.length; i++) {
        const item = originalLineItems[i]!;
        await db.createLineItem({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          sortOrder: item.sortOrder,
        });
      }

      // Increment usage counter
      await db.incrementInvoiceCount(ctx.user.id);

      return newInvoice;
    }),

  getAnalytics: protectedProcedure
    .input(
      z.object({
        timeRange: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
      })
    )
    .query(async ({ ctx, input }) => {
      // Map timeRange to days for comparison
      const periodDays =
        input.timeRange === "7d"
          ? 7
          : input.timeRange === "30d"
            ? 30
            : input.timeRange === "90d"
              ? 90
              : 365;
      const stats = await db.getInvoiceStats(ctx.user.id, periodDays);
      const months =
        input.timeRange === "7d"
          ? 1
          : input.timeRange === "30d"
            ? 3
            : input.timeRange === "90d"
              ? 6
              : 12;
      const monthlyRevenue = await db.getMonthlyRevenue(ctx.user.id, months);
      const statusBreakdown = await db.getInvoiceStatusBreakdown(ctx.user.id);

      return {
        ...stats,
        monthlyRevenue,
        statusBreakdown,
      };
    }),
});
