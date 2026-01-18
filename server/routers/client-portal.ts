import {
  protectedProcedure,
  publicProcedure,
  router,
  TRPCError,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { invoices } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as nowpayments from "../lib/nowpayments";

export const clientPortalRouter = router({
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
        throw new Error("Invalid or expired access token");
      }
      return client;
    }),

  // Get invoices for a client (public)
  getInvoices: publicProcedure
    .input(z.object({ accessToken: z.string() }))
    .query(async ({ input }) => {
      const client = await db.getClientByAccessToken(input.accessToken);
      if (!client) {
        throw new Error("Invalid or expired access token");
      }

      return await db.getClientInvoices(client.id);
    }),

  // Get single invoice details (public)
  getInvoice: publicProcedure
    .input(z.object({ accessToken: z.string(), invoiceId: z.number() }))
    .query(async ({ input, ctx }) => {
      const client = await db.getClientByAccessToken(input.accessToken);
      if (!client) {
        throw new Error("Invalid or expired access token");
      }

      const invoice = await db.getInvoiceById(input.invoiceId, client.userId);
      if (!invoice || invoice.clientId !== client.id) {
        throw new Error("Invoice not found");
      }

      // Track this view
      const ipAddress =
        (ctx.req.headers["x-forwarded-for"] as string) ||
        ctx.req.socket?.remoteAddress;
      const userAgent = ctx.req.headers["user-agent"] as string;
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
    .input(
      z.object({
        clientId: z.number(),
        accessToken: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const client = await db.getClientById(input.clientId, ctx.user.id);
      if (!client) {
        throw new Error("Client not found");
      }

      if (!client.email) {
        throw new Error("Client does not have an email address");
      }

      // Import email template
      const { generatePortalInvitationEmail } = await import(
        "../email-templates/portal-invitation"
      );

      // Generate email content
      const portalUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace("/api", "") || "http://localhost:3000"}/portal/${input.accessToken}`;
      const { subject, html, text } = generatePortalInvitationEmail({
        clientName: client.name,
        portalUrl,
        companyName: ctx.user.companyName || ctx.user.name || "SleekInvoices",
        expiresInDays: 90,
      });

      // Send email using Resend
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const result = await resend.emails.send({
        from: `${ctx.user.name || ctx.user.companyName || "SleekInvoices"} <portal@sleekinvoices.com>`,
        replyTo: ctx.user.email || "support@sleekinvoices.com",
        to: [client.email],
        subject,
        html,
        text,
      });

      if (result.error) {
        // Log failed email - use invoiceId 0 for portal invitations
        try {
          await db.logEmail({
            userId: ctx.user.id,
            invoiceId: 0, // Portal invitation, not tied to specific invoice
            recipientEmail: client.email,
            subject,
            emailType: "invoice", // Using 'invoice' as closest type for portal
            success: false,
            errorMessage: result.error.message,
          });
        } catch (logError) {
          console.error("[Email] Failed to log email error:", logError);
        }
        throw new Error(result.error.message);
      }

      // Log successful email
      try {
        await db.logEmail({
          userId: ctx.user.id,
          invoiceId: 0, // Portal invitation, not tied to specific invoice
          recipientEmail: client.email,
          subject,
          emailType: "invoice", // Using 'invoice' as closest type for portal
          success: true,
          messageId: result.data?.id,
        });
      } catch (logError) {
        console.error("[Email] Failed to log email:", logError);
      }

      return { success: true };
    }),

  // Create crypto payment for an invoice (public - client initiated)
  createCryptoPayment: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        invoiceId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify access token and get client
      const client = await db.getClientByAccessToken(input.accessToken);
      if (!client) {
        throw new Error("Invalid or expired access token");
      }

      // Get the invoice and verify it belongs to this client
      const invoice = await db.getInvoiceById(input.invoiceId, client.userId);
      if (!invoice || invoice.clientId !== client.id) {
        throw new Error("Invoice not found");
      }

      // Check invoice status - only allow payment for unpaid invoices
      if (invoice.status === "paid") {
        throw new Error("Invoice is already paid");
      }
      if (invoice.status === "draft") {
        throw new Error("Cannot pay a draft invoice");
      }
      if (invoice.status === "canceled") {
        throw new Error("Cannot pay a cancelled invoice");
      }

      // Calculate remaining amount to pay
      const total = parseFloat(invoice.total);
      const paid = parseFloat(invoice.amountPaid || "0");
      const remaining = total - paid;

      if (remaining <= 0) {
        throw new Error("Invoice is already fully paid");
      }

      // Get the base URL for callbacks
      const baseUrl =
        process.env.VITE_APP_URL ||
        `https://${process.env.VITE_APP_ID}.manus.space`;

      // Create NOWPayments invoice - let customer choose currency on checkout
      const payment = await nowpayments.createInvoice({
        priceAmount: remaining,
        priceCurrency: invoice.currency?.toLowerCase() || "usd",
        // Don't specify payCurrency - customer will choose on NOWPayments checkout
        orderId: `INV-${invoice.id}-${Date.now()}`,
        orderDescription: `Payment for Invoice ${invoice.invoiceNumber}`,
        ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
        successUrl: `${baseUrl}/portal/${input.accessToken}?payment=success&invoiceId=${invoice.id}`,
        cancelUrl: `${baseUrl}/portal/${input.accessToken}?payment=cancelled&invoiceId=${invoice.id}`,
        isFixedRate: true,
      });

      // Update invoice with crypto payment info
      // Note: We need to update without userId check since this is client-initiated
      const dbInstance = await db.getDb();
      if (dbInstance) {
        const { invoices: invoicesTable } = await import(
          "../../drizzle/schema"
        );
        const { eq: eqDynamic } = await import("drizzle-orm");
        await dbInstance
          .update(invoicesTable)
          .set({
            cryptoPaymentId: payment.id,
            cryptoCurrency: "MULTI", // Customer will choose
            cryptoPaymentUrl: payment.invoice_url,
          })
          .where(eqDynamic(invoicesTable.id, invoice.id));
      }

      return {
        paymentId: payment.id,
        invoiceUrl: payment.invoice_url,
        priceAmount: remaining,
        priceCurrency: invoice.currency || "USD",
      };
    }),
});
