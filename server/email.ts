import { Resend } from 'resend';
import { Invoice, Client, User } from '../drizzle/schema';

// Initialize Resend (will use RESEND_API_KEY from env if available)
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  if (!resend) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }
  return resend;
}

interface SendInvoiceEmailParams {
  invoice: Invoice;
  client: Client;
  user: User;
  pdfBuffer: Buffer;
  paymentLinkUrl?: string;
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Send invoice email to client
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { invoice, client, user, pdfBuffer, paymentLinkUrl } = params;
  
  if (!client.email) {
    return { success: false, error: 'Client email is not set' };
  }
  
  if (!user.email) {
    return { success: false, error: 'User email is not set' };
  }
  
  try {
    const resendClient = getResend();
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 32px 0;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 32px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #111827;
    }
    .invoice-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    .detail-value {
      color: #111827;
      font-weight: 600;
    }
    .amount {
      font-size: 24px;
      color: #111827;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
      margin: 24px 0;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .message {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Invoice from ${user.companyName || user.name || 'Your Company'}</h1>
  </div>
  
  <div class="message">
    <p>Hello ${client.name},</p>
    <p>Thank you for your business! Please find attached invoice ${invoice.invoiceNumber} for your review.</p>
  </div>
  
  <div class="invoice-details">
    <div class="detail-row">
      <span class="detail-label">Invoice Number:</span>
      <span class="detail-value">${invoice.invoiceNumber}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Issue Date:</span>
      <span class="detail-value">${formatDate(invoice.issueDate)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Due Date:</span>
      <span class="detail-value">${formatDate(invoice.dueDate)}</span>
    </div>
    <div class="detail-row" style="border-top: 2px solid #e5e7eb; margin-top: 16px; padding-top: 16px;">
      <span class="detail-label">Amount Due:</span>
      <span class="detail-value amount">${formatCurrency(invoice.total)}</span>
    </div>
  </div>
  
  ${paymentLinkUrl ? `
  <div style="text-align: center;">
    <a href="${paymentLinkUrl}" class="button">Pay Invoice Online</a>
    <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
      Click the button above to pay securely with credit card or bank transfer.
    </p>
  </div>
  ` : ''}
  
  <div class="message">
    <p>The invoice is attached as a PDF. If you have any questions, please don't hesitate to reach out.</p>
    <p>Best regards,<br>${user.name || 'Your Company'}</p>
  </div>
  
  <div class="footer">
    ${user.companyName ? `<p>${user.companyName}</p>` : ''}
    ${user.companyAddress ? `<p>${user.companyAddress}</p>` : ''}
    ${user.email ? `<p>${user.email}</p>` : ''}
    ${user.companyPhone ? `<p>${user.companyPhone}</p>` : ''}
  </div>
</body>
</html>
    `;
    
    const result = await resendClient.emails.send({
      from: `${user.name || user.companyName || 'SleekInvoices'} <invoices@sleekinvoices.com>`,
      replyTo: user.email || 'support@sleekinvoices.com',
      to: [client.email],
      subject: `Invoice ${invoice.invoiceNumber} from ${user.companyName || user.name}`,
      html: emailHtml,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Failed to send invoice email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(params: SendInvoiceEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { invoice, client, user, paymentLinkUrl } = params;
  
  if (!client.email) {
    return { success: false, error: 'Client email is not set' };
  }
  
  if (!user.email) {
    return { success: false, error: 'User email is not set' };
  }
  
  try {
    const resendClient = getResend();
    
    const isOverdue = invoice.status === 'overdue';
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 32px 0;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 32px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: ${isOverdue ? '#dc2626' : '#111827'};
    }
    .alert {
      background: ${isOverdue ? '#fee2e2' : '#fef3c7'};
      border-left: 4px solid ${isOverdue ? '#dc2626' : '#f59e0b'};
      padding: 16px;
      margin-bottom: 24px;
      border-radius: 4px;
    }
    .invoice-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    .detail-value {
      color: #111827;
      font-weight: 600;
    }
    .amount {
      font-size: 24px;
      color: ${isOverdue ? '#dc2626' : '#111827'};
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
      margin: 24px 0;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .message {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}</h1>
  </div>
  
  <div class="alert">
    <strong>${isOverdue ? 'Urgent:' : 'Reminder:'}</strong> 
    Invoice ${invoice.invoiceNumber} ${isOverdue ? 'is now overdue' : 'is due soon'}.
  </div>
  
  <div class="message">
    <p>Hello ${client.name},</p>
    <p>This is a ${isOverdue ? 'friendly reminder that payment for' : 'reminder about'} invoice ${invoice.invoiceNumber} ${isOverdue ? 'was due on' : 'is due on'} ${formatDate(invoice.dueDate)}.</p>
  </div>
  
  <div class="invoice-details">
    <div class="detail-row">
      <span class="detail-label">Invoice Number:</span>
      <span class="detail-value">${invoice.invoiceNumber}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Due Date:</span>
      <span class="detail-value">${formatDate(invoice.dueDate)}</span>
    </div>
    <div class="detail-row" style="border-top: 2px solid #e5e7eb; margin-top: 16px; padding-top: 16px;">
      <span class="detail-label">Amount Due:</span>
      <span class="detail-value amount">${formatCurrency(invoice.total)}</span>
    </div>
  </div>
  
  ${paymentLinkUrl ? `
  <div style="text-align: center;">
    <a href="${paymentLinkUrl}" class="button">Pay Now</a>
    <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
      Click the button above to pay securely with credit card or bank transfer.
    </p>
  </div>
  ` : ''}
  
  <div class="message">
    <p>If you've already sent payment, please disregard this reminder. If you have any questions or concerns, please reach out to us.</p>
    <p>Thank you for your prompt attention to this matter.</p>
    <p>Best regards,<br>${user.name || 'Your Company'}</p>
  </div>
  
  <div class="footer">
    ${user.companyName ? `<p>${user.companyName}</p>` : ''}
    ${user.email ? `<p>${user.email}</p>` : ''}
  </div>
</body>
</html>
    `;
    
    const result = await resendClient.emails.send({
      from: `${user.name || user.companyName || 'SleekInvoices'} <reminders@sleekinvoices.com>`,
      replyTo: user.email || 'support@sleekinvoices.com',
      to: [client.email],
      subject: `${isOverdue ? 'Overdue' : 'Reminder'}: Invoice ${invoice.invoiceNumber}`,
      html: emailHtml,
    });
    
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Failed to send reminder email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}


/**
 * Default reminder email template
 */
export const DEFAULT_REMINDER_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 32px 0;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 32px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      color: #111827;
    }
    .alert {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      margin-bottom: 24px;
      border-radius: 4px;
    }
    .alert-text {
      color: #991b1b;
      font-weight: 600;
      margin: 0;
    }
    .invoice-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    .detail-value {
      color: #111827;
      font-weight: 600;
    }
    .amount {
      font-size: 24px;
      color: #ef4444;
    }
    .button {
      display: inline-block;
      background: #ef4444;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
      margin: 24px 0;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .message {
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Payment Reminder</h1>
  </div>
  
  <div class="alert">
    <p class="alert-text">⚠️ This invoice is {{daysOverdue}} days overdue</p>
  </div>
  
  <div class="message">
    <p>Dear {{clientName}},</p>
    <p>This is a friendly reminder that invoice {{invoiceNumber}} is now {{daysOverdue}} days past due. We kindly request your prompt attention to this matter.</p>
  </div>
  
  <div class="invoice-details">
    <div class="detail-row">
      <span class="detail-label">Invoice Number:</span>
      <span class="detail-value">{{invoiceNumber}}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Original Due Date:</span>
      <span class="detail-value">{{dueDate}}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Amount Due:</span>
      <span class="detail-value amount">{{invoiceAmount}}</span>
    </div>
  </div>
  
  <div style="text-align: center;">
    <a href="{{invoiceUrl}}" class="button">View & Pay Invoice</a>
  </div>
  
  <div class="message">
    <p>If you have already made this payment, please disregard this reminder. If you have any questions or concerns, please don't hesitate to contact us.</p>
    <p>Thank you for your prompt attention to this matter.</p>
    <p>Best regards,<br>{{companyName}}</p>
  </div>
  
  <div class="footer">
    <p>This is an automated reminder from {{companyName}}</p>
  </div>
</body>
</html>
`;

interface RenderReminderEmailParams {
  template: string;
  invoice: Invoice;
  client: Client;
  user: User;
  daysOverdue: number;
  invoiceUrl: string;
}

/**
 * Render reminder email template with placeholders replaced
 */
export function renderReminderEmail(params: RenderReminderEmailParams): string {
  const { template, invoice, client, user, daysOverdue, invoiceUrl } = params;
  
  const placeholders: Record<string, string> = {
    '{{clientName}}': client.name || 'Valued Customer',
    '{{invoiceNumber}}': invoice.invoiceNumber || 'N/A',
    '{{invoiceAmount}}': formatCurrency(invoice.total || 0),
    '{{dueDate}}': formatDate(invoice.dueDate),
    '{{daysOverdue}}': daysOverdue.toString(),
    '{{invoiceUrl}}': invoiceUrl,
    '{{companyName}}': user.companyName || user.name || 'Your Company',
  };
  
  let rendered = template;
  for (const [placeholder, value] of Object.entries(placeholders)) {
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return rendered;
}

interface SendReminderEmailParams {
  invoice: Invoice;
  client: Client;
  user: User;
  daysOverdue: number;
  template?: string;
  ccEmail?: string;
}

/**
 * Send payment reminder email to client
 */
export async function sendReminderEmail(params: SendReminderEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { invoice, client, user, daysOverdue, template, ccEmail } = params;
  
  if (!client.email) {
    return { success: false, error: 'Client email is not set' };
  }
  
  if (!user.email) {
    return { success: false, error: 'User email is not set' };
  }
  
  try {
    const resendClient = getResend();
    
    // Generate invoice URL (client portal)
    const invoiceUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/portal/${invoice.id}`;
    
    // Render template
    const emailHtml = renderReminderEmail({
      template: template || DEFAULT_REMINDER_TEMPLATE,
      invoice,
      client,
      user,
      daysOverdue,
      invoiceUrl,
    });
    
    const emailOptions: any = {
      from: `${user.companyName || user.name || 'SleekInvoices'} <reminders@sleekinvoices.com>`,
      replyTo: user.email || 'support@sleekinvoices.com',
      to: client.email,
      subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue`,
      html: emailHtml,
    };
    
    // Add CC if provided
    if (ccEmail) {
      emailOptions.cc = ccEmail;
    }
    
    const result = await resendClient.emails.send(emailOptions);
    
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('Failed to send reminder email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send payment confirmation email
 */
interface SendPaymentConfirmationParams {
  invoice: Invoice;
  client: Client;
  user: User;
  amountPaid: number | string;
  paymentMethod?: string;
}

export async function sendPaymentConfirmationEmail(params: SendPaymentConfirmationParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { invoice, client, user, amountPaid, paymentMethod = 'Stripe' } = params;

  if (!client.email) {
    return { success: false, error: 'Client email is not set' };
  }

  if (!user.email) {
    return { success: false, error: 'User email is not set' };
  }

  try {
    const resendClient = getResend();

    // Generate invoice URL (client portal)
    const portalUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/portal/${invoice.id}`;

    const paidAmount = formatCurrency(amountPaid);
    const invoiceTotal = formatCurrency(invoice.total);

    // Create payment confirmation email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Payment Received!</h1>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${client.name || 'there'},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">Great news! We've received your payment for <strong>Invoice ${invoice.invoiceNumber}</strong>.</p>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #374151;">Payment Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280;">Invoice Number</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600;">${invoice.invoiceNumber}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280;">Amount Paid</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #10b981;">${paidAmount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280;">Invoice Total</td>
                  <td style="padding: 12px 0; text-align: right; font-weight: 600;">${invoiceTotal}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 0; color: #6b7280;">Payment Method</td>
                  <td style="padding: 12px 0; text-align: right;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280;">Payment Date</td>
                  <td style="padding: 12px 0; text-align: right;">${formatDate(new Date())}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 16px; margin: 25px 0;">Thank you for your prompt payment. If you have any questions or concerns, please don't hesitate to reach out.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Invoice</a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              Best regards,<br>
              <strong>${user.companyName || user.name}</strong>
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated payment confirmation email.</p>
            <p>If you have any questions, please contact ${user.email}</p>
          </div>
        </body>
      </html>
    `;

    const result = await resendClient.emails.send({
      from: `${user.companyName || user.name || 'SleekInvoices'} <payments@sleekinvoices.com>`,
      replyTo: user.email || 'support@sleekinvoices.com',
      to: client.email,
      subject: `Payment Received for Invoice ${invoice.invoiceNumber}`,
      html: emailHtml,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send payment confirmation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
