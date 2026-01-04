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
