import {
  protectedProcedure,
  router,
  TRPCError,
} from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { eq, and, inArray } from "drizzle-orm";
import { clients } from "../../drizzle/schema";

export const clientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getClientsByUserId(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getClientById(input.id, ctx.user.id);
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().max(255),
        email: z.string().email().optional(),
        companyName: z.string().max(255).optional(),
        address: z.string().max(500).optional(),
        phone: z.string().max(50).optional(),
        notes: z.string().max(2000).optional(),
        vatNumber: z.string().max(50).nullable().optional(), // EU VAT number (e.g., DE123456789)
        taxExempt: z.boolean().optional(), // Tax exempt status
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createClient({
        userId: ctx.user.id,
        ...input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().max(255).optional(),
        email: z.string().email().optional(),
        companyName: z.string().max(255).optional(),
        address: z.string().max(500).optional(),
        phone: z.string().max(50).optional(),
        notes: z.string().max(2000).optional(),
        vatNumber: z.string().max(50).nullable().optional(), // EU VAT number (e.g., DE123456789)
        taxExempt: z.boolean().optional(), // Tax exempt status
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check if client exists
      const existing = await db.getClientById(id, ctx.user.id);
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

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
      const database = await db.getDb();
      if (!database) {
        throw new Error("Database not available");
      }

      // Use transaction for atomicity
      return await database.transaction(async tx => {
        let deletedCount = 0;
        const errors: string[] = [];

        for (const id of input.ids) {
          try {
            // Verify ownership before deletion
            const client = await tx
              .select({ id: clients.id })
              .from(clients)
              .where(and(eq(clients.id, id), eq(clients.userId, ctx.user.id)))
              .limit(1);

            if (!client[0]) {
              errors.push(`Client ${id}: Not found or access denied`);
              continue;
            }

            // Delete line items first (foreign key relationship)
            const { clientContacts } = await import("../../drizzle/schema");
            await tx
              .delete(clientContacts)
              .where(eq(clientContacts.clientId, id));

            // Delete the client
            await tx
              .delete(clients)
              .where(
                and(eq(clients.id, id), eq(clients.userId, ctx.user.id))
              );

            deletedCount++;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            console.error(`Failed to delete client ${id}:`, error);
            errors.push(`Client ${id}: ${message}`);
          }
        }

        return { success: true, deletedCount, errors };
      });
    }),

  // Bulk import clients from CSV
  import: protectedProcedure
    .input(
      z.object({
        clients: z.array(
          z.object({
            name: z.string(),
            email: z.string().optional(),
            companyName: z.string().optional(),
            address: z.string().optional(),
            phone: z.string().optional(),
            notes: z.string().optional(),
            vatNumber: z.string().optional(),
          })
        ),
        skipDuplicates: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing clients by email to detect duplicates
      const emails = input.clients
        .filter(c => c.email)
        .map(c => c.email!.toLowerCase());

      const existingClients = await db.getClientsByEmails(
        ctx.user.id,
        emails
      );
      const existingEmails = new Set(
        existingClients.map(c => c.email?.toLowerCase())
      );

      // Filter out duplicates if requested
      const clientsToImport = input.skipDuplicates
        ? input.clients.filter(
            c => !c.email || !existingEmails.has(c.email.toLowerCase())
          )
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
    .input(
      z.object({
        vatNumber: z.string().min(3).max(50),
      })
    )
    .mutation(async ({ input }) => {
      const { validateVATNumber } = await import("../lib/vat-validation");
      return await validateVATNumber(input.vatNumber);
    }),

  // Client Tags
  listTags: protectedProcedure.query(async ({ ctx }) => {
    return await db.getClientTagsByUserId(ctx.user.id);
  }),

  createTag: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await db.createClientTag({
        userId: ctx.user.id,
        name: input.name,
        color: input.color || "#6366f1",
        description: input.description || null,
      });
    }),

  updateTag: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(50).optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        description: z.string().nullable().optional(),
      })
    )
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

  getClientTagsForMultiple: protectedProcedure
    .input(z.object({ clientIds: z.array(z.number()) }))
    .query(async ({ ctx, input }) => {
      if (input.clientIds.length === 0) return {};

      const database = await db.getDb();
      if (!database) throw new Error("Database not available");

      const { clientTagAssignments, clientTags } = await import(
        "../../drizzle/schema"
      );

      const tagAssignments = await database
        .select({
          clientId: clientTagAssignments.clientId,
          tagId: clientTags.id,
          tagName: clientTags.name,
          tagColor: clientTags.color,
          tagDescription: clientTags.description,
        })
        .from(clientTagAssignments)
        .leftJoin(clientTags, eq(clientTags.id, clientTagAssignments.tagId))
        .where(
          and(
            inArray(clientTagAssignments.clientId, input.clientIds),
            eq(clientTags.userId, ctx.user.id)
          )
        );

      // Group by clientId
      const grouped: Record<
        number,
        Array<{
          id: number;
          name: string;
          color: string;
          description: string | null;
        }>
      > = {};
      for (const row of tagAssignments) {
        if (!row.tagId) continue;
        if (!grouped[row.clientId]) grouped[row.clientId] = [];
        grouped[row.clientId].push({
          id: row.tagId,
          name: row.tagName!,
          color: row.tagColor!,
          description: row.tagDescription,
        });
      }
      return grouped;
    }),

  assignTag: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        tagId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.assignTagToClient(input.clientId, input.tagId, ctx.user.id);
      return { success: true };
    }),

  removeTag: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        tagId: z.number(),
      })
    )
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
    .input(
      z.object({
        clientIds: z.array(z.number()),
        tagId: z.number(),
      })
    )
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
});
