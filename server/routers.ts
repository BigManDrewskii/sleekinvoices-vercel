import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { createPaymentLink, createStripeCustomer, createSubscriptionCheckout, createCustomerPortalSession } from "./stripe";
import { generateInvoicePDF } from "./pdf";
import { sendInvoiceEmail, sendPaymentReminderEmail } from "./email";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        companyName: z.string().optional(),
        companyAddress: z.string().optional(),
        companyPhone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    
    uploadLogo: protectedProcedure
      .input(z.object({
        base64Data: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64Data, 'base64');
        const fileKey = `logos/${ctx.user.id}-${nanoid()}.png`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        await db.updateUserProfile(ctx.user.id, { logoUrl: url });
        return { url };
      }),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getClientById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email().optional(),
        companyName: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createClient({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        companyName: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateClient(id, ctx.user.id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClient(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  invoices: router({
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
        
        return { invoice, lineItems, client };
      }),
    
    getNextNumber: protectedProcedure.query(async ({ ctx }) => {
      return await db.getNextInvoiceNumber(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        invoiceNumber: z.string(),
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'canceled']),
        issueDate: z.date(),
        dueDate: z.date(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          rate: z.number(),
        })),
        taxRate: z.number().default(0),
        discountType: z.enum(['percentage', 'fixed']).optional(),
        discountValue: z.number().default(0),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
        expenseIds: z.array(z.number()).optional(),
      }))
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
            'Monthly invoice limit reached. You have created 3 invoices this month. ' +
            'Upgrade to Pro for unlimited invoices at $12/month.'
          );
        }
        
        // Calculate totals
        const subtotal = input.lineItems.reduce((sum, item) => 
          sum + (item.quantity * item.rate), 0
        );
        
        let discountAmount = 0;
        if (input.discountValue > 0) {
          if (input.discountType === 'percentage') {
            discountAmount = (subtotal * input.discountValue) / 100;
          } else {
            discountAmount = input.discountValue;
          }
        }
        
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = (afterDiscount * input.taxRate) / 100;
        const total = afterDiscount + taxAmount;
        
        // Create invoice
        const invoice = await db.createInvoice({
          userId: ctx.user.id,
          clientId: input.clientId,
          invoiceNumber: input.invoiceNumber,
          status: input.status,
          subtotal: subtotal.toString(),
          taxRate: input.taxRate.toString(),
          taxAmount: taxAmount.toString(),
          discountType: input.discountType,
          discountValue: input.discountValue.toString(),
          discountAmount: discountAmount.toString(),
          total: total.toString(),
          amountPaid: "0",
          issueDate: input.issueDate,
          dueDate: input.dueDate,
          notes: input.notes,
          paymentTerms: input.paymentTerms,
        });
        
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
        
        return invoice;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'canceled']).optional(),
        issueDate: z.date().optional(),
        dueDate: z.date().optional(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          rate: z.number(),
        })).optional(),
        taxRate: z.number().optional(),
        discountType: z.enum(['percentage', 'fixed']).optional(),
        discountValue: z.number().optional(),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, lineItems, ...updateData } = input;
        
        // If line items are provided, recalculate totals
        if (lineItems) {
          const subtotal = lineItems.reduce((sum, item) => 
            sum + (item.quantity * item.rate), 0
          );
          
          const discountValue = input.discountValue ?? 0;
          let discountAmount = 0;
          if (discountValue > 0) {
            if (input.discountType === 'percentage') {
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
          const dbUpdateData: any = { ...updateData };
          if (dbUpdateData.taxRate !== undefined) dbUpdateData.taxRate = dbUpdateData.taxRate.toString();
          if (dbUpdateData.discountValue !== undefined) dbUpdateData.discountValue = dbUpdateData.discountValue.toString();
          await db.updateInvoice(id, ctx.user.id, dbUpdateData);
        }
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteInvoice(input.id, ctx.user.id);
        return { success: true };
      }),
    
    generatePDF: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.id, ctx.user.id);
        if (!invoice) throw new Error('Invoice not found');
        
        const lineItems = await db.getLineItemsByInvoiceId(input.id);
        const client = await db.getClientById(invoice.clientId, ctx.user.id);
        if (!client) throw new Error('Client not found');
        
        // Get user's default template
        const template = await db.getDefaultTemplate(ctx.user.id);
        
        const pdfBuffer = await generateInvoicePDF({
          invoice,
          client,
          lineItems,
          user: ctx.user,
          template,
        });
        
        // Upload to S3
        const fileKey = `invoices/${ctx.user.id}/${invoice.invoiceNumber}-${nanoid()}.pdf`;
        const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');
        
        return { url };
      }),
    
    createPaymentLink: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.id, ctx.user.id);
        if (!invoice) throw new Error('Invoice not found');
        
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
        if (!invoice) throw new Error('Invoice not found');
        
        const lineItems = await db.getLineItemsByInvoiceId(input.id);
        const client = await db.getClientById(invoice.clientId, ctx.user.id);
        if (!client) throw new Error('Client not found');
        
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
        
        // Always update invoice status to 'sent' when user clicks send
        // This ensures status updates even if email delivery fails
        if (invoice.status === 'draft') {
          await db.updateInvoice(input.id, ctx.user.id, {
            status: 'sent',
            sentAt: new Date(),
          });
        }
        
        // Log email result
        await db.logEmail({
          userId: ctx.user.id,
          invoiceId: invoice.id,
          recipientEmail: client.email!,
          subject: `Invoice ${invoice.invoiceNumber}`,
          emailType: 'invoice',
          success: result.success,
          errorMessage: result.error,
        });
        
        return {
          success: true, // Status updated successfully
          emailSent: result.success, // Separate flag for email delivery
          error: result.error,
        };
      }),
    
    sendReminder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.id, ctx.user.id);
        if (!invoice) throw new Error('Invoice not found');
        
        const client = await db.getClientById(invoice.clientId, ctx.user.id);
        if (!client) throw new Error('Client not found');
        
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
          emailType: 'reminder',
          success: result.success,
          errorMessage: result.error,
        });
        
        return result;
      }),
    
    getAnalytics: protectedProcedure
      .input(z.object({ timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d') }))
      .query(async ({ ctx, input }) => {
        const stats = await db.getInvoiceStats(ctx.user.id);
        const months = input.timeRange === '7d' ? 1 : input.timeRange === '30d' ? 3 : input.timeRange === '90d' ? 6 : 12;
        const monthlyRevenue = await db.getMonthlyRevenue(ctx.user.id, months);
        const statusBreakdown = await db.getInvoiceStatusBreakdown(ctx.user.id);
        
        return {
          ...stats,
          monthlyRevenue,
          statusBreakdown,
        };
      }),
  }),

  analytics: router({
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
  }),

  recurringInvoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRecurringInvoicesByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const recurring = await db.getRecurringInvoiceById(input.id, ctx.user.id);
        if (!recurring) return null;
        
        const lineItems = await db.getRecurringInvoiceLineItems(input.id);
        const client = await db.getClientById(recurring.clientId, ctx.user.id);
        
        return { recurring, lineItems, client };
      }),
    
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        frequency: z.enum(['weekly', 'monthly', 'yearly']),
        startDate: z.date(),
        endDate: z.date().optional(),
        invoiceNumberPrefix: z.string(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          rate: z.number(),
        })),
        taxRate: z.number().default(0),
        discountType: z.enum(['percentage', 'fixed']).optional(),
        discountValue: z.number().default(0),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { lineItems, ...recurringData } = input;
        
        // Calculate next invoice date based on frequency
        const nextDate = new Date(input.startDate);
        if (input.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (input.frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (input.frequency === 'yearly') {
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
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        invoiceNumberPrefix: z.string().optional(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          rate: z.number(),
        })).optional(),
        taxRate: z.number().optional(),
        discountType: z.enum(['percentage', 'fixed']).optional(),
        discountValue: z.number().optional(),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, lineItems, ...updateData } = input;
        
        // Convert number fields to strings
        const dbUpdateData: any = { ...updateData };
        if (dbUpdateData.taxRate !== undefined) dbUpdateData.taxRate = dbUpdateData.taxRate.toString();
        if (dbUpdateData.discountValue !== undefined) dbUpdateData.discountValue = dbUpdateData.discountValue.toString();
        
        await db.updateRecurringInvoice(id, ctx.user.id, dbUpdateData);
        
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
        await db.updateRecurringInvoice(input.id, ctx.user.id, { isActive: input.isActive });
        return { success: true };
      }),
    
    // Manual trigger for testing (admin only)
    triggerGeneration: protectedProcedure
      .mutation(async ({ ctx }) => {
        // Only allow admin users to manually trigger
        if (ctx.user.role !== 'admin') {
          throw new Error('Only admins can manually trigger invoice generation');
        }
        
        const { generateRecurringInvoices } = await import('./jobs/generateRecurringInvoices');
        await generateRecurringInvoices();
        
        return { success: true, message: 'Invoice generation triggered' };
      }),
    
    // Get generation logs for a recurring invoice
    getGenerationLogs: protectedProcedure
      .input(z.object({ recurringInvoiceId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getGenerationLogsByRecurringId(input.recurringInvoiceId);
      }),
  }),

  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getInvoiceTemplatesByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getInvoiceTemplateById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        templateType: z.enum(["modern", "classic", "minimal", "bold", "professional", "creative"]).optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        headingFont: z.string().optional(),
        bodyFont: z.string().optional(),
        fontSize: z.number().optional(),
        logoUrl: z.string().optional(),
        logoPosition: z.enum(["left", "center", "right"]).optional(),
        logoWidth: z.number().optional(),
        headerLayout: z.enum(["standard", "centered", "split"]).optional(),
        footerLayout: z.enum(["simple", "detailed", "minimal"]).optional(),
        showCompanyAddress: z.boolean().optional(),
        showPaymentTerms: z.boolean().optional(),
        showTaxField: z.boolean().optional(),
        showDiscountField: z.boolean().optional(),
        showNotesField: z.boolean().optional(),
        footerText: z.string().optional(),
        language: z.string().optional(),
        dateFormat: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createInvoiceTemplate({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        templateType: z.enum(["modern", "classic", "minimal", "bold", "professional", "creative"]).optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        headingFont: z.string().optional(),
        bodyFont: z.string().optional(),
        fontSize: z.number().optional(),
        logoUrl: z.string().optional(),
        logoPosition: z.enum(["left", "center", "right"]).optional(),
        logoWidth: z.number().optional(),
        headerLayout: z.enum(["standard", "centered", "split"]).optional(),
        footerLayout: z.enum(["simple", "detailed", "minimal"]).optional(),
        showCompanyAddress: z.boolean().optional(),
        showPaymentTerms: z.boolean().optional(),
        showTaxField: z.boolean().optional(),
        showDiscountField: z.boolean().optional(),
        showNotesField: z.boolean().optional(),
        footerText: z.string().optional(),
        language: z.string().optional(),
        dateFormat: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateInvoiceTemplate(id, ctx.user.id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteInvoiceTemplate(input.id, ctx.user.id);
        return { success: true };
      }),
    
    setDefault: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setDefaultTemplate(input.id, ctx.user.id);
        return { success: true };
      }),
    
    initializeTemplates: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { TEMPLATE_PRESETS } = await import('../shared/template-presets');
        
        // Check if user already has the preset templates
        const existingTemplates = await db.getInvoiceTemplatesByUserId(ctx.user.id);
        const presetNames = TEMPLATE_PRESETS.map(p => p.name);
        const existingPresetNames = existingTemplates.map(t => t.name);
        const hasAllPresets = presetNames.every(name => existingPresetNames.includes(name));
        
        if (hasAllPresets) {
          return { success: true, message: 'Templates already initialized', count: existingTemplates.length };
        }
        
        // Create only missing template presets for the user
        let createdCount = 0;
        const hasDefaultTemplate = existingTemplates.some(t => t.isDefault);
        
        for (const preset of TEMPLATE_PRESETS) {
          // Skip if template with this name already exists
          if (existingPresetNames.includes(preset.name)) {
            continue;
          }
          
          await db.createInvoiceTemplate({
            userId: ctx.user.id,
            name: preset.name,
            templateType: preset.templateType,
            primaryColor: preset.primaryColor,
            secondaryColor: preset.secondaryColor,
            accentColor: preset.accentColor,
            headingFont: preset.headingFont,
            bodyFont: preset.bodyFont,
            fontSize: preset.fontSize,
            logoPosition: preset.logoPosition,
            logoWidth: preset.logoWidth,
            headerLayout: preset.headerLayout,
            footerLayout: preset.footerLayout,
            showCompanyAddress: preset.showCompanyAddress,
            showPaymentTerms: preset.showPaymentTerms,
            showTaxField: preset.showTaxField,
            showDiscountField: preset.showDiscountField,
            showNotesField: preset.showNotesField,
            footerText: preset.footerText,
            language: preset.language,
            dateFormat: preset.dateFormat,
            // Only set as default if user has no default template and this is Modern
            isDefault: !hasDefaultTemplate && preset.name === "Modern",
          });
          createdCount++;
        }
        
        return { success: true, message: 'Templates initialized successfully', count: createdCount };
      }),
  }),

  customFields: router({
    list: protectedProcedure
      .input(z.object({ templateId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getCustomFieldsByUserId(ctx.user.id, input.templateId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getCustomFieldById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        templateId: z.number().optional(),
        fieldName: z.string(),
        fieldLabel: z.string(),
        fieldType: z.enum(["text", "number", "date", "select"]),
        isRequired: z.boolean().optional(),
        defaultValue: z.string().optional(),
        selectOptions: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createCustomField({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        fieldName: z.string().optional(),
        fieldLabel: z.string().optional(),
        fieldType: z.enum(["text", "number", "date", "select"]).optional(),
        isRequired: z.boolean().optional(),
        defaultValue: z.string().optional(),
        selectOptions: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateCustomField(id, ctx.user.id, updates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCustomField(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
  expenses: router({
    categories: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        return await db.getExpenseCategoriesByUserId(ctx.user.id);
      }),
      
      create: protectedProcedure
        .input(z.object({
          name: z.string(),
          color: z.string().optional(),
        }))
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
      .input(z.object({
        categoryId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getExpensesByUserId(ctx.user.id, input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getExpenseById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        amount: z.number(),
        date: z.date(),
        description: z.string(),
        vendor: z.string().optional(),
        paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']).optional(),
        taxAmount: z.number().optional(),
        receiptUrl: z.string().optional(),
        receiptKey: z.string().optional(),
        isBillable: z.boolean().optional(),
        clientId: z.number().optional(),
        invoiceId: z.number().optional(),
      }))
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
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        amount: z.number().optional(),
        date: z.date().optional(),
        description: z.string().optional(),
        vendor: z.string().optional(),
        paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']).optional(),
        taxAmount: z.number().optional(),
        receiptUrl: z.string().optional(),
        receiptKey: z.string().optional(),
        isBillable: z.boolean().optional(),
        clientId: z.number().optional(),
        invoiceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, amount, taxAmount, ...updates } = input;
        const dbUpdates: any = { ...updates };
        if (amount !== undefined) dbUpdates.amount = amount.toString();
        if (taxAmount !== undefined) dbUpdates.taxAmount = taxAmount.toString();
        
        await db.updateExpense(id, ctx.user.id, dbUpdates);
        return { success: true };
      }),
    
    uploadReceipt: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import('./storage');
        
        // Decode base64
        const buffer = Buffer.from(input.fileData, 'base64');
        
        // Generate unique key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `receipts/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        // Upload to S3
        const { url, key } = await storagePut(fileKey, buffer, input.contentType);
        
        return { url, key };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get expense to check for receipt
        const expense = await db.getExpenseById(input.id, ctx.user.id);
        
        // Delete receipt from S3 if exists
        if (expense?.receiptKey) {
          const { storageDelete } = await import('./storage');
          try {
            await storageDelete(expense.receiptKey);
          } catch (error) {
            console.error('Failed to delete receipt from S3:', error);
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
        return await db.getBillableUnlinkedExpenses(ctx.user.id, input?.clientId);
      }),
    
    linkToInvoice: protectedProcedure
      .input(z.object({
        expenseId: z.number(),
        invoiceId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.linkExpenseToInvoice(input.expenseId, input.invoiceId, ctx.user.id);
      }),
  }),

  currencies: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCurrencies();
    }),
    
    updateRates: protectedProcedure.mutation(async ({ ctx }) => {
      // Only allow admin users to update rates
      if (ctx.user.role !== 'admin') {
        throw new Error('Only admins can update exchange rates');
      }
      
      const { updateExchangeRates } = await import('./currency');
      await updateExchangeRates();
      
      return { success: true, message: 'Exchange rates updated' };
    }),
  }),

  clientPortal: router({
    // Generate access token for a client (protected - admin only)
    generateAccessToken: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const accessToken = await db.createClientPortalAccess(input.clientId);
        return { accessToken, portalUrl: `/portal/${accessToken}` };
      }),
    
    // Get client info by access token (public)
    getClientInfo: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .query(async ({ input }) => {
        const client = await db.getClientByAccessToken(input.accessToken);
        if (!client) {
          throw new Error('Invalid or expired access token');
        }
        return client;
      }),
    
    // Get invoices for a client (public)
    getInvoices: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .query(async ({ input }) => {
        const client = await db.getClientByAccessToken(input.accessToken);
        if (!client) {
          throw new Error('Invalid or expired access token');
        }
        
        return await db.getClientInvoices(client.id);
      }),
    
    // Get single invoice details (public)
    getInvoice: publicProcedure
      .input(z.object({ accessToken: z.string(), invoiceId: z.number() }))
      .query(async ({ input }) => {
        const client = await db.getClientByAccessToken(input.accessToken);
        if (!client) {
          throw new Error('Invalid or expired access token');
        }
        
        const invoice = await db.getInvoiceById(input.invoiceId, client.userId);
        if (!invoice || invoice.clientId !== client.id) {
          throw new Error('Invoice not found');
        }
        
        const lineItems = await db.getLineItemsByInvoiceId(input.invoiceId);
        
        return { invoice, lineItems, client };
      }),
    
    // Get active portal access for a client (protected)
    getActiveAccess: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getActiveClientPortalAccess(input.clientId);
      }),
    
    // Revoke portal access (protected)
    revokeAccess: protectedProcedure
      .input(z.object({ accessToken: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.revokeClientPortalAccess(input.accessToken);
        return { success: true };
      }),
    
    // Send portal invitation email (protected)
    sendInvitation: protectedProcedure
      .input(z.object({ 
        clientId: z.number(),
        accessToken: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const client = await db.getClientById(input.clientId, ctx.user.id);
        if (!client) {
          throw new Error('Client not found');
        }
        
        if (!client.email) {
          throw new Error('Client does not have an email address');
        }
        
        // Import email template
        const { generatePortalInvitationEmail } = await import('./email-templates/portal-invitation');
        
        // Generate email content
        const portalUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'http://localhost:3000'}/portal/${input.accessToken}`;
        const { subject, html } = generatePortalInvitationEmail({
          clientName: client.name,
          portalUrl,
          companyName: ctx.user.companyName || ctx.user.name || 'SleekInvoices',
          expiresInDays: 90,
        });
        
        // Send email using Resend
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const result = await resend.emails.send({
          from: `${ctx.user.name || ctx.user.companyName || 'SleekInvoices'} <portal@sleekinvoices.com>`,
          replyTo: ctx.user.email || 'support@sleekinvoices.com',
          to: [client.email],
          subject,
          html,
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        return { success: true };
      }),
  }),

  payments: router({
    create: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        amount: z.string(),
        currency: z.string().default("USD"),
        paymentMethod: z.enum(["stripe", "manual", "bank_transfer", "check", "cash"]),
        paymentDate: z.date(),
        receivedDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create the payment
        const payment = await db.createPayment({
          ...input,
          userId: ctx.user.id,
          status: "completed",
        });
        
        // Check payment status and update invoice if fully paid
        const paymentStatus = await db.getInvoicePaymentStatus(input.invoiceId);
        
        console.log(`[Payment] Invoice ${input.invoiceId} payment status:`, paymentStatus);
        
        if (paymentStatus.status === 'paid') {
          // Update invoice status to paid
          await db.updateInvoice(input.invoiceId, ctx.user.id, {
            status: 'paid',
            amountPaid: paymentStatus.totalPaid.toString(),
          });
          console.log(`[Payment] Invoice ${input.invoiceId} marked as paid`);
        } else if (paymentStatus.status === 'partial') {
          // Update amount paid but keep status as sent
          await db.updateInvoice(input.invoiceId, ctx.user.id, {
            amountPaid: paymentStatus.totalPaid.toString(),
          });
          console.log(`[Payment] Invoice ${input.invoiceId} partially paid: $${paymentStatus.totalPaid}`);
        }
        
        return payment;
      }),
    
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        paymentMethod: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getPaymentsByUser(ctx.user.id, input);
      }),
    
    getByInvoice: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPaymentsByInvoice(input.invoiceId);
      }),
    
    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getPaymentStats(ctx.user.id);
      }),
    
    delete: protectedProcedure
      .input(z.object({ paymentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePayment(input.paymentId);
        return { success: true };
      }),
  }),
  
  reminders: router({
    getSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const settings = await db.getReminderSettings(ctx.user.id);
        if (!settings) {
          // Return default settings
          return {
            enabled: true,
            intervals: [3, 7, 14],
            emailTemplate: null, // Will use DEFAULT_REMINDER_TEMPLATE
            ccEmail: null,
          };
        }
        return {
          enabled: settings.enabled === 1,
          intervals: JSON.parse(settings.intervals),
          emailTemplate: settings.emailTemplate,
          ccEmail: settings.ccEmail,
        };
      }),
    
    updateSettings: protectedProcedure
      .input(z.object({
        enabled: z.boolean(),
        intervals: z.array(z.number()),
        emailTemplate: z.string().optional(),
        ccEmail: z.string().email().optional().nullable(),
      }))
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
          throw new Error('Invoice not found');
        }
        
        // Get client
        const client = await db.getClientById(invoice.clientId, ctx.user.id);
        if (!client) {
          throw new Error('Client not found');
        }
        
        // Calculate days overdue
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        if (!dueDate) {
          throw new Error('Invoice has no due date');
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 0) {
          throw new Error('Invoice is not overdue yet');
        }
        
        // Get reminder settings
        const settings = await db.getReminderSettings(ctx.user.id);
        
        // Send reminder
        const { sendReminderEmail } = await import('./email');
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
          recipientEmail: client.email || 'N/A',
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.error,
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send reminder');
        }
        
        return { success: true, messageId: result.messageId };
      }),
    
    getLogs: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getReminderLogs(input.invoiceId);
      }),
  }),
  
  subscription: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      return {
        status: ctx.user.subscriptionStatus,
        currentPeriodEnd: ctx.user.currentPeriodEnd,
      };
    }),
    
    /**
     * Get current month's usage for invoice limit tracking
     * Returns invoices created this month and the limit based on subscription
     */
    getUsage: protectedProcedure.query(async ({ ctx }) => {
      const usage = await db.getCurrentMonthUsage(ctx.user.id);
      const { SUBSCRIPTION_PLANS, isPro, getRemainingInvoices } = await import('../shared/subscription.js');
      
      const isProUser = isPro(ctx.user.subscriptionStatus);
      const limit = isProUser ? null : SUBSCRIPTION_PLANS.FREE.invoiceLimit;
      const remaining = isProUser ? null : getRemainingInvoices(usage.invoicesCreated);
      
      return {
        invoicesCreated: usage.invoicesCreated,
        limit,
        remaining,
        isPro: isProUser,
      };
    }),
    
    createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      // Create Stripe customer if not exists
      let customerId = ctx.user.stripeCustomerId;
      if (!customerId) {
        customerId = await createStripeCustomer(
          ctx.user.email!,
          ctx.user.name || undefined
        );
        await db.updateUserSubscription(ctx.user.id, { stripeCustomerId: customerId });
      }
      
      /**
       * STRIPE PRICE ID SETUP:
       * 1. Log into Stripe Dashboard (https://dashboard.stripe.com)
       * 2. Go to Products → Create Product
       * 3. Name: "InvoiceFlow Pro"
       * 4. Add recurring price: $12/month
       * 5. Copy the Price ID (format: price_xxxxxxxxxxxxx)
       * 6. Set environment variable: STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
       */
      const priceId = process.env.STRIPE_PRO_PRICE_ID;
      
      if (!priceId) {
        throw new Error('Stripe price ID not configured. Please set STRIPE_PRO_PRICE_ID environment variable.');
      }
      
      if (priceId.includes('PLACEHOLDER') || priceId === 'price_1234567890') {
        throw new Error('Stripe price ID is still a placeholder. Please create a product in Stripe Dashboard and update STRIPE_PRO_PRICE_ID.');
      }
      
      // Use the request host to build correct redirect URLs
      const protocol = ctx.req.protocol || 'https';
      const host = ctx.req.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      
      const { url } = await createSubscriptionCheckout({
        customerId,
        priceId,
        successUrl: `${baseUrl}/subscription/success`,
        cancelUrl: `${baseUrl}/subscription`,
      });
      
      return { url };
    }),
    
    createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeCustomerId) {
        throw new Error('No Stripe customer found');
      }
      
      const url = await createCustomerPortalSession({
        customerId: ctx.user.stripeCustomerId,
        returnUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/subscription`,
      });
      
      return { url };
    }),
    
    /**
     * Manually sync subscription status from Stripe
     * Useful when webhooks fail or for testing
     */
    syncStatus: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeCustomerId) {
        throw new Error('No Stripe customer found. Please create a subscription first.');
      }
      
      const { syncSubscriptionStatus } = await import('./stripe');
      const syncResult = await syncSubscriptionStatus(ctx.user.stripeCustomerId);
      
      // Update user in database
      await db.updateUserSubscription(ctx.user.id, {
        subscriptionStatus: syncResult.status,
        subscriptionId: syncResult.subscriptionId || undefined,
        currentPeriodEnd: syncResult.currentPeriodEnd || undefined,
      });
      
      return {
        success: true,
        status: syncResult.status,
        message: syncResult.status === 'active' 
          ? 'Pro subscription activated!' 
          : `Subscription status: ${syncResult.status}`,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
