import { getDb } from "../db";
import * as db from "../db";
import { sendInvoiceEmail } from "../email";
import { generateInvoicePDF } from "../pdf";
import { invoiceGenerationLogs } from "../../drizzle/schema";

/**
 * Generate invoices from recurring templates that are due
 * This function is called by the cron scheduler
 */
export async function generateRecurringInvoices() {
  console.log("[Recurring Invoices] Starting generation job...");
  
  const database = await getDb();
  if (!database) {
    console.error("[Recurring Invoices] Database not available");
    return;
  }

  try {
    // Get all recurring invoices due for generation
    const dueRecurringInvoices = await db.getRecurringInvoicesDueForGeneration();
    
    console.log(`[Recurring Invoices] Found ${dueRecurringInvoices.length} invoices to generate`);
    
    for (const recurring of dueRecurringInvoices) {
      try {
        // Get line items for this recurring invoice
        const lineItems = await db.getRecurringInvoiceLineItems(recurring.id);
        
        // Get client info
        const client = await db.getClientById(recurring.clientId, recurring.userId);
        if (!client) {
          throw new Error(`Client not found: ${recurring.clientId}`);
        }
        
        // Get next invoice number
        const nextNumber = await db.getNextInvoiceNumber(recurring.userId);
        const invoiceNumber = `${recurring.invoiceNumberPrefix}-${String(nextNumber).padStart(3, "0")}`;
        
        // Calculate dates
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
        
        // Calculate totals
        const subtotal = lineItems.reduce((sum, item) => {
          return sum + parseFloat(item.quantity) * parseFloat(item.rate);
        }, 0);
        
        const taxRate = parseFloat(recurring.taxRate);
        const discountValue = parseFloat(recurring.discountValue);
        
        let discountAmount = 0;
        if (recurring.discountType === "percentage") {
          discountAmount = (subtotal * discountValue) / 100;
        } else {
          discountAmount = discountValue;
        }
        
        const amountAfterDiscount = subtotal - discountAmount;
        const taxAmount = (amountAfterDiscount * taxRate) / 100;
        const total = amountAfterDiscount + taxAmount;
        
        // Create the invoice
        const newInvoice = await db.createInvoice({
          userId: recurring.userId,
          clientId: recurring.clientId,
          invoiceNumber,
          status: "sent", // Auto-send generated invoices
          subtotal: subtotal.toString(),
          taxRate: recurring.taxRate,
          taxAmount: taxAmount.toString(),
          discountType: recurring.discountType,
          discountValue: recurring.discountValue,
          discountAmount: discountAmount.toString(),
          total: total.toString(),
          amountPaid: "0",
          notes: recurring.notes,
          paymentTerms: recurring.paymentTerms,
          issueDate,
          dueDate,
          sentAt: new Date(),
        });
        
        // Create line items
        for (const item of lineItems) {
          await db.createLineItem({
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: (parseFloat(item.quantity) * parseFloat(item.rate)).toString(),
          });
        }
        
        // Calculate next invoice date
        const nextDate = new Date(recurring.nextInvoiceDate);
        if (recurring.frequency === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (recurring.frequency === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (recurring.frequency === "yearly") {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        
        // Update recurring invoice with next date
        await db.updateRecurringInvoice(recurring.id, recurring.userId, {
          nextInvoiceDate: nextDate,
        });
        
        // Log successful generation
        await database.insert(invoiceGenerationLogs).values({
          recurringInvoiceId: recurring.id,
          generatedInvoiceId: newInvoice.id,
          status: "success",
        });
        
        // Send email to client
        if (client.email) {
          try {
            // Get user info for PDF generation
            const user = await db.getUserByOpenId(recurring.userId.toString());
            if (!user) throw new Error("User not found");
            
            // Prepare PDF data
            const pdfData = {
              invoice: newInvoice,
              client,
              user,
              lineItems: lineItems.map((item, index) => ({
                id: 0,
                invoiceId: newInvoice.id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                amount: (parseFloat(item.quantity) * parseFloat(item.rate)).toString(),
                sortOrder: index,
                createdAt: new Date(),
              })),
            };
            
            const pdfBuffer = await generateInvoicePDF(pdfData);
            await sendInvoiceEmail({
              invoice: newInvoice,
              client,
              user,
              pdfBuffer,
            });
            console.log(`[Recurring Invoices] Email sent for invoice ${invoiceNumber}`);
          } catch (emailError) {
            console.error(`[Recurring Invoices] Failed to send email for ${invoiceNumber}:`, emailError);
          }
        }
        
        console.log(`[Recurring Invoices] Generated invoice ${invoiceNumber} from recurring ${recurring.id}`);
        
      } catch (error) {
        console.error(`[Recurring Invoices] Failed to generate from recurring ${recurring.id}:`, error);
        
        // Log failed generation
        await database.insert(invoiceGenerationLogs).values({
          recurringInvoiceId: recurring.id,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    console.log("[Recurring Invoices] Generation job completed");
    
  } catch (error) {
    console.error("[Recurring Invoices] Job failed:", error);
  }
}
