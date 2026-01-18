import cron from "node-cron";
import { generateRecurringInvoices } from "./generateRecurringInvoices";
import { detectAndMarkOverdueInvoices } from "./detectOverdueInvoices";
import { sendOverdueReminders } from "./sendOverdueReminders";

/**
 * Initialize all scheduled jobs
 * Call this function when the server starts
 */
export function initializeScheduler() {
  console.log("[Scheduler] Initializing cron jobs...");

  // Run recurring invoice generation daily at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("[Scheduler] Running daily recurring invoice generation...");
    try {
      await generateRecurringInvoices();
    } catch (error) {
      console.error("[Scheduler] Recurring invoice generation failed:", error);
    }
  });

  // Run overdue detection daily at 1:00 AM
  cron.schedule("0 1 * * *", async () => {
    console.log("[Scheduler] Running daily overdue invoice detection...");
    try {
      const result = await detectAndMarkOverdueInvoices();
      if (result.success) {
        console.log(
          `[Scheduler] Overdue detection completed: ${result.markedCount} invoices marked`
        );
      } else {
        console.error(`[Scheduler] Overdue detection failed: ${result.error}`);
      }
    } catch (error) {
      console.error("[Scheduler] Overdue detection failed:", error);
    }
  });

  // Run overdue reminders daily at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] Running daily overdue reminders...");
    try {
      await sendOverdueReminders();
    } catch (error) {
      console.error("[Scheduler] Overdue reminders failed:", error);
    }
  });

  console.log("[Scheduler] Cron jobs initialized successfully");
  console.log("[Scheduler] - Recurring invoices: Daily at midnight");
  console.log("[Scheduler] - Overdue detection: Daily at 1:00 AM");
  console.log("[Scheduler] - Overdue reminders: Daily at 9:00 AM");
}
