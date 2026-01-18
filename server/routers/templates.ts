import {
  publicProcedure,
  protectedProcedure,
  router,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { and, eq } from "drizzle-orm";

export const templatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getInvoiceTemplatesByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getInvoiceTemplateById(input.id, ctx.user.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        templateType: z
          .enum([
            "modern",
            "classic",
            "minimal",
            "bold",
            "professional",
            "creative",
          ])
          .optional(),
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createInvoiceTemplate({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        templateType: z
          .enum([
            "modern",
            "classic",
            "minimal",
            "bold",
            "professional",
            "creative",
          ])
          .optional(),
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
      })
    )
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

  initializeTemplates: protectedProcedure.mutation(async ({ ctx }) => {
    const { TEMPLATE_PRESETS } = await import("../../shared/template-presets");

    // Check if user already has the preset templates
    const existingTemplates = await db.getInvoiceTemplatesByUserId(
      ctx.user.id
    );
    const presetNames = TEMPLATE_PRESETS.map((p: any) => p.name);
    const existingPresetNames = existingTemplates.map((t: any) => t.name);
    const hasAllPresets = presetNames.every((name: string) =>
      existingPresetNames.includes(name)
    );

    if (hasAllPresets) {
      return {
        success: true,
        message: "Templates already initialized",
        count: existingTemplates.length,
      };
    }

    // Create only missing template presets for the user
    let createdCount = 0;
    const hasDefaultTemplate = existingTemplates.some(t => t.isDefault);

    for (const preset of TEMPLATE_PRESETS as any[]) {
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

    return {
      success: true,
      message: "Templates initialized successfully",
      count: createdCount,
    };
  }),
});