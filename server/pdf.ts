import puppeteer from 'puppeteer';
import { Invoice, Client, InvoiceLineItem, User } from '../drizzle/schema';
import type { InvoiceTemplate } from '../drizzle/schema';

interface InvoicePDFData {
  invoice: Invoice;
  client: Client;
  lineItems: InvoiceLineItem[];
  user: User;
  template?: InvoiceTemplate | null;
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

function formatDate(date: Date | null, dateFormat: string = 'MM/DD/YYYY'): string {
  if (!date) return '';
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (dateFormat) {
    case "DD/MM/YYYY":
      return `${day}/${month}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MMM DD, YYYY":
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    default: // MM/DD/YYYY
      return `${month}/${day}/${year}`;
  }
}

function generateInvoiceHTML(data: InvoicePDFData): string {
  const { invoice, client, lineItems, user, template } = data;
  
  // Default template values
  const primaryColor = template?.primaryColor || '#5f6fff';
  const secondaryColor = template?.secondaryColor || '#252f33';
  const accentColor = template?.accentColor || '#10b981';
  const headingFont = template?.headingFont || 'Inter, sans-serif';
  const bodyFont = template?.bodyFont || 'Inter, sans-serif';
  const fontSize = template?.fontSize || 14;
  const logoUrl = template?.logoUrl;
  const logoPosition = template?.logoPosition || 'left';
  const logoWidth = template?.logoWidth || 150;
  const headerLayout = template?.headerLayout || 'standard';
  const footerLayout = template?.footerLayout || 'simple';
  const showCompanyAddress = template?.showCompanyAddress !== false;
  const showPaymentTerms = template?.showPaymentTerms !== false;
  const showTaxField = template?.showTaxField !== false;
  const showDiscountField = template?.showDiscountField !== false;
  const showNotesField = template?.showNotesField !== false;
  const footerText = template?.footerText || 'Thank you for your business!';
  const dateFormat = template?.dateFormat || 'MM/DD/YYYY';
  
  const lineItemsHTML = lineItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.rate)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('');

  // Header layout styles
  const headerFlexStyle = headerLayout === 'split' ? 'display: flex; justify-content: space-between; align-items: flex-start;' : '';
  const logoAlignStyle = 
    logoPosition === 'center' ? 'margin: 0 auto; text-align: center;' :
    logoPosition === 'right' ? 'margin-left: auto; text-align: right;' :
    '';
  const invoiceTitleAlign = headerLayout === 'centered' ? 'text-align: center;' : headerLayout === 'split' ? 'text-align: right;' : '';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@400;500;700&family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${bodyFont};
      color: ${secondaryColor};
      font-size: ${fontSize}px;
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
      ${headerFlexStyle}
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 2px solid ${primaryColor}40;
    }
    
    .company-info {
      ${headerLayout === 'split' ? 'flex: 1;' : ''}
      ${logoAlignStyle}
    }
    
    .company-logo {
      max-width: ${logoWidth}px;
      margin-bottom: 16px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      font-family: ${headingFont};
      color: ${primaryColor};
      margin-bottom: 8px;
    }
    
    .company-details {
      font-size: ${fontSize - 1}px;
      color: ${secondaryColor}cc;
      line-height: 1.8;
    }
    
    .invoice-title {
      ${invoiceTitleAlign}
      ${headerLayout === 'split' ? 'flex: 1;' : ''}
    }
    
    .invoice-title h1 {
      font-size: 36px;
      font-weight: 700;
      font-family: ${headingFont};
      color: ${primaryColor};
      margin-bottom: 8px;
    }
    
    .invoice-number {
      font-size: ${fontSize}px;
      color: ${secondaryColor}cc;
    }
    
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 1px solid ${primaryColor}20;
    }
    
    .bill-to, .invoice-info {
      flex: 1;
    }
    
    .section-title {
      font-size: ${fontSize - 2}px;
      font-weight: 600;
      font-family: ${headingFont};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${primaryColor};
      margin-bottom: 12px;
    }
    
    .client-name {
      font-size: ${fontSize + 2}px;
      font-weight: 600;
      color: ${secondaryColor};
      margin-bottom: 4px;
    }
    
    .client-details {
      font-size: ${fontSize}px;
      color: ${secondaryColor}cc;
      line-height: 1.8;
    }
    
    .invoice-info {
      text-align: right;
    }
    
    .info-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
      font-size: ${fontSize}px;
    }
    
    .info-label {
      color: ${secondaryColor}cc;
      margin-right: 12px;
    }
    
    .info-value {
      color: ${secondaryColor};
      font-weight: 600;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: ${fontSize - 2}px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .status-draft {
      background: #f3f4f6;
      color: #6b7280;
    }
    
    .status-sent {
      background: ${primaryColor}20;
      color: ${primaryColor};
    }
    
    .status-paid {
      background: ${accentColor}20;
      color: ${accentColor};
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
      background: ${primaryColor}10;
    }
    
    .line-items-table th {
      padding: 12px;
      text-align: left;
      font-size: ${fontSize - 2}px;
      font-weight: 600;
      font-family: ${headingFont};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: ${primaryColor};
      border-bottom: 2px solid ${primaryColor};
    }
    
    .line-items-table th:nth-child(2),
    .line-items-table th:nth-child(3),
    .line-items-table th:nth-child(4) {
      text-align: right;
    }
    
    .line-items-table td {
      font-size: ${fontSize}px;
      color: ${secondaryColor};
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
      font-size: ${fontSize}px;
    }
    
    .total-label {
      color: ${secondaryColor}cc;
    }
    
    .total-value {
      color: ${secondaryColor};
      font-weight: 600;
    }
    
    .grand-total {
      border-top: 2px solid ${primaryColor};
      padding-top: 16px !important;
      margin-top: 8px;
    }
    
    .grand-total .total-label {
      font-size: ${fontSize + 2}px;
      font-weight: 600;
      font-family: ${headingFont};
      color: ${primaryColor};
    }
    
    .grand-total .total-value {
      font-size: ${fontSize + 6}px;
      font-weight: 700;
      font-family: ${headingFont};
      color: ${primaryColor};
    }
    
    .notes-section {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid ${primaryColor}20;
    }
    
    .notes-title {
      font-size: ${fontSize}px;
      font-weight: 600;
      font-family: ${headingFont};
      color: ${primaryColor};
      margin-bottom: 8px;
    }
    
    .notes-content {
      font-size: ${fontSize}px;
      color: ${secondaryColor}cc;
      line-height: 1.8;
    }
    
    .footer {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 1px solid ${primaryColor}20;
      text-align: ${footerLayout === 'detailed' ? 'center' : footerLayout === 'minimal' ? 'center' : 'center'};
      font-size: ${footerLayout === 'minimal' ? fontSize - 2 : fontSize}px;
      color: ${secondaryColor}99;
    }
    
    .footer-detailed {
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .footer-contact {
      font-size: ${fontSize - 2}px;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="company-logo">` : ''}
        <div class="company-name">${user.companyName || user.name || 'Your Company'}</div>
        ${showCompanyAddress ? `
        <div class="company-details">
          ${user.companyAddress ? `${user.companyAddress}<br>` : ''}
          ${user.email ? `${user.email}<br>` : ''}
          ${user.companyPhone ? `${user.companyPhone}<br>` : ''}
          ${user.taxId ? `<span style="font-weight: 600;">VAT:</span> ${user.taxId}` : ''}
        </div>
        ` : ''}
      </div>
      ${headerLayout !== 'centered' ? `
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-number">${invoice.invoiceNumber}</div>
      </div>
      ` : ''}
    </div>
    
    ${headerLayout === 'centered' ? `
    <div style="text-align: center; margin-bottom: 48px;">
      <h1 style="font-size: 36px; font-weight: 700; font-family: ${headingFont}; color: ${primaryColor}; margin-bottom: 8px;">INVOICE</h1>
      <div style="font-size: ${fontSize}px; color: ${secondaryColor}cc;">${invoice.invoiceNumber}</div>
    </div>
    ` : ''}
    
    <div class="invoice-details">
      <div class="bill-to">
        <div class="section-title">Bill To</div>
        <div class="client-name">${client.name}</div>
        <div class="client-details">
          ${client.companyName ? `${client.companyName}<br>` : ''}
          ${client.address ? `${client.address}<br>` : ''}
          ${client.email ? `${client.email}<br>` : ''}
          ${client.phone ? `${client.phone}<br>` : ''}
          ${client.vatNumber ? `<span style="font-weight: 600;">VAT:</span> ${client.vatNumber}` : ''}
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
          <span class="info-value">${formatDate(invoice.issueDate, dateFormat)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Due Date:</span>
          <span class="info-value">${formatDate(invoice.dueDate, dateFormat)}</span>
        </div>
        ${invoice.paidAt ? `
        <div class="info-row">
          <span class="info-label">Paid On:</span>
          <span class="info-value">${formatDate(invoice.paidAt, dateFormat)}</span>
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
      ${showDiscountField && Number(invoice.discountAmount) > 0 ? `
      <div class="total-row">
        <span class="total-label" style="color: ${accentColor};">Discount ${invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
        <span class="total-value" style="color: ${accentColor};">-${formatCurrency(invoice.discountAmount)}</span>
      </div>
      ` : ''}
      ${showTaxField && Number(invoice.taxAmount) > 0 && !client.taxExempt ? `
      <div class="total-row">
        <span class="total-label">Tax (${invoice.taxRate}%)</span>
        <span class="total-value">${formatCurrency(invoice.taxAmount)}</span>
      </div>
      ` : ''}
      ${client.taxExempt && client.vatNumber ? `
      <div class="total-row">
        <span class="total-label" style="font-size: ${fontSize - 2}px; color: ${primaryColor};">Reverse Charge - VAT 0%</span>
        <span class="total-value">${formatCurrency(0)}</span>
      </div>
      ` : ''}
      <div class="total-row grand-total">
        <span class="total-label">Total</span>
        <span class="total-value">${formatCurrency(invoice.total)}</span>
      </div>
    </div>
    
    ${(showNotesField && invoice.notes) || (showPaymentTerms && invoice.paymentTerms) ? `
    <div class="notes-section">
      ${showNotesField && invoice.notes ? `
      <div style="margin-bottom: 24px;">
        <div class="notes-title">Notes</div>
        <div class="notes-content">${invoice.notes}</div>
      </div>
      ` : ''}
      ${showPaymentTerms && invoice.paymentTerms ? `
      <div>
        <div class="notes-title">Payment Terms</div>
        <div class="notes-content">${invoice.paymentTerms}</div>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    ${client.taxExempt && client.vatNumber ? `
    <div style="margin-top: 32px; padding: 16px; background: ${primaryColor}10; border-left: 4px solid ${primaryColor}; font-size: ${fontSize - 1}px;">
      <strong style="color: ${primaryColor};">Reverse Charge Notice:</strong><br>
      VAT reverse charge applies. The customer is liable for VAT in their country of establishment under Article 196 of Council Directive 2006/112/EC.
    </div>
    ` : ''}
    
    ${footerText ? `
    <div class="footer">
      ${footerLayout === 'detailed' ? `
        <div class="footer-detailed">${footerText}</div>
        <div class="footer-contact">For questions, contact us at ${user.email || 'support@example.com'}</div>
      ` : `
        ${footerText}
      `}
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF from invoice data with optional template
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
