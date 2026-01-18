/**
 * Email Retry Service
 *
 * Handles automatic retry of failed emails with exponential backoff.
 * Retry delays: 1 minute, 5 minutes, 15 minutes (max 3 attempts)
 */

import { Resend } from "resend";
import * as db from "../db";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [
  1 * 60 * 1000, // 1 minute
  5 * 60 * 1000, // 5 minutes
  15 * 60 * 1000, // 15 minutes
];

interface RetryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  nextRetryAt?: Date;
}

/**
 * Calculate next retry time based on retry count
 */
export function calculateNextRetryTime(retryCount: number): Date | null {
  if (retryCount >= MAX_RETRIES) {
    return null; // No more retries
  }

  const delayMs =
    RETRY_DELAYS_MS[retryCount] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  return new Date(Date.now() + delayMs);
}

/**
 * Retry a single failed email
 */
export async function retryEmail(emailLogId: number): Promise<RetryResult> {
  // Get the email log entry
  const emailLog = await db.getEmailLogById(emailLogId);

  if (!emailLog) {
    return { success: false, error: "Email log not found" };
  }

  if (emailLog.success) {
    return { success: false, error: "Email was already sent successfully" };
  }

  const currentRetryCount = emailLog.retryCount || 0;

  if (currentRetryCount >= MAX_RETRIES) {
    return { success: false, error: "Maximum retry attempts reached" };
  }

  // Get the original email data
  const user = await db.getUserById(emailLog.userId);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Get invoice and client if applicable
  let invoice = null;
  let client = null;

  if (emailLog.invoiceId && emailLog.invoiceId > 0) {
    invoice = await db.getInvoiceById(emailLog.invoiceId, emailLog.userId);
    if (invoice) {
      client = await db.getClientById(invoice.clientId, emailLog.userId);
    }
  }

  try {
    // Initialize Resend
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Determine email type and resend
    let result;

    // For now, we'll just resend a simple notification
    // In a full implementation, you'd reconstruct the original email
    const fromAddress =
      emailLog.emailType === "invoice"
        ? "invoices@sleekinvoices.com"
        : emailLog.emailType === "reminder"
          ? "reminders@sleekinvoices.com"
          : "payments@sleekinvoices.com";

    result = await resend.emails.send({
      from: `${user.companyName || user.name || "SleekInvoices"} <${fromAddress}>`,
      replyTo: user.email || "support@sleekinvoices.com",
      to: emailLog.recipientEmail,
      subject: `[Retry] ${emailLog.subject}`,
      html: `<p>This is a retry of a previously failed email.</p><p>Original subject: ${emailLog.subject}</p>`,
      text: `This is a retry of a previously failed email. Original subject: ${emailLog.subject}`,
    });

    const newRetryCount = currentRetryCount + 1;
    const now = new Date();

    if (result.error) {
      // Update with failure and schedule next retry
      const nextRetryAt = calculateNextRetryTime(newRetryCount);

      await db.updateEmailLogRetry(emailLogId, {
        retryCount: newRetryCount,
        lastRetryAt: now,
        nextRetryAt,
        success: false,
        errorMessage: result.error.message,
      });

      return {
        success: false,
        error: result.error.message,
        nextRetryAt: nextRetryAt || undefined,
      };
    }

    // Success! Update the log
    await db.updateEmailLogRetry(emailLogId, {
      retryCount: newRetryCount,
      lastRetryAt: now,
      nextRetryAt: null,
      success: true,
      errorMessage: null,
      messageId: result.data?.id,
      deliveryStatus: "sent",
    });

    console.log(
      `[Email Retry] Successfully retried email ${emailLogId} on attempt ${newRetryCount}`
    );

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const newRetryCount = currentRetryCount + 1;
    const nextRetryAt = calculateNextRetryTime(newRetryCount);

    await db.updateEmailLogRetry(emailLogId, {
      retryCount: newRetryCount,
      lastRetryAt: new Date(),
      nextRetryAt,
      success: false,
      errorMessage,
    });

    console.error(
      `[Email Retry] Failed to retry email ${emailLogId}:`,
      errorMessage
    );

    return {
      success: false,
      error: errorMessage,
      nextRetryAt: nextRetryAt || undefined,
    };
  }
}

/**
 * Process all failed emails that are due for retry
 * This should be called periodically (e.g., every minute via cron)
 */
export async function processFailedEmails(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const failedEmails = await db.getFailedEmailsForRetry(MAX_RETRIES);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const email of failedEmails) {
    processed++;
    const result = await retryEmail(email.id);

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    // Small delay between retries to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (processed > 0) {
    console.log(
      `[Email Retry] Processed ${processed} emails: ${succeeded} succeeded, ${failed} failed`
    );
  }

  return { processed, succeeded, failed };
}

/**
 * Get retry status for an email
 */
export function getRetryStatus(emailLog: {
  success: boolean;
  retryCount: number | null;
  nextRetryAt: Date | null;
}): {
  canRetry: boolean;
  retriesRemaining: number;
  nextRetryAt: Date | null;
} {
  const retryCount = emailLog.retryCount || 0;
  const canRetry = !emailLog.success && retryCount < MAX_RETRIES;
  const retriesRemaining = Math.max(0, MAX_RETRIES - retryCount);

  return {
    canRetry,
    retriesRemaining,
    nextRetryAt: canRetry ? emailLog.nextRetryAt : null,
  };
}
