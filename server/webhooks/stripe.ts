import type { Request, Response } from "express";
import {
  logStripeWebhookEvent,
  markWebhookEventProcessed,
  isWebhookEventProcessed,
  createPayment,
  updateInvoice,
} from "../db";

/**
 * Stripe webhook handler
 * Processes payment_intent.succeeded, payment_intent.failed, and charge.refunded events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    
    console.log(`[Stripe Webhook] Received event: ${event.type}`);
    
    // Check if event already processed (idempotency)
    if (await isWebhookEventProcessed(event.id)) {
      console.log(`[Stripe Webhook] Event ${event.id} already processed, skipping`);
      return res.json({ received: true });
    }
    
    // Log the webhook event
    await logStripeWebhookEvent(event.id, event.type, event);
    
    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event);
        break;
      
      case "payment_intent.failed":
        await handlePaymentFailed(event);
        break;
      
      case "charge.refunded":
        await handleChargeRefunded(event);
        break;
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    
    // Mark event as processed
    await markWebhookEventProcessed(event.id);
    
    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(event: any) {
  const paymentIntent = event.data.object;
  
  console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
  
  // Extract invoice ID from metadata
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (!invoiceId) {
    console.warn("[Stripe Webhook] No invoiceId in payment metadata");
    return;
  }
  
  // Get invoice details (without userId check since webhook doesn't have it)
  const { invoices } = await import("../../drizzle/schema");
  const { getDb } = await import("../db");
  const { eq } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) return;
  
  const invoiceResult = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, parseInt(invoiceId)))
    .limit(1);
  
  const invoice = invoiceResult[0];
  if (!invoice) {
    console.error(`[Stripe Webhook] Invoice not found: ${invoiceId}`);
    return;
  }
  
  // Create payment record
  await createPayment({
    invoiceId: invoice.id,
    userId: invoice.userId,
    amount: (paymentIntent.amount / 100).toString(), // Convert from cents
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: "stripe",
    stripePaymentIntentId: paymentIntent.id,
    paymentDate: new Date(paymentIntent.created * 1000),
    status: "completed",
    notes: `Stripe payment: ${paymentIntent.id}`,
  });
  
  // Update invoice status to paid
  await updateInvoice(invoice.id, invoice.userId, { status: "paid" });
  
  console.log(`[Stripe Webhook] Payment recorded for invoice ${invoiceId}`);
  
  // Send payment confirmation email
  try {
    const { clients } = await import("../../drizzle/schema");
    
    const clientResult = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);
    
    if (clientResult[0]?.email) {
      // TODO: Send payment confirmation email
      // Would need to implement a generic sendEmail function or use sendInvoiceEmail
      console.log(`[Stripe Webhook] Would send payment confirmation to ${clientResult[0].email}`);
    }
  } catch (emailError) {
    console.error("[Stripe Webhook] Failed to send payment confirmation email:", emailError);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: any) {
  const paymentIntent = event.data.object;
  
  console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
  
  // Extract invoice ID from metadata
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (!invoiceId) {
    console.warn("[Stripe Webhook] No invoiceId in payment metadata");
    return;
  }
  
  // Get invoice details
  const { invoices } = await import("../../drizzle/schema");
  const { getDb } = await import("../db");
  const { eq } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) return;
  
  const invoiceResult = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, parseInt(invoiceId)))
    .limit(1);
  
  const invoice = invoiceResult[0];
  if (!invoice) {
    console.error(`[Stripe Webhook] Invoice not found: ${invoiceId}`);
    return;
  }
  
  // Create failed payment record
  await createPayment({
    invoiceId: invoice.id,
    userId: invoice.userId,
    amount: (paymentIntent.amount / 100).toString(),
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: "stripe",
    stripePaymentIntentId: paymentIntent.id,
    paymentDate: new Date(paymentIntent.created * 1000),
    status: "failed",
    notes: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`,
  });
  
  console.log(`[Stripe Webhook] Failed payment recorded for invoice ${invoiceId}`);
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(event: any) {
  const charge = event.data.object;
  
  console.log(`[Stripe Webhook] Charge refunded: ${charge.id}`);
  
  // Find the payment by Stripe payment intent ID
  const { payments, invoices } = await import("../../drizzle/schema");
  const { getDb } = await import("../db");
  const { eq } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) return;
  
  const paymentResult = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, charge.payment_intent))
    .limit(1);
  
  if (paymentResult[0]) {
    // Update payment status to refunded
    await db
      .update(payments)
      .set({ 
        status: "refunded",
        notes: `Refunded: ${charge.amount_refunded / 100} ${charge.currency.toUpperCase()}`,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentResult[0].id));
    
    console.log(`[Stripe Webhook] Payment ${paymentResult[0].id} marked as refunded`);
    
    // Update invoice status back to sent if fully refunded
    if (charge.amount_refunded === charge.amount) {
      const invoiceResult = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, paymentResult[0].invoiceId))
        .limit(1);
      
      const invoice = invoiceResult[0];
      if (invoice) {
        await updateInvoice(invoice.id, invoice.userId, { status: "sent" });
        console.log(`[Stripe Webhook] Invoice ${invoice.id} marked as sent after full refund`);
      }
    }
  }
}
