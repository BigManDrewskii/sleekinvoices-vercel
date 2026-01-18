/**
 * Email Notifications for Subscription Events
 *
 * Sends transactional emails for subscription confirmations,
 * expiration warnings, and other subscription-related events.
 */

import { Resend } from "resend";
import { formatEndDate } from "./subscription-utils";

// Lazy-initialized Resend client to prevent startup crashes if API key is missing
let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Email sender configuration
const FROM_EMAIL = "SleekInvoices <noreply@sleekinvoices.com>";

interface SubscriptionConfirmationParams {
  userEmail: string | null;
  userName: string;
  months: number;
  isExtension: boolean;
  endDate: Date;
  amountPaid: number;
  currency: string;
  cryptoCurrency: string;
  cryptoAmount: number;
}

/**
 * Send subscription confirmation email after successful crypto payment
 */
export async function sendSubscriptionConfirmationEmail(
  params: SubscriptionConfirmationParams
): Promise<boolean> {
  const {
    userEmail,
    userName,
    months,
    isExtension,
    endDate,
    amountPaid,
    currency,
    cryptoCurrency,
    cryptoAmount,
  } = params;

  if (!userEmail) {
    console.log(
      "[Email] No email address for user, skipping confirmation email"
    );
    return false;
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] RESEND_API_KEY not configured, skipping email");
    return false;
  }

  const durationText = months === 1 ? "1 month" : `${months} months`;
  const actionText = isExtension ? "extended" : "activated";
  const formattedEndDate = formatEndDate(endDate);

  const subject = isExtension
    ? `Your SleekInvoices Pro subscription has been extended!`
    : `Welcome to SleekInvoices Pro!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #facc15; font-size: 28px; margin: 0;">SleekInvoices</h1>
        </div>
        
        <!-- Main Card -->
        <div style="background-color: #171717; border-radius: 12px; padding: 32px; border: 1px solid #262626;">
          <!-- Success Icon -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 64px; height: 64px; background-color: #166534; border-radius: 50%; line-height: 64px; font-size: 32px;">
              ✓
            </div>
          </div>
          
          <!-- Greeting -->
          <h2 style="color: #ffffff; font-size: 24px; text-align: center; margin: 0 0 16px 0;">
            ${isExtension ? "Subscription Extended!" : "Welcome to Pro!"}
          </h2>
          
          <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 32px 0;">
            Hi ${userName},<br><br>
            Your SleekInvoices Pro subscription has been successfully ${actionText} for <strong style="color: #facc15;">${durationText}</strong>.
          </p>
          
          <!-- Details Box -->
          <div style="background-color: #0a0a0a; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h3 style="color: #facc15; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
              Subscription Details
            </h3>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="color: #737373; font-size: 14px; padding: 8px 0;">Plan</td>
                <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">Pro</td>
              </tr>
              <tr>
                <td style="color: #737373; font-size: 14px; padding: 8px 0;">Duration</td>
                <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${durationText}</td>
              </tr>
              <tr>
                <td style="color: #737373; font-size: 14px; padding: 8px 0;">Valid Until</td>
                <td style="color: #22c55e; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 600;">${formattedEndDate}</td>
              </tr>
            </table>
          </div>
          
          <!-- Payment Box -->
          <div style="background-color: #0a0a0a; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
            <h3 style="color: #facc15; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
              Payment Receipt
            </h3>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="color: #737373; font-size: 14px; padding: 8px 0;">Amount</td>
                <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">$${amountPaid.toFixed(2)} ${currency}</td>
              </tr>
              <tr>
                <td style="color: #737373; font-size: 14px; padding: 8px 0;">Paid with</td>
                <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">${cryptoAmount} ${cryptoCurrency}</td>
              </tr>
              <tr>
                <td style="color: #737373; font-size: 14px; padding: 8px 0;">Payment Method</td>
                <td style="color: #ffffff; font-size: 14px; padding: 8px 0; text-align: right;">Cryptocurrency</td>
              </tr>
            </table>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="https://sleekinvoices.com/dashboard" style="display: inline-block; background-color: #facc15; color: #0a0a0a; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <!-- Pro Features -->
        <div style="background-color: #171717; border-radius: 12px; padding: 24px; margin-top: 24px; border: 1px solid #262626;">
          <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 16px 0;">
            Your Pro Benefits
          </h3>
          <ul style="color: #a3a3a3; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Unlimited invoices</li>
            <li>Unlimited clients</li>
            <li>Stripe payment links</li>
            <li>Email sending</li>
            <li>Analytics dashboard</li>
            <li>Custom branding</li>
            <li>Priority support</li>
          </ul>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #262626;">
          <p style="color: #525252; font-size: 12px; margin: 0 0 8px 0;">
            This email was sent by SleekInvoices
          </p>
          <p style="color: #525252; font-size: 12px; margin: 0;">
            <a href="https://sleekinvoices.com" style="color: #737373; text-decoration: none;">sleekinvoices.com</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${userName},

Your SleekInvoices Pro subscription has been successfully ${actionText} for ${durationText}.

SUBSCRIPTION DETAILS
--------------------
Plan: Pro
Duration: ${durationText}
Valid Until: ${formattedEndDate}

PAYMENT RECEIPT
---------------
Amount: $${amountPaid.toFixed(2)} ${currency}
Paid with: ${cryptoAmount} ${cryptoCurrency}
Payment Method: Cryptocurrency

Your Pro Benefits:
- Unlimited invoices
- Unlimited clients
- Stripe payment links
- Email sending
- Analytics dashboard
- Custom branding
- Priority support

Go to your dashboard: https://sleekinvoices.com/dashboard

Thank you for choosing SleekInvoices!

---
This email was sent by SleekInvoices
https://sleekinvoices.com
  `.trim();

  try {
    const resend = getResend();
    if (!resend) {
      console.log("[Email] Resend client not available");
      return false;
    }
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Email] Failed to send subscription confirmation:", error);
      return false;
    }

    console.log("[Email] Subscription confirmation sent:", data?.id);
    return true;
  } catch (error) {
    console.error("[Email] Error sending subscription confirmation:", error);
    return false;
  }
}

