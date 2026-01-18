import { eq, and, lte } from "drizzle-orm";
import { getDb } from "../db";
import { invoices, clients, users } from "../../drizzle/schema";
import {
  getReminderSettings,
  logReminderSent,
  wasReminderSentToday,
} from "../db";
import { sendReminderEmail } from "../email";

/**
 * Send automated payment reminders for overdue invoices
 * Runs daily at 9:00 AM
 */
export async function sendOverdueReminders() {
  console.log("[Reminders] Starting overdue reminder job...");

  const db = await getDb();
  if (!db) {
    console.error("[Reminders] Database not initialized");
    return;
  }

  try {
    // Get all overdue invoices
    const overdueInvoices = await db
      .select({
        invoice: invoices,
        client: clients,
        user: users,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.status, "overdue"));

    console.log(`[Reminders] Found ${overdueInvoices.length} overdue invoices`);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of overdueInvoices) {
      const { invoice, client, user } = row;

      try {
        // Calculate days overdue
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
        if (!dueDate) {
          console.log(
            `[Reminders] Skipping invoice ${invoice.invoiceNumber} - no due date`
          );
          skipped++;
          continue;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysOverdue <= 0) {
          console.log(
            `[Reminders] Skipping invoice ${invoice.invoiceNumber} - not overdue yet`
          );
          skipped++;
          continue;
        }

        // Get user's reminder settings
        const settings = await getReminderSettings(user.id);

        // If no settings, create default settings
        if (!settings) {
          console.log(
            `[Reminders] No settings for user ${user.id}, using defaults`
          );
        }

        // Check if reminders are enabled
        const enabled = settings ? settings.enabled === 1 : true;
        if (!enabled) {
          console.log(`[Reminders] Reminders disabled for user ${user.id}`);
          skipped++;
          continue;
        }

        // Get reminder intervals
        const intervals: number[] =
          settings && settings.intervals
            ? JSON.parse(settings.intervals)
            : [3, 7, 14];

        // Check if days overdue matches any interval
        if (!intervals.includes(daysOverdue)) {
          console.log(
            `[Reminders] Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue, not in intervals [${intervals.join(", ")}]`
          );
          skipped++;
          continue;
        }

        // Check if reminder already sent today
        const sentToday = await wasReminderSentToday(invoice.id);
        if (sentToday) {
          console.log(
            `[Reminders] Reminder already sent today for invoice ${invoice.invoiceNumber}`
          );
          skipped++;
          continue;
        }

        // Check if client has email
        if (!client.email) {
          console.log(
            `[Reminders] Skipping invoice ${invoice.invoiceNumber} - client has no email`
          );
          await logReminderSent({
            invoiceId: invoice.id,
            userId: user.id,
            daysOverdue,
            recipientEmail: "N/A",
            status: "failed",
            errorMessage: "Client email not set",
          });
          failed++;
          continue;
        }

        // Send reminder email
        console.log(
          `[Reminders] Sending reminder for invoice ${invoice.invoiceNumber} to ${client.email} (${daysOverdue} days overdue)`
        );

        const result = await sendReminderEmail({
          invoice,
          client,
          user,
          daysOverdue,
          template: settings?.emailTemplate,
          ccEmail: settings?.ccEmail || undefined,
        });

        if (result.success) {
          console.log(
            `[Reminders] ✓ Sent reminder for invoice ${invoice.invoiceNumber}`
          );
          await logReminderSent({
            invoiceId: invoice.id,
            userId: user.id,
            daysOverdue,
            recipientEmail: client.email,
            status: "sent",
          });
          sent++;
        } else {
          console.error(
            `[Reminders] ✗ Failed to send reminder for invoice ${invoice.invoiceNumber}:`,
            result.error
          );
          await logReminderSent({
            invoiceId: invoice.id,
            userId: user.id,
            daysOverdue,
            recipientEmail: client.email,
            status: "failed",
            errorMessage: result.error,
          });
          failed++;
        }
      } catch (error: any) {
        console.error(
          `[Reminders] Error processing invoice ${invoice.invoiceNumber}:`,
          error
        );
        failed++;
        // Continue to next invoice
      }
    }

    console.log(
      `[Reminders] Job complete: ${sent} sent, ${skipped} skipped, ${failed} failed`
    );
  } catch (error) {
    console.error("[Reminders] Fatal error in reminder job:", error);
  }
}
