import * as db from "../db";

/**
 * Detect and mark overdue invoices
 * Runs daily to check for invoices past their due date
 */
export async function detectAndMarkOverdueInvoices(): Promise<{
  success: boolean;
  markedCount: number;
  error?: string;
}> {
  try {
    console.log("[Overdue Detection] Starting overdue invoice detection...");
    
    const database = await db.getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // Import schema
    const { invoices } = await import("../../drizzle/schema");
    const { eq, and, lte, or } = await import("drizzle-orm");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find invoices that are:
    // 1. Due date is before today
    // 2. Status is 'draft' or 'sent' (not already paid/overdue/canceled)
    // 3. Not fully paid (check payment status)
    
    const candidateInvoices = await database
      .select()
      .from(invoices)
      .where(
        and(
          lte(invoices.dueDate, today),
          or(
            eq(invoices.status, "draft"),
            eq(invoices.status, "sent")
          )
        )
      );

    console.log(`[Overdue Detection] Found ${candidateInvoices.length} candidate invoices`);

    let markedCount = 0;

    // Check each invoice's payment status
    for (const invoice of candidateInvoices) {
      const paymentStatus = await db.getInvoicePaymentStatus(invoice.id);
      
      // Only mark as overdue if not fully paid
      if (paymentStatus.status !== "paid") {
        await db.updateInvoice(invoice.id, invoice.userId, {
          status: "overdue",
        });
        
        console.log(
          `[Overdue Detection] Marked invoice ${invoice.invoiceNumber} (ID: ${invoice.id}) as overdue. ` +
          `Due: ${invoice.dueDate.toISOString().split('T')[0]}, ` +
          `Payment status: ${paymentStatus.status}, ` +
          `Amount due: $${paymentStatus.amountDue}`
        );
        
        markedCount++;
      } else {
        console.log(
          `[Overdue Detection] Skipping invoice ${invoice.invoiceNumber} (ID: ${invoice.id}) - already fully paid`
        );
      }
    }

    console.log(`[Overdue Detection] Completed. Marked ${markedCount} invoices as overdue.`);

    return {
      success: true,
      markedCount,
    };
  } catch (error) {
    console.error("[Overdue Detection] Error:", error);
    return {
      success: false,
      markedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
