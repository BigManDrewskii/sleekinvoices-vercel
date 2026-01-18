import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { protectedProcedure, router, TRPCError } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        companyName: z.string().optional(),
        companyAddress: z.string().optional(),
        companyPhone: z.string().optional(),
        taxId: z.string().max(50).optional(), // VAT/Tax ID for invoices
        avatarUrl: z.string().nullable().optional(),
        avatarType: z.enum(["initials", "boring", "upload"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  // GDPR Data Export - Download all user data (JSON or CSV format)
  exportAllData: protectedProcedure
    .input(
      z
        .object({
          format: z.enum(["json", "csv"]).default("json"),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const format = input?.format || "json";

      // Gather all user data
      const [
        clients,
        invoices,
        products,
        expenses,
        templates,
        recurringInvoices,
        estimates,
        payments,
        emailLogs,
      ] = await Promise.all([
        db.getClientsByUserId(userId),
        db.getInvoicesByUserId(userId),
        db.getProductsByUserId(userId),
        db.getExpensesByUserId(userId),
        db.getInvoiceTemplatesByUserId(userId),
        db.getRecurringInvoicesByUserId(userId),
        db.getEstimatesByUserId(userId),
        db.getPaymentsByUserId(userId),
        db.getAllEmailLogsByUserId(userId),
      ]);

      // Get line items for each invoice
      const invoicesWithLineItems = await Promise.all(
        invoices.map(async invoice => {
          const lineItems = await db.getLineItemsByInvoiceId(invoice.id);
          return { ...invoice, lineItems };
        })
      );

      // Get line items separately for CSV export
      const allLineItems = invoicesWithLineItems.flatMap(inv =>
        inv.lineItems.map(li => ({ ...li, invoiceNumber: inv.invoiceNumber }))
      );

      const exportedAt = new Date().toISOString();

      if (format === "csv") {
        // CSV Export - Create ZIP with multiple CSV files
        const archiver = await import("archiver");
        const { PassThrough } = await import("stream");

        // Helper to convert array to CSV
        const arrayToCSV = (data: any[], columns?: string[]): string => {
          if (data.length === 0) return "";
          const cols = columns || Object.keys(data[0]);
          const header = cols.join(",");
          const rows = data.map(row =>
            cols
              .map(col => {
                const val = row[col];
                if (val === null || val === undefined) return "";
                const str = String(val);
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                if (
                  str.includes(",") ||
                  str.includes('"') ||
                  str.includes("\n")
                ) {
                  return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
              })
              .join(",")
          );
          return [header, ...rows].join("\n");
        };

        // Create archive
        const archive = archiver.default("zip", { zlib: { level: 9 } });
        const chunks: Buffer[] = [];

        archive.on("data", (chunk: Buffer) => chunks.push(chunk));

        // Add user profile CSV
        const userCSV = arrayToCSV([
          {
            id: ctx.user.id,
            email: ctx.user.email,
            name: ctx.user.name,
            companyName: ctx.user.companyName,
            companyAddress: ctx.user.companyAddress,
            companyPhone: ctx.user.companyPhone,
            taxId: ctx.user.taxId,
            createdAt: ctx.user.createdAt,
          },
        ]);
        archive.append(userCSV, { name: "profile.csv" });

        // Add clients CSV
        if (clients.length > 0) {
          archive.append(arrayToCSV(clients), { name: "clients.csv" });
        }

        // Add invoices CSV (without nested lineItems)
        if (invoices.length > 0) {
          const invoicesFlat = invoices.map(({ ...inv }) => inv);
          archive.append(arrayToCSV(invoicesFlat), { name: "invoices.csv" });
        }

        // Add line items CSV (separate file with invoice reference)
        if (allLineItems.length > 0) {
          archive.append(arrayToCSV(allLineItems), {
            name: "invoice_line_items.csv",
          });
        }

        // Add products CSV
        if (products.length > 0) {
          archive.append(arrayToCSV(products), { name: "products.csv" });
        }

        // Add expenses CSV
        if (expenses.length > 0) {
          archive.append(arrayToCSV(expenses), { name: "expenses.csv" });
        }

        // Add templates CSV
        if (templates.length > 0) {
          archive.append(arrayToCSV(templates), { name: "templates.csv" });
        }

        // Add recurring invoices CSV
        if (recurringInvoices.length > 0) {
          archive.append(arrayToCSV(recurringInvoices), {
            name: "recurring_invoices.csv",
          });
        }

        // Add estimates CSV
        if (estimates.length > 0) {
          archive.append(arrayToCSV(estimates), { name: "estimates.csv" });
        }

        // Add payments CSV
        if (payments.length > 0) {
          archive.append(arrayToCSV(payments), { name: "payments.csv" });
        }

        // Add email logs CSV
        if (emailLogs.length > 0) {
          archive.append(arrayToCSV(emailLogs), { name: "email_logs.csv" });
        }

        // Add metadata file
        const metadata = `Export Date: ${exportedAt}\nFormat: CSV\nUser ID: ${userId}\n\nThis ZIP contains the following CSV files:\n- profile.csv: Your account information\n- clients.csv: Your client records\n- invoices.csv: Your invoice records\n- invoice_line_items.csv: Line items for each invoice\n- products.csv: Your product catalog\n- expenses.csv: Your expense records\n- templates.csv: Your invoice templates\n- recurring_invoices.csv: Your recurring invoice settings\n- estimates.csv: Your estimate records\n- payments.csv: Your payment records\n- email_logs.csv: Your email history`;
        archive.append(metadata, { name: "README.txt" });

        await archive.finalize();

        // Wait for archive to complete
        await new Promise<void>(resolve => archive.on("end", resolve));

        const zipBuffer = Buffer.concat(chunks);
        const fileKey = `exports/${userId}/sleek-invoices-data-export-${new Date().toISOString().split("T")[0]}-${nanoid(6)}.zip`;
        const { url } = await storagePut(fileKey, zipBuffer, "application/zip");

        return { url, exportedAt, format: "csv" };
      }

      // JSON Export (default)
      const exportData = {
        exportedAt,
        user: {
          id: ctx.user.id,
          email: ctx.user.email,
          name: ctx.user.name,
          companyName: ctx.user.companyName,
          companyAddress: ctx.user.companyAddress,
          companyPhone: ctx.user.companyPhone,
          taxId: ctx.user.taxId,
          createdAt: ctx.user.createdAt,
        },
        clients,
        invoices: invoicesWithLineItems,
        products,
        expenses,
        templates,
        recurringInvoices,
        estimates,
        payments,
        emailLogs,
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      const fileKey = `exports/${userId}/sleek-invoices-data-export-${new Date().toISOString().split("T")[0]}-${nanoid(6)}.json`;
      const { url } = await storagePut(
        fileKey,
        Buffer.from(jsonData),
        "application/json"
      );

      return { url, exportedAt, format: "json" };
    }),

  uploadLogo: protectedProcedure
    .input(
      z.object({
        base64Data: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64Data, "base64");
      const fileKey = `logos/${ctx.user.id}-${nanoid()}.png`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      await db.updateUserProfile(ctx.user.id, { logoUrl: url });
      return { url };
    }),

  // GDPR Account Deletion - Delete all user data
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmationText: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify confirmation text matches
      if (input.confirmationText !== "DELETE MY ACCOUNT") {
        throw new Error('Please type "DELETE MY ACCOUNT" to confirm deletion');
      }

      const userId = ctx.user.id;
      const userEmail = ctx.user.email as string | undefined;

      // Log the deletion request for audit trail (before deleting data)
      await db.logAuditEvent({
        userId,
        action: "account_deletion_initiated",
        entityType: "user",
        entityId: userId,
        entityName: userEmail ?? undefined,
        details: {
          reason: input.reason || "No reason provided",
          deletedAt: new Date().toISOString(),
        },
      });

      // Perform comprehensive data deletion
      await db.deleteUserAccount(userId);

      // Clear the session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      return {
        success: true,
        message:
          "Your account and all associated data have been permanently deleted.",
      };
    }),
});
