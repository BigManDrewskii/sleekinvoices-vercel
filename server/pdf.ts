import puppeteer from 'puppeteer';
import { Invoice, Client, InvoiceLineItem, User } from '../drizzle/schema';

interface InvoicePDFData {
  invoice: Invoice;
  client: Client;
  lineItems: InvoiceLineItem[];
  user: User;
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

function generateInvoiceHTML(data: InvoicePDFData): string {
  const { invoice, client, lineItems, user } = data;
  
  const lineItemsHTML = lineItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.rate)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      padding: 40px;
      background: white;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .company-info {
      flex: 1;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .company-details {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.8;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h1 {
      font-size: 36px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .invoice-number {
      font-size: 14px;
      color: #6b7280;
    }
    
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 48px;
    }
    
    .bill-to, .invoice-info {
      flex: 1;
    }
    
    .section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    
    .client-name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .client-details {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.8;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .info-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .info-label {
      color: #6b7280;
      margin-right: 12px;
    }
    
    .info-value {
      color: #111827;
      font-weight: 600;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-draft {
      background: #f3f4f6;
      color: #6b7280;
    }
    
    .status-sent {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-paid {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-overdue {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .line-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    
    .line-items-table thead {
      background: #f9fafb;
    }
    
    .line-items-table th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .line-items-table th:nth-child(2),
    .line-items-table th:nth-child(3),
    .line-items-table th:nth-child(4) {
      text-align: right;
    }
    
    .line-items-table td {
      font-size: 14px;
      color: #374151;
    }
    
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 24px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 14px;
    }
    
    .total-label {
      color: #6b7280;
    }
    
    .total-value {
      color: #111827;
      font-weight: 600;
    }
    
    .grand-total {
      border-top: 2px solid #e5e7eb;
      padding-top: 16px !important;
      margin-top: 8px;
    }
    
    .grand-total .total-label {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    
    .grand-total .total-value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }
    
    .notes-section {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .notes-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .notes-content {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.8;
    }
    
    .footer {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        ${user.logoUrl ? `<img src="${user.logoUrl}" alt="Logo" style="max-width: 120px; margin-bottom: 16px;">` : ''}
        <div class="company-name">${user.companyName || user.name || 'Your Company'}</div>
        <div class="company-details">
          ${user.companyAddress ? `${user.companyAddress}<br>` : ''}
          ${user.email ? `${user.email}<br>` : ''}
          ${user.companyPhone ? `${user.companyPhone}` : ''}
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
      </div>
    </div>
    
    <div class="invoice-details">
      <div class="bill-to">
        <div class="section-title">Bill To</div>
        <div class="client-name">${client.name}</div>
        <div class="client-details">
          ${client.companyName ? `${client.companyName}<br>` : ''}
          ${client.address ? `${client.address}<br>` : ''}
          ${client.email ? `${client.email}<br>` : ''}
          ${client.phone ? `${client.phone}` : ''}
        </div>
      </div>
      <div class="invoice-info">
        <div class="section-title">Invoice Details</div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Issue Date:</span>
          <span class="info-value">${formatDate(invoice.issueDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Due Date:</span>
          <span class="info-value">${formatDate(invoice.dueDate)}</span>
        </div>
        ${invoice.paidAt ? `
        <div class="info-row">
          <span class="info-label">Paid On:</span>
          <span class="info-value">${formatDate(invoice.paidAt)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <table class="line-items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Rate</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="total-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${formatCurrency(invoice.subtotal)}</span>
      </div>
      ${Number(invoice.discountAmount) > 0 ? `
      <div class="total-row">
        <span class="total-label">Discount ${invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
        <span class="total-value">-${formatCurrency(invoice.discountAmount)}</span>
      </div>
      ` : ''}
      ${Number(invoice.taxAmount) > 0 ? `
      <div class="total-row">
        <span class="total-label">Tax (${invoice.taxRate}%)</span>
        <span class="total-value">${formatCurrency(invoice.taxAmount)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span class="total-label">Total</span>
        <span class="total-value">${formatCurrency(invoice.total)}</span>
      </div>
    </div>
    
    ${invoice.notes || invoice.paymentTerms ? `
    <div class="notes-section">
      ${invoice.notes ? `
      <div style="margin-bottom: 24px;">
        <div class="notes-title">Notes</div>
        <div class="notes-content">${invoice.notes}</div>
      </div>
      ` : ''}
      ${invoice.paymentTerms ? `
      <div>
        <div class="notes-title">Payment Terms</div>
        <div class="notes-content">${invoice.paymentTerms}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <div class="footer">
      Thank you for your business!
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF from invoice data
 */
export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const html = generateInvoiceHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
