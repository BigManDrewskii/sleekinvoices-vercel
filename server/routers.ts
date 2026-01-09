import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { createPaymentLink, createStripeCustomer, createSubscriptionCheckout, createCustomerPortalSession } from "./stripe";
import { generateInvoicePDF } from "./pdf";
import { sendInvoiceEmail, sendPaymentReminderEmail } from "./email";
import * as nowpayments from "./lib/nowpayments";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { extractInvoiceData } from "./ai/smartCompose";

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
        taxId: z.string().max(50).optional(), // VAT/Tax ID for invoices
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    
    // GDPR Data Export - Download all user data
    exportAllData: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      
      // Gather all user data
      const [clients, invoices, products, expenses, templates, recurringInvoices, estimates, payments, emailLogs] = await Promise.all([
        db.getClientsByUserId(userId),
        db.getInvoicesByUserId(userId),
        db.getProductsByUserId(userId),
        db.getExpensesByUserId(userId),
        db.getInvoiceTemplatesByUserId(userId),
        db.getRecurringInvoicesByUserId(userId),
        db.getEstimatesByUserId(userId),
        db.getPaymentsByUserId(userId),
        db.getEmailLogsByUserId(userId),
      ]);
      
      // Get line items for each invoice
      const invoicesWithLineItems = await Promise.all(
        invoices.map(async (invoice) => {
          const lineItems = await db.getLineItemsByInvoiceId(invoice.id);
          return { ...invoice, lineItems };
        })
      );
      
      // Compile all data
      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name,
          companyName: ctx.user.companyName,
          companyAddress: ctx.user.companyAddress,
          companyPhone: ctx.user.companyPhone,
          taxId: ctx.user.taxId,
          createdAt: ctx.user.createdAt,
        },
        clients,
        invoices: invoicesWithLineItems,
        products,
        expenses,
        templates,
        recurringInvoices,
        estimates,
        payments,
        emailLogs,
      };
      
      // Convert to JSON and upload to S3
      const jsonData = JSON.stringify(exportData, null, 2);
      const fileKey = `exports/${userId}/sleek-invoices-data-export-${new Date().toISOString().split('T')[0]}-${nanoid(6)}.json`;
      const { url } = await storagePut(fileKey, Buffer.from(jsonData), 'application/json');
      
      return { url, exportedAt: exportData.exportedAt };
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
    
    // GDPR Account Deletion - Delete all user data
    deleteAccount: protectedProcedure
      .input(z.object({
        confirmationText: z.string(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify confirmation text matches
        if (input.confirmationText !== 'DELETE MY ACCOUNT') {
          throw new Error('Please type "DELETE MY ACCOUNT" to confirm deletion');
        }
        
        const userId = ctx.user.id;
        const userEmail = ctx.user.email as string | undefined;
        
        // Log the deletion request for audit trail (before deleting data)
        await db.logAuditEvent({
          userId,
          action: 'account_deletion_initiated',
          entityType: 'user',
          entityId: userId,
          entityName: userEmail ?? undefined,
          details: {
            reason: input.reason || 'No reason provided',
            deletedAt: new Date().toISOString(),
          },
        });
        
        // Perform comprehensive data deletion
        await db.deleteUserAccount(userId);
        
        // Clear the session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        
        return { 
          success: true, 
          message: 'Your account and all associated data have been permanently deleted.' 
        };
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
        vatNumber: z.string().max(50).optional(), // EU VAT number (e.g., DE123456789)
        taxExempt: z.boolean().optional(), // Tax exempt status
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
        vatNumber: z.string().max(50).nullable().optional(), // EU VAT number (e.g., DE123456789)
        taxExempt: z.boolean().optional(), // Tax exempt status
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
    
    // Bulk delete clients
    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        let deletedCount = 0;
        for (const id of input.ids) {
          try {
            await db.deleteClient(id, ctx.user.id);
            deletedCount++;
          } catch (error) {
            // Continue with other deletions if one fails
            console.error(`Failed to delete client ${id}:`, error);
          }
        }
        return { success: true, deletedCount };
      }),
    
    // Bulk import clients from CSV
    import: protectedProcedure
      .input(z.object({
        clients: z.array(z.object({
          name: z.string(),
          email: z.string().optional(),
          companyName: z.string().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
          notes: z.string().optional(),
          vatNumber: z.string().optional(),
        })),
        skipDuplicates: z.boolean().optional().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check for existing clients by email to detect duplicates
        const emails = input.clients
          .filter(c => c.email)
          .map(c => c.email!.toLowerCase());
        
        const existingClients = await db.getClientsByEmails(ctx.user.id, emails);
        const existingEmails = new Set(existingClients.map(c => c.email?.toLowerCase()));
        
        // Filter out duplicates if requested
        const clientsToImport = input.skipDuplicates
          ? input.clients.filter(c => !c.email || !existingEmails.has(c.email.toLowerCase()))
          : input.clients;
        
        // Prepare client data for bulk insert
        const clientsData = clientsToImport.map(c => ({
          userId: ctx.user.id,
          name: c.name,
          email: c.email || null,
          companyName: c.companyName || null,
          address: c.address || null,
          phone: c.phone || null,
          notes: c.notes || null,
          vatNumber: c.vatNumber || null,
        }));
        
        const result = await db.bulkCreateClients(ctx.user.id, clientsData);
        
        return {
          imported: result.created.length,
          skipped: input.clients.length - clientsToImport.length,
          errors: result.errors,
          duplicateEmails: Array.from(existingEmails).filter(e => 
            input.clients.some(c => c.email?.toLowerCase() === e)
          ),
        };
      }),
    
    // VIES VAT Validation
    validateVAT: protectedProcedure
      .input(z.object({
        vatNumber: z.string().min(3).max(50),
      }))
      .mutation(async ({ input }) => {
        const { validateVATNumber } = await import('./lib/vat-validation');
        return await validateVATNumber(input.vatNumber);
      }),
    
    // Client Tags
    listTags: protectedProcedure.query(async ({ ctx }) => {
      return await db.getClientTagsByUserId(ctx.user.id);
    }),
    
    createTag: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createClientTag({
          userId: ctx.user.id,
          name: input.name,
          color: input.color || '#6366f1',
          description: input.description || null,
        });
      }),
    
    updateTag: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        description: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateClientTag(id, ctx.user.id, data);
        return { success: true };
      }),
    
    deleteTag: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteClientTag(input.id, ctx.user.id);
        return { success: true };
      }),
    
    // Tag assignments
    getClientTags: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getTagsForClient(input.clientId, ctx.user.id);
      }),
    
    assignTag: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.assignTagToClient(input.clientId, input.tagId, ctx.user.id);
        return { success: true };
      }),
    
    removeTag: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.removeTagFromClient(input.clientId, input.tagId, ctx.user.id);
        return { success: true };
      }),
    
    // Get clients by tag
    getClientsByTag: protectedProcedure
      .input(z.object({ tagId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getClientsByTagId(input.tagId, ctx.user.id);
      }),
    
    // Bulk tag assignment
    bulkAssignTag: protectedProcedure
      .input(z.object({
        clientIds: z.array(z.number()),
        tagId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        let assignedCount = 0;
        for (const clientId of input.clientIds) {
          try {
            await db.assignTagToClient(clientId, input.tagId, ctx.user.id);
            assignedCount++;
          } catch (error) {
            // Continue with other assignments if one fails (e.g., already assigned)
          }
        }
        return { success: true, assignedCount };
      }),
  }),

  // Products/Services Library
  products: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getProductsByUserId(ctx.user.id, input?.includeInactive);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getProductById(input.id, ctx.user.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        rate: z.string(), // String for decimal precision
        unit: z.string().max(50).optional(),
        category: z.string().max(100).optional(),
        sku: z.string().max(100).optional(),
        taxable: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createProduct({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().nullable().optional(),
        rate: z.string().optional(),
        unit: z.string().max(50).nullable().optional(),
        category: z.string().max(100).nullable().optional(),
        sku: z.string().max(100).nullable().optional(),
        taxable: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
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
        const viewCount = await db.getInvoiceViewCount(input.id);
        
        return { invoice, lineItems, client, viewCount };
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
        templateId: z.number().optional(), // Template to use for this invoice
        currency: z.string().default('USD'), // Invoice currency (fiat or crypto)
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
        
        // Check for duplicate invoice number
        const existingInvoice = await db.getInvoiceByNumber(ctx.user.id, input.invoiceNumber);
        if (existingInvoice) {
          throw new Error(
            `Invoice number "${input.invoiceNumber}" already exists. Please use a unique invoice number.`
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
          templateId: input.templateId, // Store selected template
          currency: input.currency, // Invoice currency
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
        
        // ============================================================================
        // AUTOMATIC QUICKBOOKS SYNC
        // Sync invoice to QuickBooks if connected and invoice is being sent
        // Only sync non-draft invoices to avoid syncing incomplete work
        // ============================================================================
        if (input.status === 'sent') {
          try {
            const { getConnectionStatus, syncInvoiceToQB } = await import('./quickbooks');
            const qbStatus = await getConnectionStatus(ctx.user.id);
            if (qbStatus.connected) {
              // Fire and forget - don't block invoice creation on QB sync
              syncInvoiceToQB(ctx.user.id, invoice.id).catch((err) => {
                console.error('[QuickBooks] Auto-sync failed for invoice', invoice.id, err);
              });
            }
          } catch (err) {
            // QuickBooks sync failure should not block invoice creation
            console.error('[QuickBooks] Auto-sync error:', err);
          }
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
        templateId: z.number().optional(), // Template to use for this invoice
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
    
    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        let deletedCount = 0;
        for (const id of input.ids) {
          try {
            await db.deleteInvoice(id, ctx.user.id);
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete invoice ${id}:`, error);
          }
        }
        return { success: true, deletedCount };
      }),
    
    // Bulk update status for multiple invoices
    bulkUpdateStatus: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'canceled']),
      }))
      .mutation(async ({ ctx, input }) => {
        let updatedCount = 0;
        const errors: string[] = [];
        
        for (const id of input.ids) {
          try {
            await db.updateInvoice(id, ctx.user.id, { status: input.status });
            updatedCount++;
          } catch (error: any) {
            console.error(`Failed to update invoice ${id}:`, error);
            errors.push(`Invoice ${id}: ${error.message}`);
          }
        }
        
        return { success: true, updatedCount, errors };
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
              errors.push(`Invoice ${invoice.invoiceNumber}: Client has no email`);
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
              if (invoice.status === 'draft') {
                await db.updateInvoice(id, ctx.user.id, {
                  status: 'sent',
                  sentAt: new Date(),
                });
              }
              
              // Log email
              await db.logEmail({
                userId: ctx.user.id,
                invoiceId: invoice.id,
                recipientEmail: client.email,
                subject: `Invoice ${invoice.invoiceNumber}`,
                emailType: 'invoice',
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
        const links: { invoiceId: number; invoiceNumber: string; url: string }[] = [];
        
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
            console.error(`Failed to create payment link for invoice ${id}:`, error);
            errors.push(`Invoice ${id}: ${error.message}`);
          }
        }
        
        return { success: true, createdCount, links, errors };
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
          
          // ============================================================================
          // AUTOMATIC QUICKBOOKS SYNC ON SEND
          // Sync invoice to QuickBooks when first sent (status changes from draft)
          // ============================================================================
          try {
            const { getConnectionStatus, syncInvoiceToQB } = await import('./quickbooks');
            const qbStatus = await getConnectionStatus(ctx.user.id);
            if (qbStatus.connected) {
              // Fire and forget - don't block email sending on QB sync
              syncInvoiceToQB(ctx.user.id, input.id).catch((err) => {
                console.error('[QuickBooks] Auto-sync on send failed for invoice', input.id, err);
              });
            }
          } catch (err) {
            console.error('[QuickBooks] Auto-sync on send error:', err);
          }
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
    
    // Duplicate an existing invoice
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get the original invoice
        const originalInvoice = await db.getInvoiceById(input.id, ctx.user.id);
        if (!originalInvoice) throw new Error('Invoice not found');
        
        // Check if user can create invoice (limit enforcement)
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
        
        // Get line items from original invoice
        const originalLineItems = await db.getLineItemsByInvoiceId(input.id);
        
        // Generate new invoice number
        const newInvoiceNumber = await db.getNextInvoiceNumber(ctx.user.id);
        
        // Calculate new dates (issue date = today, due date = today + original difference)
        const originalIssueDateMs = new Date(originalInvoice.issueDate).getTime();
        const originalDueDateMs = new Date(originalInvoice.dueDate).getTime();
        const daysDifference = Math.ceil((originalDueDateMs - originalIssueDateMs) / (1000 * 60 * 60 * 24));
        
        const newIssueDate = new Date();
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + daysDifference);
        
        // Create the duplicated invoice
        const newInvoice = await db.createInvoice({
          userId: ctx.user.id,
          clientId: originalInvoice.clientId,
          invoiceNumber: newInvoiceNumber,
          status: 'draft', // Always start as draft
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
      .input(z.object({ timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d') }))
      .query(async ({ ctx, input }) => {
        // Map timeRange to days for comparison
        const periodDays = input.timeRange === '7d' ? 7 : input.timeRange === '30d' ? 30 : input.timeRange === '90d' ? 90 : 365;
        const stats = await db.getInvoiceStats(ctx.user.id, periodDays);
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
            // Only set as default if user has no default template and this is Sleek - Default
            isDefault: !hasDefaultTemplate && preset.name === "Sleek - Default",
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
        isBillable: z.boolean().optional(),
        clientId: z.number().optional(),
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
      .query(async ({ input, ctx }) => {
        const client = await db.getClientByAccessToken(input.accessToken);
        if (!client) {
          throw new Error('Invalid or expired access token');
        }
        
        const invoice = await db.getInvoiceById(input.invoiceId, client.userId);
        if (!invoice || invoice.clientId !== client.id) {
          throw new Error('Invoice not found');
        }
        
        // Track this view
        const ipAddress = ctx.req.headers['x-forwarded-for'] as string || ctx.req.socket?.remoteAddress;
        const userAgent = ctx.req.headers['user-agent'] as string;
        await db.recordInvoiceView(input.invoiceId, ipAddress, userAgent);
        
        const lineItems = await db.getLineItemsByInvoiceId(input.invoiceId);
        const viewCount = await db.getInvoiceViewCount(input.invoiceId);
        
        return { invoice, lineItems, client, viewCount };
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
        paymentMethod: z.enum(["stripe", "manual", "bank_transfer", "check", "cash", "crypto"]),
        paymentDate: z.date(),
        receivedDate: z.date().optional(),
        notes: z.string().optional(),
        // Crypto payment fields
        cryptoAmount: z.string().optional(),
        cryptoCurrency: z.string().max(10).optional(), // BTC, ETH, USDT, etc.
        cryptoNetwork: z.string().max(20).optional(), // mainnet, polygon, arbitrum, etc.
        cryptoTxHash: z.string().max(100).optional(), // Transaction hash
        cryptoWalletAddress: z.string().max(100).optional(), // Receiving wallet
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
          
          // ============================================================================
          // AUTOMATIC QUICKBOOKS SYNC ON PAYMENT
          // Sync invoice to QuickBooks when marked as paid to update payment status
          // ============================================================================
          try {
            const { getConnectionStatus, syncInvoiceToQB } = await import('./quickbooks');
            const qbStatus = await getConnectionStatus(ctx.user.id);
            if (qbStatus.connected) {
              // Fire and forget - don't block payment recording on QB sync
              syncInvoiceToQB(ctx.user.id, input.invoiceId).catch((err) => {
                console.error('[QuickBooks] Auto-sync on payment failed for invoice', input.invoiceId, err);
              });
            }
          } catch (err) {
            console.error('[QuickBooks] Auto-sync on payment error:', err);
          }
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
    
    // Get payment summary for an invoice (total, paid, remaining)
    getSummary: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getInvoicePaymentSummary(input.invoiceId, ctx.user.id);
      }),
    
    // Record a partial payment
    recordPartial: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        amount: z.string(),
        paymentMethod: z.enum(["manual", "bank_transfer", "check", "cash", "crypto"]),
        paymentDate: z.date(),
        notes: z.string().optional(),
        cryptoCurrency: z.string().max(10).optional(),
        cryptoNetwork: z.string().max(20).optional(),
        cryptoTxHash: z.string().max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.recordPartialPayment(input.invoiceId, ctx.user.id, input);
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
      .input(z.object({
        enabled: z.boolean(),
        intervals: z.array(z.number()),
        emailSubject: z.string().optional(),
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
      const { getEffectiveEndDate, getDaysRemaining, formatTimeRemaining, isExpiringSoon, isExpired } = await import('./lib/subscription-utils.js');
      
      const userData = {
        currentPeriodEnd: ctx.user.currentPeriodEnd,
        subscriptionEndDate: ctx.user.subscriptionEndDate,
      };
      
      const effectiveEndDate = getEffectiveEndDate(userData);
      const daysRemaining = getDaysRemaining(userData);
      const timeRemaining = formatTimeRemaining(userData);
      const expiringSoon = isExpiringSoon(userData);
      const expired = isExpired(userData);
      
      return {
        status: ctx.user.subscriptionStatus,
        currentPeriodEnd: ctx.user.currentPeriodEnd,
        subscriptionEndDate: ctx.user.subscriptionEndDate,
        subscriptionSource: ctx.user.subscriptionSource,
        effectiveEndDate,
        daysRemaining,
        timeRemaining,
        isExpiringSoon: expiringSoon,
        isExpired: expired,
      };
    }),
    
    /**
     * Get subscription payment history
     * Returns all crypto payments and subscription events
     */
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const cryptoPayments = await db.getSubscriptionHistory(ctx.user.id);
      
      // Transform crypto payments into history items
      const historyItems = cryptoPayments.map(payment => ({
        id: `crypto_${payment.id}`,
        type: 'crypto' as const,
        status: payment.paymentStatus,
        amount: parseFloat(payment.priceAmount),
        currency: payment.priceCurrency.toUpperCase(),
        cryptoCurrency: payment.payCurrency.toUpperCase(),
        cryptoAmount: parseFloat(payment.payAmount),
        months: payment.months,
        isExtension: payment.isExtension,
        date: payment.confirmedAt || payment.createdAt,
        createdAt: payment.createdAt,
      }));
      
      // Add Stripe subscription info if available
      const stripeItems: Array<{
        id: string;
        type: 'stripe';
        status: string;
        amount: number;
        currency: string;
        months: number;
        isExtension: boolean;
        date: Date;
        createdAt: Date;
      }> = [];
      
      if (ctx.user.stripeCustomerId && ctx.user.subscriptionId) {
        // Add current Stripe subscription as a history item
        stripeItems.push({
          id: `stripe_${ctx.user.subscriptionId}`,
          type: 'stripe',
          status: ctx.user.subscriptionStatus,
          amount: 12, // Monthly price
          currency: 'USD',
          months: 1, // Stripe is monthly recurring
          isExtension: false,
          date: ctx.user.createdAt,
          createdAt: ctx.user.createdAt,
        });
      }
      
      // Combine and sort by date descending
      const allItems = [...historyItems, ...stripeItems].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      return {
        items: allItems,
        totalCryptoPayments: cryptoPayments.length,
        hasStripeSubscription: !!ctx.user.subscriptionId,
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
    createCryptoCheckout: protectedProcedure
      .input(z.object({
        months: z.number().refine(m => [1, 3, 6, 12].includes(m), {
          message: 'Duration must be 1, 3, 6, or 12 months',
        }).default(1),
        payCurrency: z.string().default('btc'),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getCryptoPrice, isValidCryptoDuration } = await import('../shared/subscription.js');
        
        // Validate duration
        if (!isValidCryptoDuration(input.months)) {
          throw new Error('Invalid subscription duration');
        }
        
        // Get crypto price for the selected duration
        const priceAmount = getCryptoPrice(input.months);
        if (priceAmount === 0) {
          throw new Error('Invalid subscription duration');
        }
        
        // Create NOWPayments payment for Pro subscription
        const protocol = ctx.req.protocol || 'https';
        const host = ctx.req.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        // Include months in orderId for webhook processing
        const orderId = `sub_${ctx.user.id}_${input.months}mo_${Date.now()}`;
        
        const payment = await nowpayments.createPayment({
          priceAmount,
          priceCurrency: 'usd',
          payCurrency: input.payCurrency,
          orderId,
          orderDescription: `SleekInvoices Pro - ${input.months} month${input.months > 1 ? 's' : ''} - ${ctx.user.email}`,
          ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
          successUrl: `${baseUrl}/subscription/success?crypto=true`,
          cancelUrl: `${baseUrl}/subscription`,
        });
        
        // Store the payment reference for webhook processing
        await db.createCryptoSubscriptionPayment({
          userId: ctx.user.id,
          paymentId: payment.payment_id,
          paymentStatus: payment.payment_status,
          priceAmount: priceAmount.toString(),
          priceCurrency: 'usd',
          payCurrency: input.payCurrency,
          payAmount: payment.pay_amount?.toString() || '0',
          months: input.months,
          isExtension: false,
        });
        
        return {
          paymentUrl: payment.invoice_url || '',
          paymentId: payment.payment_id,
          cryptoAmount: payment.pay_amount?.toString() || '0',
          cryptoCurrency: input.payCurrency,
        };
      }),
    
    /**
     * Extend an existing Pro subscription with crypto payment
     * For users who already have an active subscription
     */
    extendCryptoSubscription: protectedProcedure
      .input(z.object({
        months: z.number().refine(m => [1, 3, 6, 12].includes(m), {
          message: 'Duration must be 1, 3, 6, or 12 months',
        }),
        payCurrency: z.string().default('btc'),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getCryptoPrice, isPro } = await import('../shared/subscription.js');
        
        // User must be Pro to extend
        if (!isPro(ctx.user.subscriptionStatus)) {
          throw new Error('Only Pro subscribers can extend their subscription');
        }
        
        const priceAmount = getCryptoPrice(input.months);
        if (priceAmount === 0) {
          throw new Error('Invalid subscription duration');
        }
        
        const protocol = ctx.req.protocol || 'https';
        const host = ctx.req.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        // Include 'ext' in orderId to mark as extension
        const orderId = `sub_${ctx.user.id}_${input.months}mo_ext_${Date.now()}`;
        
        const payment = await nowpayments.createPayment({
          priceAmount,
          priceCurrency: 'usd',
          payCurrency: input.payCurrency,
          orderId,
          orderDescription: `SleekInvoices Pro Extension - ${input.months} month${input.months > 1 ? 's' : ''} - ${ctx.user.email}`,
          ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
          successUrl: `${baseUrl}/subscription/success?crypto=true&extended=true`,
          cancelUrl: `${baseUrl}/subscription`,
        });
        
        await db.createCryptoSubscriptionPayment({
          userId: ctx.user.id,
          paymentId: payment.payment_id,
          paymentStatus: payment.payment_status,
          priceAmount: priceAmount.toString(),
          priceCurrency: 'usd',
          payCurrency: input.payCurrency,
          payAmount: payment.pay_amount?.toString() || '0',
          months: input.months,
          isExtension: true,
        });
        
        return {
          paymentUrl: payment.invoice_url || '',
          paymentId: payment.payment_id,
          cryptoAmount: payment.pay_amount?.toString() || '0',
          cryptoCurrency: input.payCurrency,
        };
      }),
    
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

  // NOWPayments Crypto Payment Gateway
  crypto: router({
    // Get API status
    getStatus: publicProcedure.query(async () => {
      return await nowpayments.getApiStatus();
    }),

    // Get available cryptocurrencies
    getCurrencies: publicProcedure.query(async () => {
      const currencies = await nowpayments.getAvailableCurrencies();
      const popular = nowpayments.getPopularCurrencies();
      return {
        all: currencies,
        popular: popular.filter(c => currencies.includes(c)),
      };
    }),

    // Get estimated crypto amount for a given fiat amount
    getEstimate: publicProcedure
      .input(z.object({
        amount: z.number().positive(),
        fiatCurrency: z.string().default('usd'),
        cryptoCurrency: z.string(),
      }))
      .query(async ({ input }) => {
        const estimate = await nowpayments.getEstimatedPrice(
          input.amount,
          input.fiatCurrency,
          input.cryptoCurrency
        );
        return {
          fiatAmount: input.amount,
          fiatCurrency: input.fiatCurrency,
          cryptoAmount: estimate,
          cryptoCurrency: input.cryptoCurrency,
        };
      }),

    // Get minimum payment amount for a currency
    getMinAmount: publicProcedure
      .input(z.object({
        fiatCurrency: z.string().default('usd'),
        cryptoCurrency: z.string(),
      }))
      .query(async ({ input }) => {
        const minAmount = await nowpayments.getMinimumPaymentAmount(
          input.fiatCurrency,
          input.cryptoCurrency
        );
        return { minAmount };
      }),

    // Create a crypto payment for an invoice
    createPayment: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        cryptoCurrency: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get the invoice
        const invoice = await db.getInvoiceById(input.invoiceId, ctx.user.id);
        if (!invoice) {
          throw new Error('Invoice not found');
        }

        // Calculate remaining amount to pay
        const total = parseFloat(invoice.total);
        const paid = parseFloat(invoice.amountPaid || '0');
        const remaining = total - paid;

        if (remaining <= 0) {
          throw new Error('Invoice is already fully paid');
        }

        // Get the base URL for callbacks
        const baseUrl = process.env.VITE_APP_URL || `https://${process.env.VITE_APP_ID}.manus.space`;

        // Create NOWPayments invoice
        const payment = await nowpayments.createInvoice({
          priceAmount: remaining,
          priceCurrency: invoice.currency?.toLowerCase() || 'usd',
          payCurrency: input.cryptoCurrency.toLowerCase(),
          orderId: `INV-${invoice.id}-${Date.now()}`,
          orderDescription: `Payment for Invoice ${invoice.invoiceNumber}`,
          ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
          successUrl: `${baseUrl}/invoices/${invoice.id}?payment=success`,
          cancelUrl: `${baseUrl}/invoices/${invoice.id}?payment=cancelled`,
          isFixedRate: true,
        });

        // Store the payment reference in the database
        await db.updateInvoice(invoice.id, ctx.user.id, {
          cryptoPaymentId: payment.id,
          cryptoCurrency: input.cryptoCurrency.toUpperCase(),
          cryptoPaymentUrl: payment.invoice_url,
        });

        return {
          paymentId: payment.id,
          invoiceUrl: payment.invoice_url,
          cryptoCurrency: input.cryptoCurrency,
          priceAmount: remaining,
          priceCurrency: invoice.currency || 'USD',
        };
      }),

    // Check payment status
    getPaymentStatus: protectedProcedure
      .input(z.object({
        paymentId: z.string(),
      }))
      .query(async ({ input }) => {
        const status = await nowpayments.getPaymentStatus(input.paymentId);
        return {
          paymentId: status.payment_id,
          status: status.payment_status,
          payAddress: status.pay_address,
          payAmount: status.pay_amount,
          actuallyPaid: status.actually_paid,
          payCurrency: status.pay_currency,
          isComplete: nowpayments.isPaymentComplete(status.payment_status),
          isPending: nowpayments.isPaymentPending(status.payment_status),
          isFailed: nowpayments.isPaymentFailed(status.payment_status),
        };
      }),

    // Format currency name for display
    formatCurrency: publicProcedure
      .input(z.object({ currency: z.string() }))
      .query(({ input }) => {
        return { name: nowpayments.formatCurrencyName(input.currency) };
      }),
  }),

  // Estimates/Quotes
  estimates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // Update expired estimates first
      await db.updateExpiredEstimates(ctx.user.id);
      return await db.getEstimatesByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getEstimateById(input.id, ctx.user.id);
      }),

    generateNumber: protectedProcedure.query(async ({ ctx }) => {
      return await db.generateEstimateNumber(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        estimateNumber: z.string(),
        title: z.string().optional(),
        currency: z.string().default("USD"),
        subtotal: z.string(),
        taxRate: z.string().default("0"),
        taxAmount: z.string().default("0"),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.string().default("0"),
        discountAmount: z.string().default("0"),
        total: z.string(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        issueDate: z.date(),
        validUntil: z.date(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.string(),
          rate: z.string(),
          amount: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { lineItems, ...estimateData } = input;
        
        // Create estimate
        const estimate = await db.createEstimate({
          userId: ctx.user.id,
          ...estimateData,
        });
        
        // Create line items
        if (lineItems.length > 0) {
          await db.createEstimateLineItems(
            lineItems.map((item, index) => ({
              estimateId: estimate.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
              sortOrder: index,
            }))
          );
        }
        
        return estimate;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        title: z.string().nullable().optional(),
        status: z.enum(["draft", "sent", "viewed", "accepted", "rejected", "expired", "converted"]).optional(),
        currency: z.string().optional(),
        subtotal: z.string().optional(),
        taxRate: z.string().optional(),
        taxAmount: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.string().optional(),
        discountAmount: z.string().optional(),
        total: z.string().optional(),
        notes: z.string().nullable().optional(),
        terms: z.string().nullable().optional(),
        issueDate: z.date().optional(),
        validUntil: z.date().optional(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.string(),
          rate: z.string(),
          amount: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, lineItems, ...data } = input;
        
        // Update estimate
        await db.updateEstimate(id, ctx.user.id, data);
        
        // Update line items if provided
        if (lineItems) {
          await db.deleteEstimateLineItems(id);
          if (lineItems.length > 0) {
            await db.createEstimateLineItems(
              lineItems.map((item, index) => ({
                estimateId: id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount,
                sortOrder: index,
              }))
            );
          }
        }
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEstimate(input.id, ctx.user.id);
        return { success: true };
      }),

    convertToInvoice: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.convertEstimateToInvoice(input.id, ctx.user.id);
      }),

    markAsSent: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateEstimate(input.id, ctx.user.id, {
          status: 'sent',
          sentAt: new Date(),
        });
        return { success: true };
      }),

    markAsAccepted: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateEstimate(input.id, ctx.user.id, {
          status: 'accepted',
          acceptedAt: new Date(),
        });
        return { success: true };
      }),

    markAsRejected: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateEstimate(input.id, ctx.user.id, {
          status: 'rejected',
          rejectedAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // AI Features Router
  ai: router({
    // Get current AI credits status
    getCredits: protectedProcedure.query(async ({ ctx }) => {
      const isPro = ctx.user.subscriptionStatus === 'active';
      const credits = await db.getAiCredits(ctx.user.id, isPro);
      return {
        used: credits.creditsUsed,
        limit: credits.creditsLimit,
        remaining: credits.creditsLimit - credits.creditsUsed,
        isPro,
      };
    }),

    // Smart Compose - Extract invoice data from natural language
    smartCompose: protectedProcedure
      .input(z.object({
        text: z.string().min(3).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const isPro = ctx.user.subscriptionStatus === 'active';
        
        // Get existing clients for better matching
        const clients = await db.getClientsByUserId(ctx.user.id);
        const clientList = clients.map(c => ({
          id: c.id,
          name: c.name || '',
          email: c.email || undefined,
        }));

        const result = await extractInvoiceData(
          input.text,
          ctx.user.id,
          isPro,
          clientList
        );

        // Get updated credits
        const credits = await db.getAiCredits(ctx.user.id, isPro);

        return {
          ...result,
          creditsRemaining: credits.creditsLimit - credits.creditsUsed,
        };
      }),

    // Get AI usage stats
    getUsageStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAiUsageStats(ctx.user.id, 30);
    }),

    // AI Chat - Conversational assistant
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(2000),
        context: z.object({
          currentPage: z.string().optional(),
          conversationHistory: z.array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
          })).optional(),
          stats: z.object({
            totalRevenue: z.number().optional(),
            outstandingBalance: z.number().optional(),
            totalInvoices: z.number().optional(),
            paidInvoices: z.number().optional(),
          }).optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { chatWithAssistant } = await import('./ai/assistant');
        const isPro = ctx.user.subscriptionStatus === 'active';
        
        const result = await chatWithAssistant(
          input.message,
          ctx.user.id,
          isPro,
          input.context
        );

        return result;
      }),
  }),

  // QuickBooks Integration
  // Batch Invoice Templates
  batchTemplates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBatchInvoiceTemplates(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getBatchInvoiceTemplateById(input.id, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        dueInDays: z.number().min(0).max(365).default(30),
        currency: z.string().default('USD'),
        taxRate: z.string().default('0'),
        invoiceTemplateId: z.number().optional(),
        notes: z.string().optional(),
        paymentTerms: z.string().optional(),
        frequency: z.enum(['one-time', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.string(),
          rate: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { lineItems, ...templateData } = input;
        return await db.createBatchInvoiceTemplate(
          { ...templateData, userId: ctx.user.id },
          lineItems
        );
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().nullable().optional(),
        dueInDays: z.number().min(0).max(365).optional(),
        currency: z.string().optional(),
        taxRate: z.string().optional(),
        invoiceTemplateId: z.number().nullable().optional(),
        notes: z.string().nullable().optional(),
        paymentTerms: z.string().nullable().optional(),
        frequency: z.enum(['one-time', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.string(),
          rate: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, lineItems, ...data } = input;
        await db.updateBatchInvoiceTemplate(id, ctx.user.id, data, lineItems);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteBatchInvoiceTemplate(input.id, ctx.user.id);
        return { success: true };
      }),

    incrementUsage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.incrementBatchTemplateUsage(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  quickbooks: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getConnectionStatus, isQuickBooksConfigured } = await import('./quickbooks');
      if (!isQuickBooksConfigured()) return { configured: false, connected: false, companyName: null, realmId: null, environment: null, lastSyncAt: null };
      const status = await getConnectionStatus(ctx.user.id);
      return { configured: true, ...status };
    }),

    getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
      const { getAuthorizationUrl, isQuickBooksConfigured } = await import('./quickbooks');
      if (!isQuickBooksConfigured()) throw new Error('QuickBooks integration is not configured');
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, timestamp: Date.now() })).toString('base64');
      return { url: getAuthorizationUrl(state), state };
    }),

    handleCallback: protectedProcedure
      .input(z.object({ code: z.string(), realmId: z.string(), state: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { exchangeCodeForTokens } = await import('./quickbooks');
        try {
          const stateData = JSON.parse(Buffer.from(input.state, 'base64').toString());
          if (stateData.userId !== ctx.user.id) throw new Error('Invalid state parameter');
          if (Date.now() - stateData.timestamp > 10 * 60 * 1000) throw new Error('Authorization expired');
        } catch (e: any) {
          if (e.message.includes('Invalid') || e.message.includes('expired')) throw e;
          throw new Error('Invalid state parameter');
        }
        const result = await exchangeCodeForTokens(input.code, input.realmId, ctx.user.id);
        if (!result.success) throw new Error(result.error || 'Failed to connect');
        return { success: true };
      }),

    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      const { disconnectQuickBooks } = await import('./quickbooks');
      const result = await disconnectQuickBooks(ctx.user.id);
      if (!result.success) throw new Error(result.error || 'Failed to disconnect');
      return { success: true };
    }),

    syncClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { syncClientToQB, getConnectionStatus } = await import('./quickbooks');
        const status = await getConnectionStatus(ctx.user.id);
        if (!status.connected) throw new Error('Not connected to QuickBooks');
        const result = await syncClientToQB(ctx.user.id, input.clientId);
        if (!result.success) throw new Error(result.error || 'Failed to sync client');
        return { success: true, qbCustomerId: result.qbCustomerId };
      }),

    syncAllClients: protectedProcedure.mutation(async ({ ctx }) => {
      const { syncAllClientsToQB, getConnectionStatus } = await import('./quickbooks');
      const status = await getConnectionStatus(ctx.user.id);
      if (!status.connected) throw new Error('Not connected to QuickBooks');
      return await syncAllClientsToQB(ctx.user.id);
    }),

    syncInvoice: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { syncInvoiceToQB, getConnectionStatus } = await import('./quickbooks');
        const status = await getConnectionStatus(ctx.user.id);
        if (!status.connected) throw new Error('Not connected to QuickBooks');
        const result = await syncInvoiceToQB(ctx.user.id, input.invoiceId);
        if (!result.success) throw new Error(result.error || 'Failed to sync invoice');
        return { success: true, qbInvoiceId: result.qbInvoiceId };
      }),

    syncAllInvoices: protectedProcedure.mutation(async ({ ctx }) => {
      const { syncAllInvoicesToQB, getConnectionStatus } = await import('./quickbooks');
      const status = await getConnectionStatus(ctx.user.id);
      if (!status.connected) throw new Error('Not connected to QuickBooks');
      return await syncAllInvoicesToQB(ctx.user.id);
    }),

    getClientSyncStatus: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getClientSyncStatus } = await import('./quickbooks');
        return await getClientSyncStatus(ctx.user.id, input.clientId);
      }),

    getInvoiceSyncStatus: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getInvoiceSyncStatus } = await import('./quickbooks');
        return await getInvoiceSyncStatus(ctx.user.id, input.invoiceId);
      }),

    getSyncHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { getSyncHistory } = await import('./quickbooks');
        return await getSyncHistory(ctx.user.id, input.limit || 50);
      }),

    // Sync Settings
    getSyncSettings: protectedProcedure.query(async ({ ctx }) => {
      const { getSyncSettings } = await import('./quickbooks');
      return await getSyncSettings(ctx.user.id);
    }),

    updateSyncSettings: protectedProcedure
      .input(z.object({
        autoSyncInvoices: z.boolean().optional(),
        autoSyncPayments: z.boolean().optional(),
        syncPaymentsFromQB: z.boolean().optional(),
        minInvoiceAmount: z.string().nullable().optional(),
        syncDraftInvoices: z.boolean().optional(),
        pollIntervalMinutes: z.number().min(15).max(1440).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateSyncSettings } = await import('./quickbooks');
        const result = await updateSyncSettings(ctx.user.id, input);
        if (!result.success) throw new Error(result.error || 'Failed to update settings');
        return { success: true };
      }),

    // Payment Sync
    syncPayment: protectedProcedure
      .input(z.object({ paymentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { syncPaymentToQB, getConnectionStatus } = await import('./quickbooks');
        const status = await getConnectionStatus(ctx.user.id);
        if (!status.connected) throw new Error('Not connected to QuickBooks');
        const result = await syncPaymentToQB(ctx.user.id, input.paymentId);
        if (!result.success) throw new Error(result.error || 'Failed to sync payment');
        return { success: true, qbPaymentId: result.qbPaymentId };
      }),

    pollPayments: protectedProcedure.mutation(async ({ ctx }) => {
      const { pollPaymentsFromQB, getConnectionStatus } = await import('./quickbooks');
      const status = await getConnectionStatus(ctx.user.id);
      if (!status.connected) throw new Error('Not connected to QuickBooks');
      return await pollPaymentsFromQB(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
