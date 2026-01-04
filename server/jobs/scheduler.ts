import cron from "node-cron";
import { generateRecurringInvoices } from "./generateRecurringInvoices";

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
  
  console.log("[Scheduler] Cron jobs initialized successfully");
  console.log("[Scheduler] - Recurring invoices: Daily at midnight");
}
