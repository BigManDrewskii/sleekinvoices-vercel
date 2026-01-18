/**
 * Professional email template for client portal invitations
 * Sends secure portal access link to clients
 */

interface PortalInvitationEmailParams {
  clientName: string;
  portalUrl: string;
  companyName?: string;
  expiresInDays: number;
}

/**
 * Escape HTML special characters to prevent XSS in emails
 */
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generatePortalInvitationEmail(
  params: PortalInvitationEmailParams
): { subject: string; html: string; text: string } {
  const {
    clientName,
    portalUrl,
    companyName = "SleekInvoices",
    expiresInDays,
  } = params;

  const subject = `Access Your Invoices - ${companyName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f6f9; color: #1a1a1a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #111d22 0%, #162025 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                ${escapeHtml(companyName)}
              </h1>
              <p style="margin: 10px 0 0; color: #a3b1b8; font-size: 14px;">
                Professional Invoice Management
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111d22; font-size: 24px; font-weight: 600;">
                Hello ${escapeHtml(clientName)},
              </h2>
              
              <p style="margin: 0 0 20px; color: #374d58; font-size: 16px; line-height: 1.6;">
                You've been invited to access your invoices through our secure client portal. View all your invoices, download PDFs, and make payments online—all in one convenient place.
              </p>

              <!-- Portal Access Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; padding: 16px 40px; background-color: #5f6fff; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(95, 111, 255, 0.3);">
                      Access Your Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; color: #374d58; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; padding: 12px; background-color: #f1f6f9; border-radius: 6px; color: #5f6fff; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
                ${portalUrl}
              </p>

              <!-- Features -->
              <div style="margin: 30px 0; padding: 20px; background-color: #f1f6f9; border-radius: 8px; border-left: 4px solid #5f6fff;">
                <p style="margin: 0 0 12px; color: #111d22; font-size: 15px; font-weight: 600;">
                  What you can do in the portal:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #374d58; font-size: 14px; line-height: 1.8;">
                  <li>View all your invoices in one place</li>
                  <li>Download invoice PDFs anytime</li>
                  <li>Make secure payments with Stripe</li>
                  <li>Track your payment history</li>
                </ul>
              </div>

              <!-- Security Notice -->
              <div style="margin: 30px 0 0; padding: 16px; background-color: #fff8e6; border-radius: 8px; border: 1px solid #ffd966;">
                <p style="margin: 0; color: #8b6914; font-size: 13px; line-height: 1.6;">
                  <strong>🔒 Security Notice:</strong> This access link is unique to you and expires in ${expiresInDays} days. Do not share this link with others.
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #374d58; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please don't hesitate to reach out.
              </p>

              <p style="margin: 20px 0 0; color: #374d58; font-size: 14px;">
                Best regards,<br>
                <strong>${escapeHtml(companyName)} Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f1f6f9; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #a3b1b8; font-size: 12px; line-height: 1.6;">
                This email was sent by ${escapeHtml(companyName)}.<br>
                You received this because you are a valued client.
              </p>
              <p style="margin: 15px 0 0; color: #a3b1b8; font-size: 11px;">
                Powered by <a href="https://sleekinvoices.com" style="color: #5f6fff; text-decoration: none;">SleekInvoices</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${companyName}
Professional Invoice Management

Hello ${clientName},

You've been invited to access your invoices through our secure client portal. View all your invoices, download PDFs, and make payments online—all in one convenient place.

Access Your Portal: ${portalUrl}

What you can do in the portal:
• View all your invoices in one place
• Download invoice PDFs anytime
• Make secure payments with Stripe
• Track your payment history

🔒 Security Notice: This access link is unique to you and expires in ${expiresInDays} days. Do not share this link with others.

If you have any questions or need assistance, please don't hesitate to reach out.

Best regards,
${companyName} Team

---
This email was sent by ${companyName}.
You received this because you are a valued client.

Powered by SleekInvoices - https://sleekinvoices.com
  `.trim();

  return { subject, html, text };
}
