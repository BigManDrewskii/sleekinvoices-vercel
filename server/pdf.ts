import puppeteer, { Browser } from "puppeteer";

// Track active browser instances for cleanup
let activeBrowser: Browser | null = null;

// Default timeout for PDF generation (30 seconds)
const PDF_GENERATION_TIMEOUT_MS = 30000;
import { Invoice, Client, InvoiceLineItem, User } from "../drizzle/schema";
import type { InvoiceTemplate } from "../drizzle/schema";
import {
  createPDFColorPalette,
  getOptimalTextColor,
  withAlpha,
} from "./color-contrast";
import { INVOICE_TEMPLATE_DEFAULTS } from "../shared/template-presets";

interface InvoicePDFData {
  invoice: Invoice;
  client: Client;
  lineItems: InvoiceLineItem[];
  user: User;
  template?: InvoiceTemplate | null;
  style?: "classic" | "receipt";
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatLongDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
      return "#10b981";
    case "overdue":
      return "#ef4444";
    case "pending":
    case "sent":
      return "#f59e0b";
    case "draft":
      return "#71717a";
    default:
      return "#71717a";
  }
}

function getStatusBgColor(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
      return "#ecfdf5";
    case "overdue":
      return "#fef2f2";
    case "pending":
    case "sent":
      return "#fffbeb";
    case "draft":
      return "#f4f4f5";
    default:
      return "#f4f4f5";
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
  const companyName = user.companyName || user.name || "Your Company";
  const companyAddress = user.companyAddress || "";
  const companyEmail = user.email || "";
  const companyPhone = user.companyPhone || "";
  const taxId = user.taxId || "";

  // Get contrast-safe colors from template or defaults
  const primaryColor =
    template?.primaryColor || INVOICE_TEMPLATE_DEFAULTS.primaryColor;
  const accentColor =
    template?.accentColor || INVOICE_TEMPLATE_DEFAULTS.accentColor;
  const colors = createPDFColorPalette(primaryColor, accentColor);

  const lineItemsHTML = lineItems
    .map(
      item => `
    <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-size: 14px; color: ${colors.primary}; gap: 4px 0; margin-bottom: 16px;">
      <div style="grid-column: span 6; padding-right: 16px;">${item.description}</div>
      <div style="grid-column: span 2; text-align: right; font-variant-numeric: tabular-nums; color: ${colors.muted};">${item.quantity}</div>
      <div style="grid-column: span 4; text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(item.amount)}</div>
      <div style="grid-column: span 12; font-size: 10px; color: ${colors.muted}; font-variant-numeric: tabular-nums;">
        ${item.quantity} × ${formatCurrency(item.rate)}
      </div>
    </div>
  `
    )
    .join("");

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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'IBM Plex Mono', monospace;
      color: ${colors.primary};
      font-size: 14px;
      line-height: 1.6;
      background: white;
      -webkit-font-smoothing: antialiased;
    }
    @page {
      size: A4;
      margin: 0;
    }
    .receipt-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 32px 40px;
      background: white;
    }
    .divider {
      margin: 24px 0;
      border-top: 1px dashed ${colors.divider};
      width: 100%;
    }
    .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: ${colors.muted};
      font-weight: 500;
      line-height: 1;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
      ${
        logoUrl
          ? `
        <img src="${logoUrl}" alt="Logo" style="height: 32px; width: auto; object-fit: contain;">
      `
          : `
        <div style="width: 32px; height: 32px; background: ${colors.primary}; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${colors.primaryText}" stroke-width="2.5">
            <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
      `
      }
      <span style="font-size: 14px; font-weight: 500; letter-spacing: -0.01em; color: ${colors.primary};">
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
        ${companyAddress ? `<div style="white-space: pre-line;">${companyAddress}</div>` : ""}
        ${companyEmail ? `<div style="color: #71717a;">${companyEmail}</div>` : ""}
        ${companyPhone ? `<div style="color: #71717a;">${companyPhone}</div>` : ""}
        ${taxId ? `<div style="font-size: 12px; color: #a1a1aa; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Tax ID: ${taxId}</div>` : ""}
      </div>
    </div>

    <div class="divider"></div>

    <!-- To -->
    <div style="margin-bottom: 24px;">
      <div class="label">To</div>
      <div style="font-size: 14px; line-height: 1.7; color: #27272a;">
        <div style="font-weight: 500;">${client.name}</div>
        ${client.companyName ? `<div>${client.companyName}</div>` : ""}
        ${client.address ? `<div style="white-space: pre-line;">${client.address}</div>` : ""}
        ${client.email ? `<div style="color: #71717a;">${client.email}</div>` : ""}
        ${client.vatNumber ? `<div style="font-size: 12px; color: #a1a1aa; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">VAT: ${client.vatNumber}</div>` : ""}
      </div>
    </div>

    <div class="divider"></div>

    <!-- Items -->
    <div style="margin-bottom: 24px;">
      <div class="label">Items</div>
      <div style="margin-top: 16px;">
        <div style="display: grid; grid-template-columns: repeat(12, 1fr); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${colors.muted}; font-weight: 500; margin-bottom: 8px; padding-bottom: 8px;">
          <div style="grid-column: span 6;">Description</div>
          <div style="grid-column: span 2; text-align: right;">Qty</div>
          <div style="grid-column: span 4; text-align: right;">Price</div>
        </div>
        ${lineItemsHTML}
      </div>
    </div>

    <div class="divider"></div>

    <!-- Totals -->
    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px; font-size: 14px; color: ${colors.primary}; margin-bottom: 24px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: ${colors.muted};">Subtotal</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.subtotal)}</div>
      </div>
      ${
        Number(invoice.discountAmount) > 0
          ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: ${colors.accent};">Discount</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums; color: ${colors.accent};">-${formatCurrency(invoice.discountAmount)}</div>
      </div>
      `
          : ""
      }
      ${
        Number(invoice.taxAmount) > 0 && !client.taxExempt
          ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: ${colors.muted};">Tax (${invoice.taxRate}%)</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.taxAmount)}</div>
      </div>
      `
          : ""
      }
      ${
        client.taxExempt && client.vatNumber
          ? `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px;">
        <div style="color: ${colors.muted}; font-size: 12px;">Reverse Charge - VAT 0%</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(0)}</div>
      </div>
      `
          : ""
      }
      <div style="width: 100%; max-width: 240px; border-top: 1px solid ${colors.divider}; margin: 4px 0;"></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; width: 100%; max-width: 240px; font-size: 18px; font-weight: 500;">
        <div style="color: ${colors.primary};">Total</div>
        <div style="text-align: right; font-variant-numeric: tabular-nums; color: ${colors.accent};">${formatCurrency(invoice.total)}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Payment & Notes -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
      ${
        invoice.paymentTerms
          ? `
      <div>
        <div class="label">Payment Terms</div>
        <div style="font-size: 12px; color: ${colors.muted}; white-space: pre-wrap; line-height: 1.7;">
          ${invoice.paymentTerms}
        </div>
      </div>
      `
          : ""
      }
      ${
        invoice.notes
          ? `
      <div>
        <div class="label">Notes</div>
        <div style="font-size: 12px; color: ${colors.muted}; line-height: 1.7; font-style: italic;">
          ${invoice.notes}
        </div>
      </div>
      `
          : ""
      }
    </div>

    ${
      client.taxExempt && client.vatNumber
        ? `
    <div style="margin-top: 32px; padding: 16px; background: ${withAlpha(colors.primary, 0.05)}; border-left: 4px solid ${colors.primary}; font-size: 12px;">
      <strong style="color: ${colors.primary};">Reverse Charge Notice:</strong><br>
      <span style="color: ${colors.muted};">VAT reverse charge applies. The customer is liable for VAT in their country of establishment under Article 196 of Council Directive 2006/112/EC.</span>
    </div>
    `
        : ""
    }

    <!-- Footer -->
    <div style="margin-top: 64px; font-size: 10px; color: ${withAlpha(colors.primary, 0.25)}; text-transform: uppercase; letter-spacing: 0.1em; text-align: center;">
      This is a digital record generated by SleekInvoices
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Modern Classic Style Invoice HTML
 * Clean, contemporary design with refined typography and subtle styling
 */
