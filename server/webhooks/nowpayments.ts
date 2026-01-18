/**
 * NOWPayments IPN (Instant Payment Notification) Webhook Handler
 *
 * This handles payment status updates from NOWPayments.
 * Documentation: https://documenter.getpostman.com/view/7907941/2s93JusNJt#ipn
 */

import { Router, Request, Response } from "express";
import * as nowpayments from "../lib/nowpayments";
import * as db from "../db";
import {
  invoices,
  payments,
  users,
  cryptoSubscriptionPayments,
} from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  calculateExtendedEndDate,
  calculateNewEndDate,
} from "../lib/subscription-utils";
import { sendSubscriptionConfirmationEmail } from "../lib/email-notifications";
import { sendPaymentConfirmationEmail } from "../email";

const router = Router();

interface IPNPayload {
  payment_id: number;
  payment_status: nowpayments.PaymentStatus;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount: number;
  outcome_currency: string;
}

/**
 * Parse subscription order_id to extract userId, months, and isExtension
 * Format: sub_{userId}_{months}mo_{timestamp} or sub_{userId}_{months}mo_ext_{timestamp}
 * Legacy format: sub_{userId}_{timestamp} (defaults to 1 month)
 */
function parseSubscriptionOrderId(orderId: string): {
  userId: number;
  months: number;
  isExtension: boolean;
} | null {
  // New format: sub_{userId}_{months}mo_{timestamp} or sub_{userId}_{months}mo_ext_{timestamp}
  const newFormatMatch = orderId.match(/^sub_(\d+)_(\d+)mo(?:_(ext))?_(\d+)$/);
  if (newFormatMatch) {
    return {
      userId: parseInt(newFormatMatch[1], 10),
      months: parseInt(newFormatMatch[2], 10),
      isExtension: newFormatMatch[3] === "ext",
    };
  }

  // Legacy format: sub_{userId}_{timestamp} (defaults to 1 month)
  const legacyMatch = orderId.match(/^sub_(\d+)_(\d+)$/);
  if (legacyMatch) {
    return {
      userId: parseInt(legacyMatch[1], 10),
      months: 1,
      isExtension: false,
    };
  }

  return null;
}

/**
 * Check if a NOWPayments payment has already been processed (deduplication)
 */
async function isNOWPaymentsPaymentProcessed(
  paymentId: string | number
): Promise<boolean> {
  const database = await db.getDb();
  if (!database) return false;

  // Check in payments table for invoice payments
  const existingPayment = await database
    .select()
    .from(payments)
    .where(sql`${payments.notes} LIKE ${"%NOWPayments ID: " + paymentId + "%"}`)
    .limit(1);

  if (existingPayment.length > 0) {
    return true;
  }

  // Check in crypto subscription payments table
  const existingSubPayment = await database
    .select()
    .from(cryptoSubscriptionPayments)
    .where(eq(cryptoSubscriptionPayments.paymentId, String(paymentId)))
    .limit(1);

  return (
    existingSubPayment.length > 0 &&
    existingSubPayment[0].paymentStatus === "finished"
  );
}

