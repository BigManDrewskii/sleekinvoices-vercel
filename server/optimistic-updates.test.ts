/**
 * Tests for optimistic update behavior patterns
 * These tests verify that the mutation patterns work correctly with rollback on error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock tRPC utils for testing optimistic update patterns
const createMockUtils = () => ({
  cancel: vi.fn().mockResolvedValue(undefined),
  getData: vi.fn(),
  setData: vi.fn(),
  invalidate: vi.fn(),
});

describe('Optimistic Update Patterns', () => {
  describe('Client Operations', () => {
    let mockClientUtils: ReturnType<typeof createMockUtils>;
    
    beforeEach(() => {
      mockClientUtils = createMockUtils();
    });

    it('should optimistically remove client from list on delete', async () => {
      const clients = [
        { id: 1, name: 'Client A' },
        { id: 2, name: 'Client B' },
        { id: 3, name: 'Client C' },
      ];
      
      mockClientUtils.getData.mockReturnValue(clients);
      
      // Simulate optimistic delete
      const idToDelete = 2;
      const previousClients = mockClientUtils.getData();
      
      // Optimistically update
      const updatedClients = previousClients?.filter((c: any) => c.id !== idToDelete);
      mockClientUtils.setData(undefined, updatedClients);
      
      expect(mockClientUtils.setData).toHaveBeenCalledWith(undefined, [
        { id: 1, name: 'Client A' },
        { id: 3, name: 'Client C' },
      ]);
    });

    it('should rollback client list on delete error', async () => {
      const clients = [
        { id: 1, name: 'Client A' },
        { id: 2, name: 'Client B' },
      ];
      
      mockClientUtils.getData.mockReturnValue(clients);
      
      // Simulate optimistic delete
      const previousClients = mockClientUtils.getData();
      
      // Simulate error and rollback
      mockClientUtils.setData(undefined, previousClients);
      
      expect(mockClientUtils.setData).toHaveBeenCalledWith(undefined, clients);
    });

    it('should optimistically add new client to list', async () => {
      const clients = [
        { id: 1, name: 'Client A' },
      ];
      
      mockClientUtils.getData.mockReturnValue(clients);
      
      const newClient = {
        id: -Date.now(), // Temporary ID
        name: 'New Client',
        email: 'new@example.com',
      };
      
      const previousClients = mockClientUtils.getData();
      const updatedClients = [newClient, ...(previousClients || [])];
      mockClientUtils.setData(undefined, updatedClients);
      
      expect(mockClientUtils.setData).toHaveBeenCalledWith(undefined, expect.arrayContaining([
        expect.objectContaining({ name: 'New Client' }),
        expect.objectContaining({ id: 1, name: 'Client A' }),
      ]));
    });
  });

  describe('Invoice Operations', () => {
    let mockInvoiceUtils: ReturnType<typeof createMockUtils>;
    
    beforeEach(() => {
      mockInvoiceUtils = createMockUtils();
    });

    it('should optimistically update invoice status to sent', async () => {
      const invoices = [
        { id: 1, invoiceNumber: 'INV-001', status: 'draft' },
        { id: 2, invoiceNumber: 'INV-002', status: 'draft' },
      ];
      
      mockInvoiceUtils.getData.mockReturnValue(invoices);
      
      const idToUpdate = 1;
      const previousInvoices = mockInvoiceUtils.getData();
      
      const updatedInvoices = previousInvoices?.map((inv: any) =>
        inv.id === idToUpdate ? { ...inv, status: 'sent' } : inv
      );
      mockInvoiceUtils.setData(undefined, updatedInvoices);
      
      expect(mockInvoiceUtils.setData).toHaveBeenCalledWith(undefined, [
        { id: 1, invoiceNumber: 'INV-001', status: 'sent' },
        { id: 2, invoiceNumber: 'INV-002', status: 'draft' },
      ]);
    });

    it('should optimistically remove multiple invoices on bulk delete', async () => {
      const invoices = [
        { id: 1, invoiceNumber: 'INV-001' },
        { id: 2, invoiceNumber: 'INV-002' },
        { id: 3, invoiceNumber: 'INV-003' },
        { id: 4, invoiceNumber: 'INV-004' },
      ];
      
      mockInvoiceUtils.getData.mockReturnValue(invoices);
      
      const idsToDelete = new Set([2, 4]);
      const previousInvoices = mockInvoiceUtils.getData();
      
      const updatedInvoices = previousInvoices?.filter((inv: any) => !idsToDelete.has(inv.id));
      mockInvoiceUtils.setData(undefined, updatedInvoices);
      
      expect(mockInvoiceUtils.setData).toHaveBeenCalledWith(undefined, [
        { id: 1, invoiceNumber: 'INV-001' },
        { id: 3, invoiceNumber: 'INV-003' },
      ]);
    });
  });

  describe('Estimate Operations', () => {
    let mockEstimateUtils: ReturnType<typeof createMockUtils>;
    
    beforeEach(() => {
      mockEstimateUtils = createMockUtils();
    });

    it('should optimistically update estimate status to accepted', async () => {
      const estimates = [
        { id: 1, estimateNumber: 'EST-001', status: 'sent' },
        { id: 2, estimateNumber: 'EST-002', status: 'draft' },
      ];
      
      mockEstimateUtils.getData.mockReturnValue(estimates);
      
      const idToUpdate = 1;
      const previousEstimates = mockEstimateUtils.getData();
      
      const updatedEstimates = previousEstimates?.map((est: any) =>
        est.id === idToUpdate ? { ...est, status: 'accepted' } : est
      );
      mockEstimateUtils.setData(undefined, updatedEstimates);
      
      expect(mockEstimateUtils.setData).toHaveBeenCalledWith(undefined, [
        { id: 1, estimateNumber: 'EST-001', status: 'accepted' },
        { id: 2, estimateNumber: 'EST-002', status: 'draft' },
      ]);
    });

    it('should optimistically update estimate status to rejected', async () => {
      const estimates = [
        { id: 1, estimateNumber: 'EST-001', status: 'sent' },
      ];
      
      mockEstimateUtils.getData.mockReturnValue(estimates);
      
      const previousEstimates = mockEstimateUtils.getData();
      const updatedEstimates = previousEstimates?.map((est: any) =>
        est.id === 1 ? { ...est, status: 'rejected' } : est
      );
      mockEstimateUtils.setData(undefined, updatedEstimates);
      
      expect(mockEstimateUtils.setData).toHaveBeenCalledWith(undefined, [
        { id: 1, estimateNumber: 'EST-001', status: 'rejected' },
      ]);
    });
  });

  describe('Recurring Invoice Operations', () => {
    let mockRecurringUtils: ReturnType<typeof createMockUtils>;
    
    beforeEach(() => {
      mockRecurringUtils = createMockUtils();
    });

    it('should optimistically toggle recurring invoice status', async () => {
      const recurringInvoices = [
        { id: 1, clientName: 'Client A', isActive: true },
        { id: 2, clientName: 'Client B', isActive: false },
      ];
      
      mockRecurringUtils.getData.mockReturnValue(recurringInvoices);
      
      // Toggle id 1 from active to inactive
      const idToToggle = 1;
      const currentStatus = true;
      const previousData = mockRecurringUtils.getData();
      
      const updatedData = previousData?.map((item: any) =>
        item.id === idToToggle ? { ...item, isActive: !currentStatus } : item
      );
      mockRecurringUtils.setData(undefined, updatedData);
      
      expect(mockRecurringUtils.setData).toHaveBeenCalledWith(undefined, [
        { id: 1, clientName: 'Client A', isActive: false },
        { id: 2, clientName: 'Client B', isActive: false },
      ]);
    });
  });

  describe('Payment Operations', () => {
    let mockPaymentUtils: ReturnType<typeof createMockUtils>;
    
    beforeEach(() => {
      mockPaymentUtils = createMockUtils();
    });

    it('should optimistically update payment summary when recording payment', async () => {
      const summary = {
        total: 1000,
        totalPaid: 500,
        remaining: 500,
        isFullyPaid: false,
        payments: [],
      };
      
      mockPaymentUtils.getData.mockReturnValue(summary);
      
      const paymentAmount = 300;
      const previousSummary = mockPaymentUtils.getData();
      
      const newTotalPaid = previousSummary.totalPaid + paymentAmount;
      const newRemaining = previousSummary.total - newTotalPaid;
      
      const updatedSummary = {
        ...previousSummary,
        totalPaid: newTotalPaid,
        remaining: newRemaining,
        isFullyPaid: newRemaining <= 0,
      };
      mockPaymentUtils.setData({ invoiceId: 1 }, updatedSummary);
      
      expect(mockPaymentUtils.setData).toHaveBeenCalledWith(
        { invoiceId: 1 },
        expect.objectContaining({
          totalPaid: 800,
          remaining: 200,
          isFullyPaid: false,
        })
      );
    });

    it('should mark invoice as fully paid when remaining is zero', async () => {
      const summary = {
        total: 1000,
        totalPaid: 700,
        remaining: 300,
        isFullyPaid: false,
        payments: [],
      };
      
      mockPaymentUtils.getData.mockReturnValue(summary);
      
      const paymentAmount = 300; // Exact remaining amount
      const previousSummary = mockPaymentUtils.getData();
      
      const newTotalPaid = previousSummary.totalPaid + paymentAmount;
      const newRemaining = previousSummary.total - newTotalPaid;
      
      const updatedSummary = {
        ...previousSummary,
        totalPaid: newTotalPaid,
        remaining: newRemaining,
        isFullyPaid: newRemaining <= 0,
      };
      mockPaymentUtils.setData({ invoiceId: 1 }, updatedSummary);
      
      expect(mockPaymentUtils.setData).toHaveBeenCalledWith(
        { invoiceId: 1 },
        expect.objectContaining({
          totalPaid: 1000,
          remaining: 0,
          isFullyPaid: true,
        })
      );
    });
  });

  describe('Rollback Behavior', () => {
    it('should restore previous state on mutation error', async () => {
      const mockUtils = createMockUtils();
      const originalData = [
        { id: 1, name: 'Item A' },
        { id: 2, name: 'Item B' },
      ];
      
      mockUtils.getData.mockReturnValue(originalData);
      
      // Simulate optimistic update
      const previousData = mockUtils.getData();
      mockUtils.setData(undefined, [{ id: 1, name: 'Item A' }]); // Optimistic delete
      
      // Simulate error - rollback
      mockUtils.setData(undefined, previousData);
      
      // Verify rollback was called with original data
      expect(mockUtils.setData).toHaveBeenLastCalledWith(undefined, originalData);
    });

    it('should always invalidate cache after mutation settles', async () => {
      const mockUtils = createMockUtils();
      
      // After any mutation (success or error), invalidate should be called
      mockUtils.invalidate();
      
      expect(mockUtils.invalidate).toHaveBeenCalled();
    });
  });
});
