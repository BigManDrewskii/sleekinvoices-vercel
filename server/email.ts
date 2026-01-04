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
      from: `${user.name || user.companyName || 'Invoice'} <onboarding@resend.dev>`, // TODO: Use custom domain
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
      from: `${user.name || user.companyName || 'Invoice'} <onboarding@resend.dev>`,
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
