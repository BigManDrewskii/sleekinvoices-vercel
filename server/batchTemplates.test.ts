import { describe, it, expect, afterAll } from 'vitest';
import {
  createBatchInvoiceTemplate,
  getBatchInvoiceTemplates,
  getBatchInvoiceTemplateById,
  incrementBatchTemplateUsage,
  updateBatchInvoiceTemplate,
  deleteBatchInvoiceTemplate,
  getClientsByTagId,
} from './db';

// Test user ID (will use a test user)
const TEST_USER_ID = 999999999;

describe('Batch Invoice Templates', () => {
  let createdTemplateId: number | null = null;

  afterAll(async () => {
    // Clean up test data
    if (createdTemplateId) {
      try {
        await deleteBatchInvoiceTemplate(createdTemplateId, TEST_USER_ID);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  describe('createBatchInvoiceTemplate', () => {
    it('should create a batch invoice template with line items', async () => {
      const templateData = {
        userId: TEST_USER_ID,
        name: 'Monthly Retainer Test',
        description: 'Test template for monthly retainer billing',
        frequency: 'monthly' as const,
        dueInDays: 30,
        notes: 'Thank you for your business',
        invoiceTemplateId: null,
        defaultTaxRate: '0',
        defaultDiscountType: 'percentage' as const,
        defaultDiscountValue: '0',
      };

      const lineItems = [
        { description: 'Monthly Consulting', quantity: '1', rate: '5000' },
        { description: 'Support Hours', quantity: '10', rate: '150' },
      ];

      const result = await createBatchInvoiceTemplate(templateData, lineItems);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Monthly Retainer Test');
      expect(result.frequency).toBe('monthly');
      expect(result.dueInDays).toBe(30);
      expect(result.usageCount).toBe(0);

      createdTemplateId = result.id;
    });

    it('should create a template without line items', async () => {
      const templateData = {
        userId: TEST_USER_ID,
        name: 'Empty Template Test',
        description: null,
        frequency: 'one-time' as const,
        dueInDays: 14,
        notes: null,
        invoiceTemplateId: null,
        defaultTaxRate: '0',
        defaultDiscountType: 'percentage' as const,
        defaultDiscountValue: '0',
      };

      const result = await createBatchInvoiceTemplate(templateData, []);

      expect(result).toBeDefined();
      expect(result.name).toBe('Empty Template Test');
      expect(result.frequency).toBe('one-time');

      // Clean up
      await deleteBatchInvoiceTemplate(result.id, TEST_USER_ID);
    });
  });

  describe('getBatchInvoiceTemplates', () => {
    it('should return templates for a user', async () => {
      // First create a template for this user
      if (!createdTemplateId) {
        const templateData = {
          userId: TEST_USER_ID,
          name: 'Test Template',
          description: null,
          frequency: 'monthly' as const,
          dueInDays: 30,
          notes: null,
          invoiceTemplateId: null,
          defaultTaxRate: '0',
          defaultDiscountType: 'percentage' as const,
          defaultDiscountValue: '0',
        };
        const result = await createBatchInvoiceTemplate(templateData, []);
        createdTemplateId = result.id;
      }

      const templates = await getBatchInvoiceTemplates(TEST_USER_ID);

      expect(Array.isArray(templates)).toBe(true);
      // Should include the template we created earlier
      if (createdTemplateId) {
        const found = templates.find(t => t.id === createdTemplateId);
        expect(found).toBeDefined();
      }
    });
  });

  describe('getBatchInvoiceTemplateById', () => {
    it('should return template with its line items', async () => {
      if (!createdTemplateId) {
        throw new Error('No template created for testing');
      }

      const result = await getBatchInvoiceTemplateById(createdTemplateId, TEST_USER_ID);

      expect(result).toBeDefined();
      expect(result?.template).toBeDefined();
      expect(result?.template.id).toBe(createdTemplateId);
      expect(result?.lineItems).toBeDefined();
      expect(Array.isArray(result?.lineItems)).toBe(true);
    });

    it('should return null for non-existent template', async () => {
      const result = await getBatchInvoiceTemplateById(999999, TEST_USER_ID);
      expect(result).toBeNull();
    });

    it('should return null for template belonging to different user', async () => {
      if (!createdTemplateId) {
        throw new Error('No template created for testing');
      }

      const result = await getBatchInvoiceTemplateById(createdTemplateId, 888888888);
      expect(result).toBeNull();
    });
  });

  describe('incrementBatchTemplateUsage', () => {
    it('should increment usage count and update lastUsedAt', async () => {
      if (!createdTemplateId) {
        throw new Error('No template created for testing');
      }

      // Get initial state
      const before = await getBatchInvoiceTemplateById(createdTemplateId, TEST_USER_ID);
      const initialUsageCount = before?.template.usageCount || 0;

      // Increment usage
      await incrementBatchTemplateUsage(createdTemplateId, TEST_USER_ID);

      // Check updated state
      const after = await getBatchInvoiceTemplateById(createdTemplateId, TEST_USER_ID);
      expect(after?.template.usageCount).toBe(initialUsageCount + 1);
      expect(after?.template.lastUsedAt).toBeDefined();
    });
  });

  describe('updateBatchInvoiceTemplate', () => {
    it('should update template fields', async () => {
      if (!createdTemplateId) {
        throw new Error('No template created for testing');
      }

      await updateBatchInvoiceTemplate(createdTemplateId, TEST_USER_ID, {
        name: 'Updated Template Name',
        frequency: 'quarterly',
        dueInDays: 45,
      });

      const result = await getBatchInvoiceTemplateById(createdTemplateId, TEST_USER_ID);
      expect(result?.template.name).toBe('Updated Template Name');
      expect(result?.template.frequency).toBe('quarterly');
      expect(result?.template.dueInDays).toBe(45);
    });
  });

  describe('deleteBatchInvoiceTemplate', () => {
    it('should delete template and its line items', async () => {
      // Create a new template to delete
      const templateData = {
        userId: TEST_USER_ID,
        name: 'Template to Delete',
        description: null,
        frequency: 'weekly' as const,
        dueInDays: 7,
        notes: null,
        invoiceTemplateId: null,
        defaultTaxRate: '0',
        defaultDiscountType: 'percentage' as const,
        defaultDiscountValue: '0',
      };

      const lineItems = [
        { description: 'Test Item', quantity: '1', rate: '100' },
      ];

      const created = await createBatchInvoiceTemplate(templateData, lineItems);
      expect(created.id).toBeDefined();

      // Delete the template
      await deleteBatchInvoiceTemplate(created.id, TEST_USER_ID);

      // Verify it's deleted
      const result = await getBatchInvoiceTemplateById(created.id, TEST_USER_ID);
      expect(result).toBeNull();
    });

    it('should throw error when trying to delete template belonging to different user', async () => {
      if (!createdTemplateId) {
        throw new Error('No template created for testing');
      }

      // Try to delete with wrong user - should throw
      await expect(
        deleteBatchInvoiceTemplate(createdTemplateId, 888888888)
      ).rejects.toThrow();

      // Template should still exist
      const result = await getBatchInvoiceTemplateById(createdTemplateId, TEST_USER_ID);
      expect(result).toBeDefined();
    });
  });
});

describe('getClientsByTagId', () => {
  it('should return empty array for non-existent tag', async () => {
    const clients = await getClientsByTagId(999999, 777777777);
    expect(clients).toEqual([]);
  });
});