interface ExpirationWarningParams {
  userEmail: string | null;
  userName: string;
  daysRemaining: number;
  endDate: Date;
}

/**
 * Send expiration warning email when subscription is about to expire
 */
export async function sendExpirationWarningEmail(
  params: ExpirationWarningParams
): Promise<boolean> {
  const { userEmail, userName, daysRemaining, endDate } = params;

  if (!userEmail) {
    console.log(
      "[Email] No email address for user, skipping expiration warning"
    );
    return false;
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] RESEND_API_KEY not configured, skipping email");
    return false;
  }

  const formattedEndDate = formatEndDate(endDate);
  const daysText = daysRemaining === 1 ? "1 day" : `${daysRemaining} days`;

  const subject = `Your SleekInvoices Pro subscription expires in ${daysText}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #facc15; font-size: 28px; margin: 0;">SleekInvoices</h1>
        </div>
        
        <!-- Main Card -->
        <div style="background-color: #171717; border-radius: 12px; padding: 32px; border: 1px solid #f59e0b;">
          <!-- Warning Icon -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 64px; height: 64px; background-color: #78350f; border-radius: 50%; line-height: 64px; font-size: 32px;">
              ⚠
            </div>
          </div>
          
          <!-- Heading -->
          <h2 style="color: #f59e0b; font-size: 24px; text-align: center; margin: 0 0 16px 0;">
            Subscription Expiring Soon
          </h2>
          
          <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 32px 0;">
            Hi ${userName},<br><br>
            Your SleekInvoices Pro subscription will expire in <strong style="color: #f59e0b;">${daysText}</strong> on ${formattedEndDate}.
          </p>
          
          <!-- Extend Box -->
          <div style="background-color: #0a0a0a; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 16px 0;">
              Don't lose access to your Pro features! Extend your subscription now and save up to 29% with crypto payments.
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center;">
            <a href="https://sleekinvoices.com/subscription" style="display: inline-block; background-color: #facc15; color: #0a0a0a; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              Extend Subscription
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #262626;">
          <p style="color: #525252; font-size: 12px; margin: 0 0 8px 0;">
            This email was sent by SleekInvoices
          </p>
          <p style="color: #525252; font-size: 12px; margin: 0;">
            <a href="https://sleekinvoices.com" style="color: #737373; text-decoration: none;">sleekinvoices.com</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${userName},

Your SleekInvoices Pro subscription will expire in ${daysText} on ${formattedEndDate}.

Don't lose access to your Pro features! Extend your subscription now and save up to 29% with crypto payments.

Extend your subscription: https://sleekinvoices.com/subscription

---
This email was sent by SleekInvoices
https://sleekinvoices.com
  `.trim();

  try {
    const resend = getResend();
    if (!resend) {
      console.log("[Email] Resend client not available");
      return false;
    }
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[Email] Failed to send expiration warning:", error);
      return false;
    }

    console.log("[Email] Expiration warning sent:", data?.id);
    return true;
  } catch (error) {
    console.error("[Email] Error sending expiration warning:", error);
    return false;
  }
}
