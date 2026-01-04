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
      }))
      .mutation(async ({ ctx, input }) => {
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
        
        const pdfBuffer = await generateInvoicePDF({
          invoice,
          client,
          lineItems,
          user: ctx.user,
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
        
        // Generate PDF
        const pdfBuffer = await generateInvoicePDF({
          invoice,
          client,
          lineItems,
          user: ctx.user,
        });
        
        // Send email
        const result = await sendInvoiceEmail({
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
          subject: `Invoice ${invoice.invoiceNumber}`,
          emailType: 'invoice',
          success: result.success,
          errorMessage: result.error,
        });
        
        // Update invoice status to sent
        if (result.success && invoice.status === 'draft') {
          await db.updateInvoice(input.id, ctx.user.id, {
            status: 'sent',
            sentAt: new Date(),
          });
        }
        
        return result;
      }),
    
    sendReminder: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.id, ctx.user.id);
        if (!invoice) throw new Error('Invoice not found');
        
        const client = await db.getClientById(invoice.clientId, ctx.user.id);
        if (!client) throw new Error('Client not found');
        
        const lineItems = await db.getLineItemsByInvoiceId(input.id);
        
        // Generate PDF for attachment
        const pdfBuffer = await generateInvoicePDF({
          invoice,
          client,
          lineItems,
          user: ctx.user,
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
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        logoUrl: z.string().optional(),
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
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        logoUrl: z.string().optional(),
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
        receiptUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createExpense({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          amount: input.amount.toString(),
          date: input.date,
          description: input.description,
          receiptUrl: input.receiptUrl,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        amount: z.number().optional(),
        date: z.date().optional(),
        description: z.string().optional(),
        receiptUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, amount, ...updates } = input;
        const dbUpdates: any = { ...updates };
        if (amount !== undefined) dbUpdates.amount = amount.toString();
        
        await db.updateExpense(id, ctx.user.id, dbUpdates);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteExpense(input.id, ctx.user.id);
        return { success: true };
      }),
    
    stats: protectedProcedure
      .input(z.object({ months: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getExpenseStats(ctx.user.id, input?.months);
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
        const payment = await db.createPayment({
          ...input,
          userId: ctx.user.id,
          status: "completed",
        });
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
  
  subscription: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      return {
        status: ctx.user.subscriptionStatus,
        currentPeriodEnd: ctx.user.currentPeriodEnd,
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
      
      // TODO: Create subscription price in Stripe dashboard and use that price ID
      // For now, hardcode a test price ID
      const priceId = 'price_1234567890'; // Replace with actual price ID
      
      const { url } = await createSubscriptionCheckout({
        customerId,
        priceId,
        successUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/subscription/success`,
        cancelUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/subscription`,
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
  }),
});

export type AppRouter = typeof appRouter;
