import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Invoice Template System', () => {
  let testUserId: number;
  let testTemplateId: number;

  beforeAll(async () => {
    // Create a test user
    const openId = `test-templates-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: 'Template Test User',
      email: `template-test-${Date.now()}@example.com`,
    });
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error('Failed to create test user');
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup: delete test templates and user
    if (testTemplateId) {
      try {
        await db.deleteInvoiceTemplate(testTemplateId, testUserId);
      } catch (e) {
        // Template may already be deleted
      }
    }
  });

  describe('Template CRUD Operations', () => {
    it('should create a new invoice template', async () => {
      await db.createInvoiceTemplate({
        userId: testUserId,
        name: 'Test Modern Template',
        templateType: 'modern',
        primaryColor: '#5f6fff',
        secondaryColor: '#252f33',
        accentColor: '#10b981',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        fontSize: 14,
        logoPosition: 'left',
        logoWidth: 150,
        headerLayout: 'standard',
        footerLayout: 'simple',
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: 'Thank you for your business!',
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        isDefault: true,
      });

      // Retrieve the created template
      const templates = await db.getInvoiceTemplatesByUserId(testUserId);
      const created = templates.find(t => t.name === 'Test Modern Template');
      expect(created).toBeDefined();
      testTemplateId = created!.id;
    });

    it('should retrieve templates by user ID', async () => {
      const templates = await db.getInvoiceTemplatesByUserId(testUserId);
      
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      const testTemplate = templates.find(t => t.id === testTemplateId);
      expect(testTemplate).toBeDefined();
      expect(testTemplate?.name).toBe('Test Modern Template');
      expect(testTemplate?.templateType).toBe('modern');
      expect(testTemplate?.primaryColor).toBe('#5f6fff');
      expect(testTemplate?.isDefault).toBe(true);
    });

    it('should retrieve a specific template by ID', async () => {
      const template = await db.getInvoiceTemplateById(testTemplateId, testUserId);
      
      expect(template).toBeDefined();
      expect(template?.id).toBe(testTemplateId);
      expect(template?.name).toBe('Test Modern Template');
      expect(template?.userId).toBe(testUserId);
      expect(template?.headingFont).toBe('Inter');
      expect(template?.bodyFont).toBe('Inter');
      expect(template?.fontSize).toBe(14);
    });

    it('should retrieve the default template', async () => {
      const defaultTemplate = await db.getDefaultTemplate(testUserId);
      
      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate?.id).toBe(testTemplateId);
      expect(defaultTemplate?.isDefault).toBe(true);
      expect(defaultTemplate?.name).toBe('Test Modern Template');
    });

    it('should update a template', async () => {
      await db.updateInvoiceTemplate(testTemplateId, testUserId, {
        name: 'Updated Modern Template',
        primaryColor: '#3b82f6',
        fontSize: 16,
        footerText: 'Updated footer text',
      });

      const updated = await db.getInvoiceTemplateById(testTemplateId, testUserId);
      
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Modern Template');
      expect(updated?.primaryColor).toBe('#3b82f6');
      expect(updated?.fontSize).toBe(16);
      expect(updated?.footerText).toBe('Updated footer text');
      // Unchanged fields should remain the same
      expect(updated?.templateType).toBe('modern');
      expect(updated?.headingFont).toBe('Inter');
    });

    it('should create a second template and set it as default', async () => {
      await db.createInvoiceTemplate({
        userId: testUserId,
        name: 'Test Classic Template',
        templateType: 'classic',
        primaryColor: '#1e3a8a',
        secondaryColor: '#475569',
        accentColor: '#dc2626',
        headingFont: 'Georgia',
        bodyFont: 'Georgia',
        fontSize: 13,
        logoPosition: 'center',
        logoWidth: 180,
        headerLayout: 'centered',
        footerLayout: 'detailed',
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: 'We appreciate your prompt payment.',
        language: 'en',
        dateFormat: 'DD/MM/YYYY',
        isDefault: false,
      });

      const templates = await db.getInvoiceTemplatesByUserId(testUserId);
      const secondTemplate = templates.find(t => t.name === 'Test Classic Template');
      expect(secondTemplate).toBeDefined();
      const secondTemplateId = secondTemplate!.id;

      // Set the second template as default
      await db.setDefaultTemplate(secondTemplateId, testUserId);

      // Check that only the second template is default
      const updatedTemplates = await db.getInvoiceTemplatesByUserId(testUserId);
      const firstTemplate = updatedTemplates.find(t => t.id === testTemplateId);
      const updatedSecondTemplate = updatedTemplates.find(t => t.id === secondTemplateId);

      expect(firstTemplate?.isDefault).toBe(false);
      expect(updatedSecondTemplate?.isDefault).toBe(true);

      // Cleanup: set first template back as default before deleting second
      await db.setDefaultTemplate(testTemplateId, testUserId);
      await db.deleteInvoiceTemplate(secondTemplateId, testUserId);
    });

    it('should not allow deleting the default template', async () => {
      // Set first template back as default
      await db.setDefaultTemplate(testTemplateId, testUserId);

      await expect(
        db.deleteInvoiceTemplate(testTemplateId, testUserId)
      ).rejects.toThrow('Cannot delete default template');
    });

    it('should delete a non-default template', async () => {
      // Create a non-default template
      await db.createInvoiceTemplate({
        userId: testUserId,
        name: 'Temporary Template',
        templateType: 'minimal',
        primaryColor: '#18181b',
        secondaryColor: '#71717a',
        accentColor: '#3b82f6',
        isDefault: false,
      });

      const templates = await db.getInvoiceTemplatesByUserId(testUserId);
      const tempTemplate = templates.find(t => t.name === 'Temporary Template');
      expect(tempTemplate).toBeDefined();
      const tempTemplateId = tempTemplate!.id;

      // Delete it
      await db.deleteInvoiceTemplate(tempTemplateId, testUserId);

      // Verify it's gone
      const deleted = await db.getInvoiceTemplateById(tempTemplateId, testUserId);
      expect(deleted).toBeUndefined();
    });
  });

  describe('Template Field Validation', () => {
    it('should handle all template types', async () => {
      const templateTypes = ['modern', 'classic', 'minimal', 'bold', 'professional', 'creative'] as const;
      
      for (const type of templateTypes) {
        await db.createInvoiceTemplate({
          userId: testUserId,
          name: `Test ${type} Template`,
          templateType: type,
          primaryColor: '#000000',
          secondaryColor: '#ffffff',
          accentColor: '#ff0000',
          isDefault: false,
        });

        const templates = await db.getInvoiceTemplatesByUserId(testUserId);
        const template = templates.find(t => t.name === `Test ${type} Template`);
        expect(template).toBeDefined();
        const templateId = template!.id;
        
        expect(template?.templateType).toBe(type);
        
        // Cleanup
        await db.deleteInvoiceTemplate(templateId, testUserId);
      }
    });

    it('should handle all logo positions', async () => {
      const positions = ['left', 'center', 'right'] as const;
      
      for (const position of positions) {
        await db.createInvoiceTemplate({
          userId: testUserId,
          name: `Test ${position} Logo Template`,
          templateType: 'modern',
          logoPosition: position,
          isDefault: false,
        });

        const templates = await db.getInvoiceTemplatesByUserId(testUserId);
        const template = templates.find(t => t.name === `Test ${position} Logo Template`);
        expect(template).toBeDefined();
        const templateId = template!.id;
        
        expect(template?.logoPosition).toBe(position);
        
        // Cleanup
        await db.deleteInvoiceTemplate(templateId, testUserId);
      }
    });

    it('should handle all header layouts', async () => {
      const layouts = ['standard', 'centered', 'split'] as const;
      
      for (const layout of layouts) {
        await db.createInvoiceTemplate({
          userId: testUserId,
          name: `Test ${layout} Header Template`,
          templateType: 'modern',
          headerLayout: layout,
          isDefault: false,
        });

        const templates = await db.getInvoiceTemplatesByUserId(testUserId);
        const template = templates.find(t => t.name === `Test ${layout} Header Template`);
        expect(template).toBeDefined();
        const templateId = template!.id;
        
        expect(template?.headerLayout).toBe(layout);
        
        // Cleanup
        await db.deleteInvoiceTemplate(templateId, testUserId);
      }
    });

    it('should handle field visibility toggles', async () => {
      await db.createInvoiceTemplate({
        userId: testUserId,
        name: 'Test Field Visibility Template',
        templateType: 'modern',
        showCompanyAddress: false,
        showPaymentTerms: false,
        showTaxField: false,
        showDiscountField: false,
        showNotesField: false,
        isDefault: false,
      });

      const templates = await db.getInvoiceTemplatesByUserId(testUserId);
      const template = templates.find(t => t.name === 'Test Field Visibility Template');
      expect(template).toBeDefined();
      const templateId = template!.id;
      
      expect(template?.showCompanyAddress).toBe(false);
      expect(template?.showPaymentTerms).toBe(false);
      expect(template?.showTaxField).toBe(false);
      expect(template?.showDiscountField).toBe(false);
      expect(template?.showNotesField).toBe(false);
      
      // Cleanup
      await db.deleteInvoiceTemplate(templateId, testUserId);
    });
  });

  describe('Template Initialization', () => {
    it('should initialize 6 templates for new users', async () => {
      // Create a new test user
      const openId = `test-init-${Date.now()}`;
      await db.upsertUser({
        openId,
        name: "Init Test User",
        email: "init@test.com",
      });
      
      const testUser = await db.getUserByOpenId(openId);
      if (!testUser) throw new Error('Failed to create test user');

      // Verify user has no templates initially
      const initialTemplates = await db.getInvoiceTemplatesByUserId(testUser.id);
      expect(initialTemplates.length).toBe(0);

      // Initialize templates
      const { TEMPLATE_PRESETS } = await import('../shared/template-presets');
      
      for (const preset of TEMPLATE_PRESETS) {
        await db.createInvoiceTemplate({
          userId: testUser.id,
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
          isDefault: preset.name === "Modern", // First template is default
        });
      }

      // Verify all 6 templates were created
      const createdTemplates = await db.getInvoiceTemplatesByUserId(testUser.id);
      expect(createdTemplates.length).toBe(6);

      // Verify template names
      const templateNames = createdTemplates.map(t => t.name).sort();
      expect(templateNames).toEqual(["Bold", "Classic", "Creative", "Minimal", "Modern", "Professional"]);

      // Verify Modern is the default
      const defaultTemplate = createdTemplates.find(t => t.isDefault);
      expect(defaultTemplate?.name).toBe("Modern");
      
      // Verify each template has correct properties
      const modernTemplate = createdTemplates.find(t => t.name === "Modern");
      expect(modernTemplate?.templateType).toBe("modern");
      expect(modernTemplate?.primaryColor).toBe("#5f6fff");
      expect(modernTemplate?.headingFont).toBe("Inter");
      
      const classicTemplate = createdTemplates.find(t => t.name === "Classic");
      expect(classicTemplate?.templateType).toBe("classic");
      expect(classicTemplate?.primaryColor).toBe("#1e3a8a");
      expect(classicTemplate?.headingFont).toBe("Georgia");
    });
  });

});
