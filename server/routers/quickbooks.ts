import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const quickbooksRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { getConnectionStatus, isQuickBooksConfigured } = await import(
      "../quickbooks"
    );
    if (!isQuickBooksConfigured())
      return {
        configured: false,
        connected: false,
        companyName: null,
        realmId: null,
        environment: null,
        lastSyncAt: null,
      };
    const status = await getConnectionStatus(ctx.user.id);
    return { configured: true, ...status };
  }),

  getAuthUrl: protectedProcedure.query(async ({ ctx }) => {
    const { getAuthorizationUrl, isQuickBooksConfigured } = await import(
      "../quickbooks"
    );
    if (!isQuickBooksConfigured())
      throw new Error("QuickBooks integration is not configured");
    const state = Buffer.from(
      JSON.stringify({ userId: ctx.user.id, timestamp: Date.now() })
    ).toString("base64");
    return { url: getAuthorizationUrl(state), state };
  }),

  handleCallback: protectedProcedure
    .input(
      z.object({ code: z.string(), realmId: z.string(), state: z.string() })
    )
    .mutation(async ({ ctx, input }) => {
      const { exchangeCodeForTokens } = await import("../quickbooks");
      try {
        const stateData = JSON.parse(
          Buffer.from(input.state, "base64").toString()
        );
        if (stateData.userId !== ctx.user.id)
          throw new Error("Invalid state parameter");
        if (Date.now() - stateData.timestamp > 10 * 60 * 1000)
          throw new Error("Authorization expired");
      } catch (e: any) {
        if (e.message.includes("Invalid") || e.message.includes("expired"))
          throw e;
        throw new Error("Invalid state parameter");
      }
      const result = await exchangeCodeForTokens(
        input.code,
        input.realmId,
        ctx.user.id
      );
      if (!result.success)
        throw new Error(result.error || "Failed to connect");
      return { success: true };
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const { disconnectQuickBooks } = await import("../quickbooks");
    const result = await disconnectQuickBooks(ctx.user.id);
    if (!result.success)
      throw new Error(result.error || "Failed to disconnect");
    return { success: true };
  }),

  syncClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { syncClientToQB, getConnectionStatus } = await import(
        "../quickbooks"
      );
      const status = await getConnectionStatus(ctx.user.id);
      if (!status.connected) throw new Error("Not connected to QuickBooks");
      const result = await syncClientToQB(ctx.user.id, input.clientId);
      if (!result.success)
        throw new Error(result.error || "Failed to sync client");
      return { success: true, qbCustomerId: result.qbCustomerId };
    }),

  syncAllClients: protectedProcedure.mutation(async ({ ctx }) => {
    const { syncAllClientsToQB, getConnectionStatus } = await import(
      "../quickbooks"
    );
    const status = await getConnectionStatus(ctx.user.id);
    if (!status.connected) throw new Error("Not connected to QuickBooks");
    return await syncAllClientsToQB(ctx.user.id);
  }),

  syncInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { syncInvoiceToQB, getConnectionStatus } = await import(
        "../quickbooks"
      );
      const status = await getConnectionStatus(ctx.user.id);
      if (!status.connected) throw new Error("Not connected to QuickBooks");
      const result = await syncInvoiceToQB(ctx.user.id, input.invoiceId);
      if (!result.success)
        throw new Error(result.error || "Failed to sync invoice");
      return { success: true, qbInvoiceId: result.qbInvoiceId };
    }),

  syncAllInvoices: protectedProcedure.mutation(async ({ ctx }) => {
    const { syncAllInvoicesToQB, getConnectionStatus } = await import(
      "../quickbooks"
    );
    const status = await getConnectionStatus(ctx.user.id);
    if (!status.connected) throw new Error("Not connected to QuickBooks");
    return await syncAllInvoicesToQB(ctx.user.id);
  }),

  getClientSyncStatus: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getClientSyncStatus } = await import("../quickbooks");
      return await getClientSyncStatus(ctx.user.id, input.clientId);
    }),

  getInvoiceSyncStatus: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getInvoiceSyncStatus } = await import("../quickbooks");
      return await getInvoiceSyncStatus(ctx.user.id, input.invoiceId);
    }),

  getSyncHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const { getSyncHistory } = await import("../quickbooks");
      return await getSyncHistory(ctx.user.id, input.limit || 50);
    }),

  // Sync Settings
  getSyncSettings: protectedProcedure.query(async ({ ctx }) => {
    const { getSyncSettings } = await import("../quickbooks");
    return await getSyncSettings(ctx.user.id);
  }),

  updateSyncSettings: protectedProcedure
    .input(
      z.object({
        autoSyncInvoices: z.boolean().optional(),
        autoSyncPayments: z.boolean().optional(),
        syncPaymentsFromQB: z.boolean().optional(),
        minInvoiceAmount: z.string().nullable().optional(),
        syncDraftInvoices: z.boolean().optional(),
        pollIntervalMinutes: z.number().min(15).max(1440).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { updateSyncSettings } = await import("../quickbooks");
      const result = await updateSyncSettings(ctx.user.id, input);
      if (!result.success)
        throw new Error(result.error || "Failed to update settings");
      return { success: true };
    }),

  // Payment Sync
  syncPayment: protectedProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { syncPaymentToQB, getConnectionStatus } = await import(
        "../quickbooks"
      );
      const status = await getConnectionStatus(ctx.user.id);
      if (!status.connected) throw new Error("Not connected to QuickBooks");
      const result = await syncPaymentToQB(ctx.user.id, input.paymentId);
      if (!result.success)
        throw new Error(result.error || "Failed to sync payment");
      return { success: true, qbPaymentId: result.qbPaymentId };
    }),

  pollPayments: protectedProcedure.mutation(async ({ ctx }) => {
    const { pollPaymentsFromQB, getConnectionStatus } = await import(
      "../quickbooks"
    );
    const status = await getConnectionStatus(ctx.user.id);
    if (!status.connected) throw new Error("Not connected to QuickBooks");
    return await pollPaymentsFromQB(ctx.user.id);
  }),
});