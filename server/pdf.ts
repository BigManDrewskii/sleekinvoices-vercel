import puppeteer from 'puppeteer';
import { Invoice, Client, InvoiceLineItem, User } from '../drizzle/schema';
import type { InvoiceTemplate } from '../drizzle/schema';

interface InvoicePDFData {
  invoice: Invoice;
  client: Client;
  lineItems: InvoiceLineItem[];
  user: User;
  template?: InvoiceTemplate | null;
  style?: 'classic' | 'receipt';
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

function formatLongDate(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid': return '#10b981';
    case 'overdue': return '#ef4444';
    case 'pending': 
    case 'sent': return '#f59e0b';
    case 'draft': return '#71717a';
    default: return '#71717a';
  }
}

function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Generate Receipt Style Invoice HTML
 * Minimalist, thermal receipt-inspired design with monospace typography
 */
function generateReceiptStyleHTML(data: InvoicePDFData): string {
  const { invoice, client, lineItems, user, template } = data;
  
  const logoUrl = template?.logoUrl || user.logoUrl;
  const companyName = user.companyName || user.name || 'Your Company';
  const companyAddress = user.companyAddress || '';
  const companyEmail = user.email || '';
  const companyPhone = user.companyPhone || '';
  const taxId = user.taxId || '';
  
  const lineItemsHTML = lineItems.map(item => `
    <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-size: 14px; color: #27272a; gap: 4px 0; margin-bottom: 16px;">
      <div style="grid-column: span 6; padding-right: 16px;">${item.description}</div>
      <div style="grid-column: span 2; text-align: right; font-variant-numeric: tabular-nums; color: #71717a;">${item.quantity}</div>
      <div style="grid-column: span 4; text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(item.amount)}</div>
      <div style="grid-column: span 12; font-size: 10px; color: #a1a1aa; font-variant-numeric: tabular-nums;">
        ${item.quantity} × ${formatCurrency(item.rate)}
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'IBM Plex Mono', monospace;
      color: #18181b;
      font-size: 14px;
      line-height: 1.6;
      background: white;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 64px;
      background: white;
    }
    
    .divider {
      margin: 24px 0;
      border-top: 1px dashed #e4e4e7;
      width: 100%;
    }
    
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #a1a1aa;
      font-weight: 500;
      line-height: 1;
      margin-bottom: 4px;
    }
    
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
      ${logoUrl ? `
        <img src="${logoUrl}" alt="Logo" style="height: 32px; width: auto; object-fit: contain;">
      ` : `
        <div style="width: 32px; height: 32px; background: #18181b; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      `}
      <span style="font-size: 14px; font-weight: 500; letter-spacing: -0.01em; color: #18181b;">
        ${companyName}
      </span>
    </div>

    <div class="divider"></div>

    <!-- Meta Info -->
    <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 8px;">
      <div>
        <div class="label">Invoice #</div>
        <div style="font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums;">${invoice.invoiceNumber}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div class="label">Issued</div>
          <div style="font-size: 14px; font-variant-numeric: tabular-nums;">${formatLongDate(invoice.issueDate)}</div>
        </div>
        <div>
          <div class="label">Due</div>
          <div style="font-size: 14px; font-variant-numeric: tabular-nums;">${formatLongDate(invoice.dueDate)}</div>
        </div>
      </div>
      <div>
        <div class="label">Status</div>
        <div style="font-size: 14px; display: flex; align-items: center; gap: 6px; color: ${getStatusColor(invoice.status)};">
          <span style="font-size: 8px; line-height: 1;">●</span>
          <span style="font-weight: 500;">${getStatusLabel(invoice.status)}</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- From -->
    <div style="margin-bottom: 24px;">
      <div class="label">From</div>
      <div style="font-size: 14px; line-height: 1.7; color: #27272a;">
        <div style="font-weight: 500;">${companyName}</div>
        ${companyAddress ? `<div style="white-space: pre-line;">${companyAddress}</div>` : ''}
        ${companyEmail ? `<div style="color: #71717a;">${companyEmail}</div>` : ''}
        ${companyPhone ? `<div style="color: #71717a;">${companyPhone}</div>` : ''}
        ${taxId ? `<div style="font-size: 12px; color: #a1a1aa; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-variant-numeric: tabular-nums;">Tax ID: ${taxId}</div>` : ''}
      </div>
    </div>

    <div class="divider"></div>

    <!-- To -->
    <div style="margin-bottom: 24px;">
      <div class="label">To</div>
      <div style="font-size: 14px; line-height: 1.7; color: #27272a;">
        <div style="font-weight: 500;">${client.name}</div>
        ${client.companyName ? `<div>${client.companyName}</div>` : ''}
        ${client.address ? `<div style="white-space: pre-line;">${client.address}</div>` : ''}
        ${client.email ? `<div style="color: #71717a;">${client.email}</div>` : ''}
        ${client.vatNumber ? `<div style="font-size: 12px; color: #a1a1aa; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-variant-numeric: tabular-nums;">VAT: ${client.vatNumber}</div>` : ''}
      </div>
    </div>

    <div class="divider"></div>

    <!-- Items -->
    <div style="margin-bottom: 24px;">
      <div class="label">Items</div>
      <div style="margin-top: 16px;">
        <!-- Header -->
        <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; font-weight: 500; margin-bottom: 8px; padding-bottom: 8px;">
          <div style="grid-column: span 6;">Description</div>
          <div style="grid-column: span 2; text-align: right;">Qty</div>
          <div style="grid-column: span 4; text-align: right;">Price</div>
        </div>
        <!-- Line Items -->
        ${lineItemsHTML}
      </div>
    </div>

    <div class="divider"></div>

    <!-- Totals -->
    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px; font-size: 14px; color: #27272a; margin-bottom: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: #a1a1aa;">Subtotal</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.subtotal)}</div>
      </div>
      ${Number(invoice.discountAmount) > 0 ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: #10b981;">Discount</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums; color: #10b981;">-${formatCurrency(invoice.discountAmount)}</div>
      </div>
      ` : ''}
      ${Number(invoice.taxAmount) > 0 && !client.taxExempt ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: #a1a1aa;">Tax (${invoice.taxRate}%)</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.taxAmount)}</div>
      </div>
      ` : ''}
      ${client.taxExempt && client.vatNumber ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: #a1a1aa; font-size: 12px;">Reverse Charge - VAT 0%</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(0)}</div>
      </div>
      ` : ''}
      <div style="width: 100%; max-width: 240px; border-top: 1px solid #f4f4f5; margin: 4px 0;"></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px; font-size: 18px; font-weight: 500;">
        <div style="color: #18181b;">Total</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.total)}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Payment & Notes -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
      ${invoice.paymentTerms ? `
      <div>
        <div class="label">Payment Terms</div>
        <div style="font-size: 12px; color: #71717a; white-space: pre-wrap; line-height: 1.7; font-variant-numeric: tabular-nums;">
          ${invoice.paymentTerms}
        </div>
      </div>
      ` : ''}
      ${invoice.notes ? `
      <div>
        <div class="label">Notes</div>
        <div style="font-size: 12px; color: #71717a; line-height: 1.7; font-style: italic;">
          ${invoice.notes}
        </div>
      </div>
      ` : ''}
    </div>

    ${client.taxExempt && client.vatNumber ? `
    <div style="margin-top: 32px; padding: 16px; background: #fafafa; border-left: 4px solid #18181b; font-size: 12px;">
      <strong style="color: #18181b;">Reverse Charge Notice:</strong><br>
      <span style="color: #71717a;">VAT reverse charge applies. The customer is liable for VAT in their country of establishment under Article 196 of Council Directive 2006/112/EC.</span>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="margin-top: 64px; font-size: 10px; color: #d4d4d8; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">
      This is a digital record generated by SleekInvoices
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Classic Style Invoice HTML (original design)
 */
function generateClassicStyleHTML(data: InvoicePDFData): string {
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
 * Generate Invoice HTML based on style
 */
function generateInvoiceHTML(data: InvoicePDFData): string {
  const style = data.style || 'receipt'; // Default to receipt style
  
  if (style === 'receipt') {
    return generateReceiptStyleHTML(data);
  }
  
  return generateClassicStyleHTML(data);
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

/**
 * Generate Invoice HTML for email embedding
 */
export function generateInvoiceHTMLForEmail(data: InvoicePDFData): string {
  return generateInvoiceHTML(data);
}
