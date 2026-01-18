import { Router, Request, Response } from "express";
import * as db from "../db";

const router = Router();

// Resend webhook event types
type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked";

interface ResendWebhookEvent {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // For bounce events
    bounce?: {
      type: string;
      message: string;
    };
    // For click events
    click?: {
      link: string;
      timestamp: string;
      user_agent: string;
      ip_address: string;
    };
    // For open events
    open?: {
      timestamp: string;
      user_agent: string;
      ip_address: string;
    };
  };
}

/**
 * Handle Resend webhook events for email delivery tracking
 * Endpoint: POST /api/webhooks/resend
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const event = req.body as ResendWebhookEvent;

    if (!event.type || !event.data?.email_id) {
      console.warn(
        "[Resend Webhook] Invalid event payload:",
        JSON.stringify(event)
      );
      return res.status(400).json({ error: "Invalid event payload" });
    }

    const messageId = event.data.email_id;
    const timestamp = new Date(event.created_at);

    console.log(
      `[Resend Webhook] Received ${event.type} for message ${messageId}`
    );

    // Find the email log entry by messageId
    const emailLog = await db.getEmailLogByMessageId(messageId);

    if (!emailLog) {
      // Email might have been sent before we started tracking messageIds
      console.log(
        `[Resend Webhook] No email log found for messageId: ${messageId}`
      );
      return res.status(200).json({ received: true, processed: false });
    }

    // Update based on event type
    switch (event.type) {
      case "email.delivered":
        await db.updateEmailLogDelivery(emailLog.id, {
          deliveryStatus: "delivered",
          deliveredAt: timestamp,
        });
        break;

      case "email.opened":
        await db.updateEmailLogDelivery(emailLog.id, {
          deliveryStatus: "opened",
          openedAt: emailLog.openedAt || timestamp, // Keep first open time
          openCount: (emailLog.openCount || 0) + 1,
        });
        break;

      case "email.clicked":
        await db.updateEmailLogDelivery(emailLog.id, {
          deliveryStatus: "clicked",
          clickedAt: emailLog.clickedAt || timestamp, // Keep first click time
          clickCount: (emailLog.clickCount || 0) + 1,
        });
        break;

      case "email.bounced":
        await db.updateEmailLogDelivery(emailLog.id, {
          deliveryStatus: "bounced",
          bouncedAt: timestamp,
          bounceType: event.data.bounce?.type || "unknown",
        });

        // Optionally mark the client's email as invalid
        // This helps prevent future sends to bounced addresses
        console.log(
          `[Resend Webhook] Email bounced for ${event.data.to[0]}: ${event.data.bounce?.message}`
        );
        break;

      case "email.complained":
        await db.updateEmailLogDelivery(emailLog.id, {
          deliveryStatus: "complained",
        });
        console.log(`[Resend Webhook] Spam complaint from ${event.data.to[0]}`);
        break;

      case "email.delivery_delayed":
        // Just log, don't change status
        console.log(`[Resend Webhook] Delivery delayed for ${messageId}`);
        break;

      default:
        console.log(`[Resend Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true, processed: true });
  } catch (error) {
    console.error("[Resend Webhook] Error processing event:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
