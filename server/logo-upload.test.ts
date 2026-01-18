import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Logo Upload Feature", () => {
  let testUserId: number;
  const templateIds: number[] = [];

  beforeAll(async () => {
    // Create a test user
    const openId = `test-logo-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: "Logo Test User",
      email: `logo-test-${Date.now()}@example.com`,
    });
    const user = await db.getUserByOpenId(openId);
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup: delete all test templates
    for (const templateId of templateIds) {
      try {
        await db.deleteInvoiceTemplate(templateId, testUserId);
      } catch (e) {
        // Template may already be deleted
      }
    }
  });

  describe("Logo URL Storage", () => {
    it("should store logo URL in template", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Logo Test Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/company-logo.png",
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you for your business!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoUrl).toBe(
        "https://example.com/logos/company-logo.png"
      );
    });

    it("should handle S3 URLs correctly", async () => {
      const s3Url =
        "https://bucket.s3.amazonaws.com/logos/company-logo-abc123.png";

      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "S3 Logo Template",
        templateType: "classic",
        primaryColor: "#1e3a8a",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Georgia",
        bodyFont: "Georgia",
        fontSize: 14,
        logoUrl: s3Url,
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoUrl).toBe(s3Url);
      expect(template?.logoUrl).toContain("s3.amazonaws.com");
    });

    it("should allow null logo URL", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "No Logo Template",
        templateType: "minimal",
        primaryColor: "#18181b",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Helvetica",
        bodyFont: "Helvetica",
        fontSize: 14,
        logoUrl: null,
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoUrl).toBeNull();
    });
  });

  describe("Logo Positioning", () => {
    it("should support left logo position", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Left Logo Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/logo.png",
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoPosition).toBe("left");
    });

    it("should support center logo position", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Center Logo Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/logo.png",
        logoPosition: "center",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoPosition).toBe("center");
    });

    it("should support right logo position", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Right Logo Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/logo.png",
        logoPosition: "right",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoPosition).toBe("right");
    });
  });

  describe("Logo Width", () => {
    it("should store logo width setting", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Custom Width Logo Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/logo.png",
        logoPosition: "left",
        logoWidth: 150,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoWidth).toBe(150);
    });

    it("should support various logo widths", async () => {
      const widths = [80, 100, 120, 150, 200];

      for (const width of widths) {
        const result = await db.createInvoiceTemplate({
          userId: testUserId,
          name: `Width ${width} Template`,
          templateType: "modern",
          primaryColor: "#5f6fff",
          secondaryColor: "#252f33",
          accentColor: "#10b981",
          headingFont: "Inter",
          bodyFont: "Inter",
          fontSize: 14,
          logoUrl: "https://example.com/logos/logo.png",
          logoPosition: "left",
          logoWidth: width,
          headerLayout: "standard",
          footerLayout: "simple",
          showCompanyAddress: true,
          showPaymentTerms: true,
          showTaxField: true,
          showDiscountField: true,
          showNotesField: true,
          footerText: "Thank you!",
          dateFormat: "MM/DD/YYYY",
        });
        const templateId = result[0].insertId as number;
        templateIds.push(templateId);

        const template = await db.getInvoiceTemplateById(
          templateId,
          testUserId
        );
        expect(template?.logoWidth).toBe(width);
      }
    });

    it("should default to 120px width", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Default Width Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/logo.png",
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoWidth).toBe(120);
    });
  });

  describe("Logo File Format Support", () => {
    it("should support PNG format", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "PNG Logo Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/company-logo.png",
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoUrl).toContain(".png");
    });

    it("should support JPG format", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "JPG Logo Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/company-logo.jpg",
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoUrl).toContain(".jpg");
    });

    it("should support SVG format", async () => {
      const result = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "SVG Logo Template",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: "https://example.com/logos/company-logo.svg",
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId = result[0].insertId as number;
      templateIds.push(templateId);

      const template = await db.getInvoiceTemplateById(templateId, testUserId);
      expect(template?.logoUrl).toContain(".svg");
    });
  });

  describe("Logo with Template Customization", () => {
    it("should work with all header layouts", async () => {
      const layouts = ["standard", "centered", "split"];

      for (const layout of layouts) {
        const result = await db.createInvoiceTemplate({
          userId: testUserId,
          name: `${layout} Layout Logo Template`,
          templateType: "modern",
          primaryColor: "#5f6fff",
          secondaryColor: "#252f33",
          accentColor: "#10b981",
          headingFont: "Inter",
          bodyFont: "Inter",
          fontSize: 14,
          logoUrl: "https://example.com/logos/logo.png",
          logoPosition: "left",
          logoWidth: 120,
          headerLayout: layout as "standard" | "centered" | "split",
          footerLayout: "simple",
          showCompanyAddress: true,
          showPaymentTerms: true,
          showTaxField: true,
          showDiscountField: true,
          showNotesField: true,
          footerText: "Thank you!",
          dateFormat: "MM/DD/YYYY",
        });
        const templateId = result[0].insertId as number;
        templateIds.push(templateId);

        const template = await db.getInvoiceTemplateById(
          templateId,
          testUserId
        );
        expect(template?.logoUrl).toBe("https://example.com/logos/logo.png");
        expect(template?.headerLayout).toBe(layout);
      }
    });
  });

  describe("Logo in Multiple Templates", () => {
    it("should allow different logos in different templates", async () => {
      const logoUrl1 = "https://example.com/logos/logo1.png";
      const logoUrl2 = "https://example.com/logos/logo2.png";

      const result1 = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Template 1 with Logo",
        templateType: "modern",
        primaryColor: "#5f6fff",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Inter",
        bodyFont: "Inter",
        fontSize: 14,
        logoUrl: logoUrl1,
        logoPosition: "left",
        logoWidth: 120,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId1 = result1[0].insertId as number;
      templateIds.push(templateId1);

      const result2 = await db.createInvoiceTemplate({
        userId: testUserId,
        name: "Template 2 with Logo",
        templateType: "classic",
        primaryColor: "#1e3a8a",
        secondaryColor: "#252f33",
        accentColor: "#10b981",
        headingFont: "Georgia",
        bodyFont: "Georgia",
        fontSize: 14,
        logoUrl: logoUrl2,
        logoPosition: "center",
        logoWidth: 150,
        headerLayout: "standard",
        footerLayout: "simple",
        showCompanyAddress: true,
        showPaymentTerms: true,
        showTaxField: true,
        showDiscountField: true,
        showNotesField: true,
        footerText: "Thank you!",
        dateFormat: "MM/DD/YYYY",
      });
      const templateId2 = result2[0].insertId as number;
      templateIds.push(templateId2);

      const template1 = await db.getInvoiceTemplateById(
        templateId1,
        testUserId
      );
      const template2 = await db.getInvoiceTemplateById(
        templateId2,
        testUserId
      );

      expect(template1?.logoUrl).toBe(logoUrl1);
      expect(template2?.logoUrl).toBe(logoUrl2);
      expect(template1?.logoUrl).not.toBe(template2?.logoUrl);
    });
  });
});
