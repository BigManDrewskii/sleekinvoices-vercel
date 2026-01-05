/**
 * NOWPayments IPN (Instant Payment Notification) Webhook Handler
 * 
 * This handles payment status updates from NOWPayments.
 * Documentation: https://documenter.getpostman.com/view/7907941/2s93JusNJt#ipn
 */

import { Router, Request, Response } from 'express';
import * as nowpayments from '../lib/nowpayments';
import * as db from '../db';
import { invoices, payments, users, cryptoSubscriptionPayments } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

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

router.post('/nowpayments', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-nowpayments-sig'] as string;
    const payload = req.body as IPNPayload;

    console.log('[NOWPayments IPN] Received webhook:', {
      paymentId: payload.payment_id,
      status: payload.payment_status,
      orderId: payload.order_id,
    });

    // Verify signature
    if (signature && !nowpayments.verifyIPNSignature(payload as unknown as Record<string, unknown>, signature)) {
      console.error('[NOWPayments IPN] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if this is a subscription payment (format: sub_{userId}_{timestamp})
    const subMatch = payload.order_id?.match(/^sub_(\d+)_/);
    if (subMatch) {
      // Handle subscription payment
      return await handleSubscriptionPayment(payload, res);
    }

    // Extract invoice ID from order_id (format: INV-{invoiceId}-{timestamp})
    const orderIdMatch = payload.order_id?.match(/^INV-(\d+)-/);
    if (!orderIdMatch) {
      console.error('[NOWPayments IPN] Invalid order_id format:', payload.order_id);
      return res.status(400).json({ error: 'Invalid order_id format' });
    }

    const invoiceId = parseInt(orderIdMatch[1], 10);
    const database = await db.getDb();
    if (!database) {
      console.error('[NOWPayments IPN] Database not available');
      return res.status(500).json({ error: 'Database not available' });
    }

    // Get the invoice
    const [invoice] = await database
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      console.error('[NOWPayments IPN] Invoice not found:', invoiceId);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Handle payment status
    const status = payload.payment_status;
    console.log('[NOWPayments IPN] Processing status:', status);

    if (nowpayments.isPaymentComplete(status)) {
      // Payment is complete - update invoice
      const paidAmount = payload.actually_paid || payload.pay_amount;
      const currentPaid = parseFloat(invoice.amountPaid || '0');
      const invoiceTotal = parseFloat(invoice.total);
      
      // Calculate new amount paid (convert from crypto to fiat using outcome_amount)
      const fiatPaid = payload.outcome_amount || payload.price_amount;
      const newAmountPaid = Math.min(currentPaid + fiatPaid, invoiceTotal);
      
      // Determine new status
      const newStatus = newAmountPaid >= invoiceTotal ? 'paid' : invoice.status;

      // Update invoice
      await database
        .update(invoices)
        .set({
          amountPaid: newAmountPaid.toFixed(8),
          status: newStatus,
          cryptoAmount: paidAmount.toString(),
          paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt,
        })
        .where(eq(invoices.id, invoiceId));

      // Record the payment
      await database.insert(payments).values({
        invoiceId: invoiceId,
        userId: invoice.userId,
        amount: fiatPaid.toFixed(8),
        currency: payload.price_currency.toUpperCase(),
        paymentMethod: 'crypto',
        paymentDate: new Date(),
        status: 'completed',
        cryptoAmount: paidAmount.toString(),
        cryptoCurrency: payload.pay_currency.toUpperCase(),
        cryptoTxHash: payload.purchase_id,
        cryptoWalletAddress: payload.pay_address,
        notes: `NOWPayments ID: ${payload.payment_id}`,
      });

      console.log('[NOWPayments IPN] Payment recorded successfully:', {
        invoiceId,
        fiatPaid,
        cryptoPaid: paidAmount,
        newStatus,
      });
    } else if (nowpayments.isPaymentFailed(status)) {
      // Payment failed - log but don't change invoice status
      console.log('[NOWPayments IPN] Payment failed:', {
        invoiceId,
        status,
        paymentId: payload.payment_id,
      });
    } else if (nowpayments.isPaymentPending(status)) {
      // Payment is pending - log for monitoring
      console.log('[NOWPayments IPN] Payment pending:', {
        invoiceId,
        status,
        paymentId: payload.payment_id,
      });
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[NOWPayments IPN] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle subscription payment from NOWPayments
 */
async function handleSubscriptionPayment(payload: IPNPayload, res: Response) {
  const userIdMatch = payload.order_id?.match(/^sub_(\d+)_/);
  if (!userIdMatch) {
    return res.status(400).json({ error: 'Invalid subscription order_id' });
  }

  const userId = parseInt(userIdMatch[1], 10);
  const database = await db.getDb();
  if (!database) {
    return res.status(500).json({ error: 'Database not available' });
  }

  const status = payload.payment_status;
  console.log('[NOWPayments IPN] Processing subscription payment:', {
    userId,
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
    // Activate Pro subscription
    await database
      .update(users)
      .set({
        subscriptionStatus: 'active',
        // Set period end to 30 days from now
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .where(eq(users.id, userId));

    console.log('[NOWPayments IPN] Pro subscription activated for user:', userId);
  }

  return res.status(200).json({ success: true });
}

export default router;
