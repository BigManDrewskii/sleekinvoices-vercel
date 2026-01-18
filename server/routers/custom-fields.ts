import {
  protectedProcedure,
  router,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

export const customFieldsRouter = router({
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
    .input(
      z.object({
        templateId: z.number().optional(),
        fieldName: z.string(),
        fieldLabel: z.string(),
        fieldType: z.enum(["text", "number", "date", "select"]),
        isRequired: z.boolean().optional(),
        defaultValue: z.string().optional(),
        selectOptions: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createCustomField({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        fieldName: z.string().optional(),
        fieldLabel: z.string().optional(),
        fieldType: z.enum(["text", "number", "date", "select"]).optional(),
        isRequired: z.boolean().optional(),
        defaultValue: z.string().optional(),
        selectOptions: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
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
});