function generateClassicStyleHTML(data: InvoicePDFData): string {
  const { invoice, client, lineItems, user, template } = data;

  // Get contrast-safe colors from template or defaults
  const primaryColor =
    template?.primaryColor || INVOICE_TEMPLATE_DEFAULTS.primaryColor;
  const accentColor =
    template?.accentColor || INVOICE_TEMPLATE_DEFAULTS.classicAccentColor;
  const colors = createPDFColorPalette(primaryColor, accentColor);

  const logoUrl = template?.logoUrl || user.logoUrl;

  const companyName = user.companyName || user.name || "Your Company";
  const companyAddress = user.companyAddress || "";
  const companyEmail = user.email || "";
  const companyPhone = user.companyPhone || "";
  const taxId = user.taxId || "";

  const lineItemsHTML = lineItems
    .map(
      item => `
    <div style="display: grid; grid-template-columns: 6fr 2fr 2fr 2fr; gap: 16px; padding: 16px 20px; border-bottom: 1px solid ${colors.divider};">
      <div style="font-size: 14px; color: ${colors.primary};">${item.description}</div>
      <div style="font-size: 14px; color: ${colors.muted}; text-align: right; font-variant-numeric: tabular-nums;">${item.quantity}</div>
      <div style="font-size: 14px; color: ${colors.muted}; text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(item.rate)}</div>
      <div style="font-size: 14px; color: ${colors.primary}; text-align: right; font-weight: 500; font-variant-numeric: tabular-nums;">${formatCurrency(item.amount)}</div>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: ${colors.primary};
      font-size: 14px;
      line-height: 1.6;
      background: white;
      -webkit-font-smoothing: antialiased;
    }
    @page {
      size: A4;
      margin: 0;
    }
    .invoice-container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header Section -->
    <div style="padding: 40px 40px 32px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <!-- Company Info -->
        <div style="flex: 1;">
          ${
            logoUrl
              ? `
            <img src="${logoUrl}" alt="Logo" style="height: 40px; width: auto; object-fit: contain; margin-bottom: 16px;">
          `
              : `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <div style="width: 40px; height: 40px; background: ${colors.accent}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.accentText}" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span style="font-size: 20px; font-weight: 600; color: ${colors.primary}; letter-spacing: -0.02em;">${companyName}</span>
            </div>
          `
          }
          ${logoUrl ? `<p style="font-size: 16px; font-weight: 600; color: ${colors.primary}; margin-bottom: 4px;">${companyName}</p>` : ""}
          ${companyAddress ? `<p style="font-size: 13px; color: ${colors.muted}; white-space: pre-line; line-height: 1.6;">${companyAddress}</p>` : ""}
          ${companyEmail ? `<p style="font-size: 13px; color: ${colors.muted}; margin-top: 4px;">${companyEmail}</p>` : ""}
          ${companyPhone ? `<p style="font-size: 13px; color: ${colors.muted};">${companyPhone}</p>` : ""}
          ${taxId ? `<p style="font-size: 11px; color: ${colors.muted}; margin-top: 8px; font-weight: 500; letter-spacing: 0.05em; opacity: 0.7;">TAX ID: ${taxId}</p>` : ""}
        </div>

        <!-- Invoice Title & Number -->
        <div style="text-align: right;">
          <h1 style="font-size: 28px; font-weight: 700; color: ${colors.primary}; letter-spacing: -0.02em; margin-bottom: 4px;">Invoice</h1>
          <p style="font-size: 16px; font-weight: 500; color: ${colors.muted}; font-variant-numeric: tabular-nums;">${invoice.invoiceNumber}</p>
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; margin-top: 12px; background: ${getStatusBgColor(invoice.status)}; color: ${getStatusColor(invoice.status)};">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
            <span style="font-size: 12px; font-weight: 500;">${getStatusLabel(invoice.status)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div style="margin: 0 40px; height: 1px; background: linear-gradient(to right, ${colors.divider}, ${withAlpha(colors.primary, 0.2)}, ${colors.divider});"></div>

    <!-- Bill To & Dates Section -->
    <div style="padding: 32px 40px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        <!-- Bill To -->
        <div>
          <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: ${colors.muted}; margin-bottom: 8px;">Bill To</p>
          <p style="font-size: 16px; font-weight: 600; color: ${colors.primary};">${client.name}</p>
          ${client.companyName ? `<p style="font-size: 13px; color: ${colors.muted}; margin-top: 2px;">${client.companyName}</p>` : ""}
          ${client.address ? `<p style="font-size: 13px; color: ${colors.muted}; white-space: pre-line; line-height: 1.6; margin-top: 4px;">${client.address}</p>` : ""}
          ${client.email ? `<p style="font-size: 13px; color: ${colors.muted}; margin-top: 4px;">${client.email}</p>` : ""}
          ${client.vatNumber ? `<p style="font-size: 11px; color: ${colors.muted}; margin-top: 8px; font-weight: 500; letter-spacing: 0.05em; opacity: 0.7;">VAT: ${client.vatNumber}</p>` : ""}
        </div>

        <!-- Dates -->
        <div style="text-align: right;">
          <div style="display: inline-grid; grid-template-columns: auto auto; gap: 8px 24px; text-align: left;">
            <span style="font-size: 13px; color: ${colors.muted}; font-weight: 500;">Issue Date</span>
            <span style="font-size: 13px; color: ${colors.primary}; font-weight: 500; font-variant-numeric: tabular-nums;">${formatDate(invoice.issueDate)}</span>
            <span style="font-size: 13px; color: ${colors.muted}; font-weight: 500;">Due Date</span>
            <span style="font-size: 13px; color: ${colors.primary}; font-weight: 500; font-variant-numeric: tabular-nums;">${formatDate(invoice.dueDate)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Line Items Table -->
    <div style="padding: 0 40px 24px;">
      <div style="border: 1px solid ${colors.divider}; border-radius: 12px; overflow: hidden;">
        <!-- Table Header -->
        <div style="background: ${withAlpha(colors.primary, 0.03)}; border-bottom: 1px solid ${colors.divider};">
          <div style="display: grid; grid-template-columns: 6fr 2fr 2fr 2fr; gap: 16px; padding: 12px 20px;">
            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: ${colors.muted};">Description</div>
            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: ${colors.muted}; text-align: right;">Qty</div>
            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: ${colors.muted}; text-align: right;">Rate</div>
            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: ${colors.muted}; text-align: right;">Amount</div>
          </div>
        </div>
        <!-- Table Body -->
        ${lineItemsHTML}
      </div>
    </div>

    <!-- Totals Section -->
    <div style="padding: 0 40px 32px;">
      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 280px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
            <span style="color: ${colors.muted};">Subtotal</span>
            <span style="color: ${colors.primary}; font-weight: 500; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${
            Number(invoice.discountAmount) > 0
              ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
            <span style="color: ${colors.accent};">Discount</span>
            <span style="color: ${colors.accent}; font-weight: 500; font-variant-numeric: tabular-nums;">-${formatCurrency(invoice.discountAmount)}</span>
          </div>
          `
              : ""
          }
          ${
            Number(invoice.taxAmount) > 0 && !client.taxExempt
              ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
            <span style="color: ${colors.muted};">Tax (${invoice.taxRate}%)</span>
            <span style="color: ${colors.primary}; font-weight: 500; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.taxAmount)}</span>
          </div>
          `
              : ""
          }
          ${
            client.taxExempt && client.vatNumber
              ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px;">
            <span style="color: ${colors.muted};">Reverse Charge - VAT 0%</span>
            <span style="color: ${colors.primary}; font-weight: 500; font-variant-numeric: tabular-nums;">${formatCurrency(0)}</span>
          </div>
          `
              : ""
          }
          <div style="border-top: 1px solid ${colors.divider}; margin-top: 8px; padding-top: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 16px; font-weight: 600; color: ${colors.primary};">Total</span>
              <span style="font-size: 24px; font-weight: 700; color: ${colors.accent}; font-variant-numeric: tabular-nums;">${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notes & Payment Terms -->
    ${
      invoice.notes || invoice.paymentTerms
        ? `
    <div style="margin: 0 40px; border-top: 1px solid ${colors.divider};"></div>
    <div style="padding: 32px 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
      ${
        invoice.notes
          ? `
      <div>
        <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: ${colors.muted}; margin-bottom: 8px;">Notes</p>
        <p style="font-size: 13px; color: ${colors.muted}; line-height: 1.7; white-space: pre-line;">${invoice.notes}</p>
      </div>
      `
          : ""
      }
      ${
        invoice.paymentTerms
          ? `
      <div>
        <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: ${colors.muted}; margin-bottom: 8px;">Payment Terms</p>
        <p style="font-size: 13px; color: ${colors.muted}; line-height: 1.7;">${invoice.paymentTerms}</p>
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    ${
      client.taxExempt && client.vatNumber
        ? `
    <div style="margin: 0 40px 24px; padding: 16px; background: ${withAlpha(colors.primary, 0.03)}; border-left: 4px solid ${colors.primary}; border-radius: 0 8px 8px 0;">
      <p style="font-size: 12px; color: ${colors.primary}; font-weight: 600; margin-bottom: 4px;">Reverse Charge Notice</p>
      <p style="font-size: 12px; color: ${colors.muted}; line-height: 1.6;">VAT reverse charge applies. The customer is liable for VAT in their country of establishment under Article 196 of Council Directive 2006/112/EC.</p>
    </div>
    `
        : ""
    }

    <!-- Footer -->
    <div style="padding: 24px 40px; background: ${withAlpha(colors.primary, 0.03)}; border-top: 1px solid ${colors.divider};">
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: ${colors.muted}; opacity: 0.7;">
        <span>Thank you for your business</span>
        <span style="font-variant-numeric: tabular-nums;">Generated by SleekInvoices</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Invoice HTML based on style
 */
function generateInvoiceHTML(data: InvoicePDFData): string {
  const style = data.style || "receipt"; // Default to receipt style

  if (style === "receipt") {
    return generateReceiptStyleHTML(data);
  }

  return generateClassicStyleHTML(data);
}

/**
 * Clean up any hanging browser instances
 */
async function cleanupBrowserInstances(): Promise<void> {
  if (activeBrowser) {
    try {
      await activeBrowser.close();
    } catch (e) {
      // Browser may already be closed
    }
    activeBrowser = null;
  }
}

/**
 * Generate PDF from invoice data with optional template
 * Includes timeout protection to prevent hanging
 */
export async function generateInvoicePDF(
  data: InvoicePDFData,
  timeoutMs: number = PDF_GENERATION_TIMEOUT_MS
): Promise<Buffer> {
  const html = generateInvoiceHTML(data);

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`PDF generation timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  // Create PDF generation promise
  const pdfPromise = async (): Promise<Buffer> => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Track browser for cleanup
    activeBrowser = browser;

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
      activeBrowser = null;
    }
  };

  try {
    // Race between PDF generation and timeout
    return await Promise.race([pdfPromise(), timeoutPromise]);
  } catch (error) {
    // Clean up any hanging browser instances on error
    await cleanupBrowserInstances();
    throw error;
  }
}

/**
 * Generate Invoice HTML for email embedding
 */
export function generateInvoiceHTMLForEmail(data: InvoicePDFData): string {
  return generateInvoiceHTML(data);
}
