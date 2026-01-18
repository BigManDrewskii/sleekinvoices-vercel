import type { Request, Response } from "express";
import {
  logStripeWebhookEvent,
  markWebhookEventProcessed,
  isWebhookEventProcessed,
} from "../db";

/**
 * Stripe webhook handler
 * Processes payment_intent.succeeded, payment_intent.failed, and charge.refunded events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    // Verify webhook signature
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      console.error("[Stripe Webhook] No signature header found");
      return res.status(400).json({ error: "No signature header" });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // Construct and verify event
    const { verifyWebhookSignature } = await import("../stripe");
    let event;

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      event = verifyWebhookSignature(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(
        "[Stripe Webhook] Signature verification failed:",
        err.message
      );
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log(`[Stripe Webhook] Received verified event: ${event.type}`);

    // Handle test events (required for webhook verification)
    if (event.id.startsWith("evt_test_")) {
      console.log(
        "[Stripe Webhook] Test event detected, returning verification response"
      );
      return res.json({ verified: true });
    }

    // Check if event already processed (idempotency)
    if (await isWebhookEventProcessed(event.id)) {
      console.log(
        `[Stripe Webhook] Event ${event.id} already processed, skipping`
      );
      return res.json({ received: true });
    }

    // Log the webhook event
    await logStripeWebhookEvent(event.id, event.type, event);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
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
 * Handle successful payment - ATOMIC TRANSACTION
 * Creates payment record and updates invoice status in a single transaction
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
  const { invoices, payments, clients, users } = await import(
    "../../drizzle/schema"
  );
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

  // ATOMIC TRANSACTION: Create payment and update invoice together
  await db.transaction(async tx => {
    // Create payment record
    await tx.insert(payments).values({
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
    await tx
      .update(invoices)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));
  });

  console.log(
    `[Stripe Webhook] Payment recorded for invoice ${invoiceId} (atomic transaction)`
  );

  // Send payment confirmation email (outside transaction - non-critical)
  try {
    const { sendPaymentConfirmationEmail } = await import("../email");

    const clientResult = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, invoice.userId))
      .limit(1);

    if (clientResult[0] && userResult[0]) {
      const emailResult = await sendPaymentConfirmationEmail({
        invoice,
        client: clientResult[0],
        user: userResult[0],
        amountPaid: paymentIntent.amount / 100, // Convert from cents
        paymentMethod: "Stripe",
      });

      if (emailResult.success) {
        console.log(
          `[Stripe Webhook] Payment confirmation email sent to ${clientResult[0].email}`
        );
      } else {
        console.error(
          `[Stripe Webhook] Failed to send confirmation email: ${emailResult.error}`
        );
      }
    }
  } catch (emailError) {
    console.error(
      "[Stripe Webhook] Failed to send payment confirmation email:",
      emailError
    );
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
  const { invoices, payments } = await import("../../drizzle/schema");
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
  await db.insert(payments).values({
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

  console.log(
    `[Stripe Webhook] Failed payment recorded for invoice ${invoiceId}`
  );
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(event: any) {
  const charge = event.data.object;

  console.log(`[Stripe Webhook] Charge refunded: ${charge.id}`);

  // Find the payment by Stripe payment intent ID
  const { payments, invoices } = await import("../../drizzle/schema");
  const { getDb, updateInvoice } = await import("../db");
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

    console.log(
      `[Stripe Webhook] Payment ${paymentResult[0].id} marked as refunded`
    );

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
        console.log(
          `[Stripe Webhook] Invoice ${invoice.id} marked as sent after full refund`
        );
      }
    }
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data.object;

  console.log(
    `[Stripe Webhook] Subscription ${event.type}: ${subscription.id}`
  );

  // Find user by Stripe customer ID
  const { users } = await import("../../drizzle/schema");
  const { getDb } = await import("../db");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return;

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, subscription.customer))
    .limit(1);

  const user = userResult[0];
  if (!user) {
    console.error(
      `[Stripe Webhook] User not found for customer: ${subscription.customer}`
    );
    return;
  }

  // Map Stripe subscription status to our status
  let subscriptionStatus: "free" | "active" | "canceled" | "past_due" = "free";

  if (subscription.status === "active") {
    subscriptionStatus = "active";
  } else if (subscription.status === "canceled") {
    subscriptionStatus = "canceled";
  } else if (subscription.status === "past_due") {
    subscriptionStatus = "past_due";
  }

  // Update user subscription info
  await db
    .update(users)
    .set({
      subscriptionStatus,
      subscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  console.log(
    `[Stripe Webhook] User ${user.id} subscription updated to ${subscriptionStatus}`
  );
}

/**
 * Handle subscription deleted (canceled)
 */
async function handleSubscriptionDeleted(event: any) {
  const subscription = event.data.object;

  console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`);

  // Find user by Stripe customer ID
  const { users } = await import("../../drizzle/schema");
  const { getDb } = await import("../db");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return;

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, subscription.customer))
    .limit(1);

  const user = userResult[0];
  if (!user) {
    console.error(
      `[Stripe Webhook] User not found for customer: ${subscription.customer}`
    );
    return;
  }

  // Downgrade to free tier
  await db
    .update(users)
    .set({
      subscriptionStatus: "free",
      subscriptionId: null,
      currentPeriodEnd: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  console.log(`[Stripe Webhook] User ${user.id} downgraded to free tier`);
}

/**
 * Handle checkout session completed
 * Used for credit pack purchases
 */
async function handleCheckoutSessionCompleted(event: any) {
  const session = event.data.object;

  console.log(`[Stripe Webhook] Checkout session completed: ${session.id}`);

  // Check if this is a credit purchase
  if (session.metadata?.type !== "credit_purchase") {
    console.log("[Stripe Webhook] Not a credit purchase, skipping");
    return;
  }

  const userId = parseInt(session.metadata.userId);
  const packType = session.metadata.packType as
    | "starter"
    | "standard"
    | "pro_pack";
  const creditsAmount = parseInt(session.metadata.creditsAmount);

  if (!userId || !packType || !creditsAmount) {
    console.error("[Stripe Webhook] Missing credit purchase metadata");
    return;
  }

  const { aiCreditPurchases, aiCredits } = await import("../../drizzle/schema");
  const { getDb } = await import("../db");
  const { eq, and } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) return;

  // Get the current month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ATOMIC TRANSACTION: Create purchase record and add credits together
  await db.transaction(async tx => {
    // Create purchase record
    await tx.insert(aiCreditPurchases).values({
      userId,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      packType,
      creditsAmount,
      amountPaid: session.amount_total || 0,
      currency: session.currency || "usd",
      status: "completed",
      appliedToMonth: currentMonth,
      completedAt: new Date(),
    });

    // Add credits to user's current month record
    const existingCredits = await tx
      .select()
      .from(aiCredits)
      .where(
        and(eq(aiCredits.userId, userId), eq(aiCredits.month, currentMonth))
      )
      .limit(1);

    if (existingCredits[0]) {
      // Update existing record
      await tx
        .update(aiCredits)
        .set({
          purchasedCredits:
            (existingCredits[0].purchasedCredits || 0) + creditsAmount,
          updatedAt: new Date(),
        })
        .where(eq(aiCredits.id, existingCredits[0].id));
    } else {
      // Create new record
      await tx.insert(aiCredits).values({
        userId,
        month: currentMonth,
        purchasedCredits: creditsAmount,
      });
    }
  });

  console.log(
    `[Stripe Webhook] Credit purchase completed: ${creditsAmount} credits for user ${userId} (atomic transaction)`
  );
}