router.post("/nowpayments", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-nowpayments-sig"] as string;
    const payload = req.body as IPNPayload;

    console.log("[NOWPayments IPN] Received webhook:", {
      paymentId: payload.payment_id,
      status: payload.payment_status,
      orderId: payload.order_id,
    });

    // Verify signature - SECURITY: Fail hard in production if no secret
    if (
      signature &&
      !nowpayments.verifyIPNSignature(
        payload as unknown as Record<string, unknown>,
        signature
      )
    ) {
      console.error("[NOWPayments IPN] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // DEDUPLICATION: Check if this payment has already been processed
    if (await isNOWPaymentsPaymentProcessed(payload.payment_id)) {
      console.log(
        `[NOWPayments IPN] Duplicate webhook for payment ${payload.payment_id}, skipping`
      );
      return res
        .status(200)
        .json({ success: true, message: "Already processed" });
    }

    // Check if this is a subscription payment
    const subData = parseSubscriptionOrderId(payload.order_id || "");
    if (subData) {
      return await handleSubscriptionPayment(payload, subData, res);
    }

    // Extract invoice ID from order_id (format: INV-{invoiceId}-{timestamp})
    const orderIdMatch = payload.order_id?.match(/^INV-(\d+)-/);
    if (!orderIdMatch) {
      console.error(
        "[NOWPayments IPN] Invalid order_id format:",
        payload.order_id
      );
      return res.status(400).json({ error: "Invalid order_id format" });
    }

    const invoiceId = parseInt(orderIdMatch[1], 10);
    const database = await db.getDb();
    if (!database) {
      console.error("[NOWPayments IPN] Database not available");
      return res.status(500).json({ error: "Database not available" });
    }

    // Get the invoice
    const [invoice] = await database
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      console.error("[NOWPayments IPN] Invoice not found:", invoiceId);
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Handle payment status
    const status = payload.payment_status;
    console.log("[NOWPayments IPN] Processing status:", status);

    if (nowpayments.isPaymentComplete(status)) {
      // Payment is complete - ATOMIC TRANSACTION: update invoice and create payment together
      const paidAmount = payload.actually_paid || payload.pay_amount;
      const currentPaid = parseFloat(invoice.amountPaid || "0");
      const invoiceTotal = parseFloat(invoice.total);

      // Calculate new amount paid (convert from crypto to fiat using outcome_amount)
      const fiatPaid = payload.outcome_amount || payload.price_amount;
      const newAmountPaid = Math.min(currentPaid + fiatPaid, invoiceTotal);

      // Determine new status
      const newStatus = newAmountPaid >= invoiceTotal ? "paid" : invoice.status;

      // ATOMIC TRANSACTION: Update invoice and create payment together
      await database.transaction(async tx => {
        // Update invoice
        await tx
          .update(invoices)
          .set({
            amountPaid: newAmountPaid.toFixed(8),
            status: newStatus,
            cryptoAmount: paidAmount.toString(),
            paidAt: newStatus === "paid" ? new Date() : invoice.paidAt,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, invoiceId));

        // Record the payment
        await tx.insert(payments).values({
          invoiceId: invoiceId,
          userId: invoice.userId,
          amount: fiatPaid.toFixed(8),
          currency: payload.price_currency.toUpperCase(),
          paymentMethod: "crypto",
          paymentDate: new Date(),
          status: "completed",
          cryptoAmount: paidAmount.toString(),
          cryptoCurrency: payload.pay_currency.toUpperCase(),
          cryptoTxHash: payload.purchase_id,
          cryptoWalletAddress: payload.pay_address,
          notes: `NOWPayments ID: ${payload.payment_id}`,
        });
      });

      console.log(
        "[NOWPayments IPN] Payment recorded successfully (atomic transaction):",
        {
          invoiceId,
          fiatPaid,
          cryptoPaid: paidAmount,
          newStatus,
        }
      );

      // Send payment confirmation email if invoice is fully paid (outside transaction - non-critical)
      if (newStatus === "paid") {
        try {
          const client = await db.getClientById(
            invoice.clientId,
            invoice.userId
          );
          const user = await db.getUserById(invoice.userId);

          if (client?.email && user?.email) {
            await sendPaymentConfirmationEmail({
              invoice: {
                ...invoice,
                amountPaid: newAmountPaid.toFixed(8),
                status: newStatus,
              },
              client,
              user,
              amountPaid: fiatPaid,
              paymentMethod: `Crypto (${payload.pay_currency.toUpperCase()})`,
            });
            console.log(
              "[NOWPayments IPN] Payment confirmation email sent to client"
            );
          }
        } catch (emailError) {
          console.error(
            "[NOWPayments IPN] Failed to send payment confirmation email:",
            emailError
          );
          // Don't fail the webhook if email fails
        }
      }
    } else if (nowpayments.isPaymentFailed(status)) {
      // Payment failed - log but don't change invoice status
      console.log("[NOWPayments IPN] Payment failed:", {
        invoiceId,
        status,
        paymentId: payload.payment_id,
      });
    } else if (nowpayments.isPaymentPending(status)) {
      // Payment is pending - log for monitoring
      console.log("[NOWPayments IPN] Payment pending:", {
        invoiceId,
        status,
        paymentId: payload.payment_id,
      });
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("[NOWPayments IPN] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Handle subscription payment from NOWPayments
 */
async function handleSubscriptionPayment(
  payload: IPNPayload,
  subData: { userId: number; months: number; isExtension: boolean },
  res: Response
) {
  const { userId, months, isExtension } = subData;

  const database = await db.getDb();
  if (!database) {
    return res.status(500).json({ error: "Database not available" });
  }

  const status = payload.payment_status;
  console.log("[NOWPayments IPN] Processing subscription payment:", {
    userId,
    months,
    isExtension,
    status,
    paymentId: payload.payment_id,
  });

  // Update the crypto subscription payment record
  await db.updateCryptoSubscriptionPaymentStatus(
    payload.payment_id.toString(),
    status,
    nowpayments.isPaymentComplete(status) ? new Date() : undefined
  );

  if (nowpayments.isPaymentComplete(status)) {
    // Get current user to calculate end date
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      console.error("[NOWPayments IPN] User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate new subscription end date
    let newEndDate: Date;

    if (isExtension && user.subscriptionStatus === "active") {
      // Extension: add months to existing end date
      newEndDate = calculateExtendedEndDate(
        {
          currentPeriodEnd: user.currentPeriodEnd,
          subscriptionEndDate: user.subscriptionEndDate,
        },
        months
      );
    } else {
      // New subscription: start from now
      newEndDate = calculateNewEndDate(months);
    }

    // Update user subscription
    await database
      .update(users)
      .set({
        subscriptionStatus: "active",
        subscriptionEndDate: newEndDate,
        subscriptionSource: "crypto",
        // Also update currentPeriodEnd for compatibility
        currentPeriodEnd: newEndDate,
      })
      .where(eq(users.id, userId));

    console.log("[NOWPayments IPN] Subscription activated:", {
      userId,
      months,
      isExtension,
      newEndDate: newEndDate.toISOString(),
    });

    // Send confirmation email (outside transaction - non-critical)
    try {
      await sendSubscriptionConfirmationEmail({
        userEmail: user.email,
        userName: user.name || "Valued Customer",
        months,
        isExtension,
        endDate: newEndDate,
        amountPaid: payload.price_amount,
        currency: payload.price_currency.toUpperCase(),
        cryptoCurrency: payload.pay_currency.toUpperCase(),
        cryptoAmount: payload.actually_paid || payload.pay_amount,
      });
      console.log("[NOWPayments IPN] Confirmation email sent to:", user.email);
    } catch (emailError) {
      // Don't fail the webhook if email fails
      console.error(
        "[NOWPayments IPN] Failed to send confirmation email:",
        emailError
      );
    }
  }

  return res.status(200).json({ success: true });
}

export default router;
