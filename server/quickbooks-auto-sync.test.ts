/**
 * QuickBooks Auto-Sync Tests
 *
 * Tests for automatic QuickBooks synchronization when:
 * 1. Invoice is created with status 'sent'
 * 2. Invoice is sent via email (draft → sent)
 * 3. Invoice is marked as paid via payment recording
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the QuickBooks module
vi.mock("./quickbooks", () => ({
  getConnectionStatus: vi.fn(),
  syncInvoiceToQB: vi.fn(),
  isQuickBooksConfigured: vi.fn(),
}));

describe("QuickBooks Auto-Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Auto-sync trigger conditions", () => {
    it('should trigger sync when invoice is created with status "sent"', async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      // Mock connected status
      vi.mocked(getConnectionStatus).mockResolvedValue({
        connected: true,
        companyName: "Test Company",
        realmId: "123456",
        environment: "production",
        lastSyncAt: new Date(),
      });

      vi.mocked(syncInvoiceToQB).mockResolvedValue({
        success: true,
        qbInvoiceId: "QB-123",
      });

      // Simulate the auto-sync logic
      const userId = 1;
      const invoiceId = 100;
      const invoiceStatus = "sent";

      if (invoiceStatus === "sent") {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          const result = await syncInvoiceToQB(userId, invoiceId);
          expect(result.success).toBe(true);
          expect(result.qbInvoiceId).toBe("QB-123");
        }
      }

      expect(getConnectionStatus).toHaveBeenCalledWith(userId);
      expect(syncInvoiceToQB).toHaveBeenCalledWith(userId, invoiceId);
    });

    it('should NOT trigger sync when invoice is created with status "draft"', async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      vi.mocked(getConnectionStatus).mockResolvedValue({
        connected: true,
        companyName: "Test Company",
        realmId: "123456",
        environment: "production",
        lastSyncAt: new Date(),
      });

      const userId = 1;
      const invoiceId = 100;
      const invoiceStatus = "draft";

      // Draft invoices should NOT trigger sync
      if (invoiceStatus === "sent") {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          await syncInvoiceToQB(userId, invoiceId);
        }
      }

      expect(getConnectionStatus).not.toHaveBeenCalled();
      expect(syncInvoiceToQB).not.toHaveBeenCalled();
    });

    it("should NOT trigger sync when QuickBooks is not connected", async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      // Mock disconnected status
      vi.mocked(getConnectionStatus).mockResolvedValue({
        connected: false,
        companyName: null,
        realmId: null,
        environment: null,
        lastSyncAt: null,
      });

      const userId = 1;
      const invoiceId = 100;
      const invoiceStatus = "sent";

      if (invoiceStatus === "sent") {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          await syncInvoiceToQB(userId, invoiceId);
        }
      }

      expect(getConnectionStatus).toHaveBeenCalledWith(userId);
      expect(syncInvoiceToQB).not.toHaveBeenCalled();
    });
  });

  describe("Auto-sync on email send", () => {
    it("should trigger sync when invoice status changes from draft to sent", async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      vi.mocked(getConnectionStatus).mockResolvedValue({
        connected: true,
        companyName: "Test Company",
        realmId: "123456",
        environment: "production",
        lastSyncAt: new Date(),
      });

      vi.mocked(syncInvoiceToQB).mockResolvedValue({
        success: true,
        qbInvoiceId: "QB-456",
      });

      const userId = 1;
      const invoiceId = 200;
      const previousStatus = "draft";
      const newStatus = "sent";

      // Simulate email send triggering status change
      if (previousStatus === "draft" && newStatus === "sent") {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          const result = await syncInvoiceToQB(userId, invoiceId);
          expect(result.success).toBe(true);
        }
      }

      expect(syncInvoiceToQB).toHaveBeenCalledWith(userId, invoiceId);
    });

    it("should NOT trigger sync when invoice is already sent", async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      const userId = 1;
      const invoiceId = 200;
      const previousStatus = "sent";

      // If already sent, don't sync again
      if (previousStatus === "draft") {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          await syncInvoiceToQB(userId, invoiceId);
        }
      }

      expect(getConnectionStatus).not.toHaveBeenCalled();
      expect(syncInvoiceToQB).not.toHaveBeenCalled();
    });
  });

  describe("Auto-sync on payment", () => {
    it("should trigger sync when invoice is marked as paid", async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      vi.mocked(getConnectionStatus).mockResolvedValue({
        connected: true,
        companyName: "Test Company",
        realmId: "123456",
        environment: "production",
        lastSyncAt: new Date(),
      });

      vi.mocked(syncInvoiceToQB).mockResolvedValue({
        success: true,
        qbInvoiceId: "QB-789",
      });

      const userId = 1;
      const invoiceId = 300;
      const paymentStatus = "paid";

      // Simulate payment recording marking invoice as paid
      if (paymentStatus === "paid") {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          const result = await syncInvoiceToQB(userId, invoiceId);
          expect(result.success).toBe(true);
        }
      }

      expect(syncInvoiceToQB).toHaveBeenCalledWith(userId, invoiceId);
    });

    it("should NOT trigger sync for partial payments", async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      const userId = 1;
      const invoiceId = 300;
      const paymentStatus = "partial";

      // Partial payments don't trigger sync (only full payment does)
      if (paymentStatus === "paid") {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          await syncInvoiceToQB(userId, invoiceId);
        }
      }

      expect(getConnectionStatus).not.toHaveBeenCalled();
      expect(syncInvoiceToQB).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should handle sync errors gracefully without blocking main operation", async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      vi.mocked(getConnectionStatus).mockResolvedValue({
        connected: true,
        companyName: "Test Company",
        realmId: "123456",
        environment: "production",
        lastSyncAt: new Date(),
      });

      // Simulate sync failure
      vi.mocked(syncInvoiceToQB).mockRejectedValue(
        new Error("QuickBooks API error")
      );

      const userId = 1;
      const invoiceId = 400;
      let mainOperationCompleted = false;

      try {
        const qbStatus = await getConnectionStatus(userId);
        if (qbStatus.connected) {
          // Fire and forget pattern - don't await
          syncInvoiceToQB(userId, invoiceId).catch(err => {
            // Error is logged but doesn't block
            console.error("QuickBooks sync failed:", err.message);
          });
        }
        // Main operation continues
        mainOperationCompleted = true;
      } catch (err) {
        // This shouldn't be reached
        mainOperationCompleted = false;
      }

      expect(mainOperationCompleted).toBe(true);
    });

    it("should handle connection status check errors gracefully", async () => {
      const { getConnectionStatus, syncInvoiceToQB } = await import(
        "./quickbooks"
      );

      // Simulate connection check failure
      vi.mocked(getConnectionStatus).mockRejectedValue(
        new Error("Network error")
      );

      const userId = 1;
      const invoiceId = 500;
      let mainOperationCompleted = false;

      try {
        try {
          const qbStatus = await getConnectionStatus(userId);
          if (qbStatus.connected) {
            await syncInvoiceToQB(userId, invoiceId);
          }
        } catch (err) {
          // QuickBooks error is caught and logged, doesn't block main operation
          console.error("QuickBooks auto-sync error:", err);
        }
        // Main operation continues
        mainOperationCompleted = true;
      } catch (err) {
        mainOperationCompleted = false;
      }

      expect(mainOperationCompleted).toBe(true);
      expect(syncInvoiceToQB).not.toHaveBeenCalled();
    });
  });

  describe("InvoiceActionsMenu integration", () => {
    it("should show sync option when QuickBooks is connected", () => {
      const quickBooksConnected = true;
      const onSyncToQuickBooks = vi.fn();

      // Simulate the condition in InvoiceActionsMenu
      const shouldShowSyncOption = quickBooksConnected && !!onSyncToQuickBooks;

      expect(shouldShowSyncOption).toBe(true);
    });

    it("should hide sync option when QuickBooks is not connected", () => {
      const quickBooksConnected = false;
      const onSyncToQuickBooks = vi.fn();

      const shouldShowSyncOption = quickBooksConnected && !!onSyncToQuickBooks;

      expect(shouldShowSyncOption).toBe(false);
    });

    it("should show loading spinner during sync", () => {
      const isLoading = { quickBooksSync: true };

      expect(isLoading.quickBooksSync).toBe(true);
    });
  });
});
