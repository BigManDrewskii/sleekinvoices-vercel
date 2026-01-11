import { Currency, DateDisplay } from "@/components/ui/typography";
import {
  getOptimalTextColor,
  adjustColorForContrast,
  isLightColor,
  withAlpha,
  darken,
  lighten
} from "@/lib/color-contrast";
import { useMemo, useEffect } from "react";
import { loadGoogleFont } from "@/lib/google-fonts";
import { cn } from "@/lib/utils";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

interface ReceiptStyleInvoiceProps {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxRate?: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  taxId?: string;
  status?: string;
  logoUrl?: string;
  logoPosition?: 'left' | 'center' | 'right';
  logoWidth?: number;
  // Template customization
  primaryColor?: string;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
  fontSize?: number;
  dateFormat?: string;
  showCompanyAddress?: boolean;
  showPaymentTerms?: boolean;
  showTaxField?: boolean;
  showDiscountField?: boolean;
  showNotesField?: boolean;
  footerText?: string;
}

/**
 * Receipt Style Invoice Component
 * 
 * A clean, minimalist receipt-style invoice inspired by thermal receipts.
 * Features:
 * - Monospace typography for financial data
 * - Dashed dividers for section separation
 * - Compact, vertical layout
 * - Dynamic color theming with contrast-safe colors
 * - A4 print-optimized
 */
export function ReceiptStyleInvoice({
  invoiceNumber,
  clientName,
  clientEmail,
  clientAddress,
  issueDate,
  dueDate,
  lineItems,
  subtotal,
  discountAmount,
  taxAmount,
  taxRate = 0,
  total,
  notes,
  paymentTerms,
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  taxId,
  status = "pending",
  logoUrl,
  logoPosition = 'left',
  logoWidth = 120,
  primaryColor = "#18181b",
  accentColor = "#10b981",
  headingFont = "IBM Plex Mono",
  bodyFont = "IBM Plex Mono",
  fontSize = 14,
  dateFormat = "MMM DD, YYYY",
  showCompanyAddress = true,
  showPaymentTerms = true,
  showTaxField = true,
  showDiscountField = true,
  showNotesField = true,
  footerText,
}: ReceiptStyleInvoiceProps) {

  // Load custom fonts dynamically
  useEffect(() => {
    if (headingFont && headingFont !== 'IBM Plex Mono') {
      loadGoogleFont(headingFont, ['400', '500', '600', '700']);
    }
    if (bodyFont && bodyFont !== 'IBM Plex Mono') {
      loadGoogleFont(bodyFont, ['400', '500', '600', '700']);
    }
  }, [headingFont, bodyFont]);

  // Calculate contrast-safe colors
  const colors = useMemo(() => {
    const backgroundColor = "#ffffff";
    
    // Ensure primary color has good contrast against white background
    const safePrimary = adjustColorForContrast(primaryColor, backgroundColor, 4.5);
    const safeAccent = adjustColorForContrast(accentColor, backgroundColor, 4.5);
    
    // Text color for primary background (e.g., logo placeholder)
    const primaryText = getOptimalTextColor(safePrimary);
    
    // Muted colors derived from primary
    const mutedText = isLightColor(safePrimary) 
      ? darken(safePrimary, 30) 
      : lighten(safePrimary, 40);
    
    // Divider color - subtle version of primary
    const dividerColor = withAlpha(safePrimary, 0.15);
    
    return {
      primary: safePrimary,
      primaryText,
      accent: safeAccent,
      muted: mutedText,
      divider: dividerColor,
      background: backgroundColor,
    };
  }, [primaryColor, accentColor]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return colors.accent;
      case 'overdue': return '#dc2626';
      case 'pending': 
      case 'sent': return '#d97706';
      case 'draft': return colors.muted;
      default: return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div
      className="bg-white p-12 md:p-16 w-full max-w-[800px] mx-auto selection:bg-zinc-100"
      style={{
        color: colors.primary,
        fontFamily: `"${bodyFont}", monospace`,
        fontSize: `${fontSize}px`
      }}
    >
      {/* Header - Logo & Brand */}
      <div
        className={cn(
          "flex items-center gap-3 mb-8",
          logoPosition === 'center' && "justify-center",
          logoPosition === 'right' && "justify-end"
        )}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Company Logo"
            className="object-contain"
            style={{
              height: `${logoWidth}px`,
              width: 'auto'
            }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ backgroundColor: colors.primary, color: colors.primaryText }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        )}
        <span
          className="text-sm font-medium tracking-tight"
          style={{ color: colors.primary, fontFamily: `"${headingFont}", monospace` }}
        >
          {companyName || "SleekInvoices"}
        </span>
      </div>

      {/* Divider */}
      <div 
        className="my-6 border-t border-dashed w-full" 
        style={{ borderColor: colors.divider }}
      />

      {/* Meta Info */}
      <div className="grid grid-cols-1 gap-4 mb-2">
        <div>
          <div 
            className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
            style={{ color: colors.muted }}
          >
            Invoice #
          </div>
          <div className="text-sm font-medium tabular-nums">{invoiceNumber}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div 
              className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
              style={{ color: colors.muted }}
            >
              Issued
            </div>
            <div className="text-sm tabular-nums">
              <DateDisplay date={issueDate} format={dateFormat} />
            </div>
          </div>
          <div>
            <div
              className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
              style={{ color: colors.muted }}
            >
              Due
            </div>
            <div className="text-sm tabular-nums">
              <DateDisplay date={dueDate} format={dateFormat} />
            </div>
          </div>
        </div>
        <div>
          <div 
            className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
            style={{ color: colors.muted }}
          >
            Status
          </div>
          <div 
            className="text-sm flex items-center gap-1.5"
            style={{ color: getStatusColor(status) }}
          >
            <span className="text-[8px] leading-none">●</span>
            <span className="font-medium">{getStatusLabel(status)}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div 
        className="my-6 border-t border-dashed w-full" 
        style={{ borderColor: colors.divider }}
      />

      {/* From */}
      <div className="mb-6">
        <div
          className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
          style={{ color: colors.muted }}
        >
          From
        </div>
        <div className="text-sm leading-relaxed">
          <div
            className="font-medium"
            style={{ fontFamily: `"${headingFont}", monospace` }}
          >
            {companyName || "Your Company"}
          </div>
          {showCompanyAddress && companyAddress && (
            <div className="whitespace-pre-line" style={{ opacity: 0.8 }}>
              {companyAddress}
            </div>
          )}
          {companyEmail && (
            <div style={{ color: colors.muted }}>{companyEmail}</div>
          )}
          {companyPhone && (
            <div style={{ color: colors.muted }}>{companyPhone}</div>
          )}
          {taxId && (
            <div
              className="text-xs mt-1 uppercase tracking-wider tabular-nums"
              style={{ color: colors.muted }}
            >
              Tax ID: {taxId}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div 
        className="my-6 border-t border-dashed w-full" 
        style={{ borderColor: colors.divider }}
      />

      {/* To */}
      <div className="mb-6">
        <div 
          className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
          style={{ color: colors.muted }}
        >
          To
        </div>
        <div className="text-sm leading-relaxed">
          <div
            className="font-medium"
            style={{ fontFamily: `"${headingFont}", monospace` }}
          >
            {clientName}
          </div>
          {clientAddress && (
            <div className="whitespace-pre-line" style={{ opacity: 0.8 }}>
              {clientAddress}
            </div>
          )}
          {clientEmail && (
            <div style={{ color: colors.muted }}>{clientEmail}</div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div 
        className="my-6 border-t border-dashed w-full" 
        style={{ borderColor: colors.divider }}
      />

      {/* Items */}
      <div className="mb-6">
        <div 
          className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
          style={{ color: colors.muted }}
        >
          Items
        </div>
        <div className="mt-4 space-y-4">
          {/* Header */}
          <div 
            className="grid grid-cols-12 text-[10px] uppercase tracking-widest font-medium mb-2 pb-2"
            style={{ color: colors.muted }}
          >
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-4 text-right">Price</div>
          </div>
          {/* Line Items */}
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 text-sm gap-y-1">
              <div className="col-span-6 pr-4">{item.description}</div>
              <div 
                className="col-span-2 text-right tabular-nums"
                style={{ color: colors.muted }}
              >
                {item.quantity}
              </div>
              <div className="col-span-4 text-right tabular-nums">
                <Currency amount={item.quantity * item.rate} />
              </div>
              <div 
                className="col-span-12 text-[10px] tabular-nums"
                style={{ color: colors.muted }}
              >
                {item.quantity} × <Currency amount={item.rate} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div 
        className="my-6 border-t border-dashed w-full" 
        style={{ borderColor: colors.divider }}
      />

      {/* Totals */}
      <div className="flex flex-col items-end gap-2 text-sm mb-6">
        <div className="grid grid-cols-2 gap-8 w-full max-w-[240px]">
          <div style={{ color: colors.muted }}>Subtotal</div>
          <div className="text-right tabular-nums">
            <Currency amount={subtotal} />
          </div>
        </div>
        {showDiscountField && discountAmount > 0 && (
          <div className="grid grid-cols-2 gap-8 w-full max-w-[240px]">
            <div style={{ color: colors.accent }}>Discount</div>
            <div className="text-right tabular-nums" style={{ color: colors.accent }}>
              -<Currency amount={discountAmount} />
            </div>
          </div>
        )}
        {showTaxField && taxAmount > 0 && (
          <div className="grid grid-cols-2 gap-8 w-full max-w-[240px]">
            <div style={{ color: colors.muted }}>Tax ({taxRate}%)</div>
            <div className="text-right tabular-nums">
              <Currency amount={taxAmount} />
            </div>
          </div>
        )}
        <div
          className="w-full max-w-[240px] border-t my-1"
          style={{ borderColor: colors.divider }}
        />
        <div className="grid grid-cols-2 gap-8 w-full max-w-[240px] text-lg font-medium">
          <div style={{ fontFamily: `"${headingFont}", monospace` }}>Total</div>
          <div className="text-right tabular-nums" style={{ color: colors.accent }}>
            <Currency amount={total} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div 
        className="my-6 border-t border-dashed w-full" 
        style={{ borderColor: colors.divider }}
      />

      {/* Payment & Notes */}
      {(showPaymentTerms || showNotesField) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {showPaymentTerms && paymentTerms && (
            <div>
              <div
                className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
                style={{ color: colors.muted }}
              >
                Payment Terms
              </div>
              <div
                className="text-xs whitespace-pre-wrap leading-relaxed tabular-nums"
                style={{ color: colors.muted }}
              >
                {paymentTerms}
              </div>
            </div>
          )}
          {showNotesField && notes && (
            <div>
              <div
                className="text-[10px] uppercase tracking-widest font-medium leading-none mb-1"
                style={{ color: colors.muted }}
              >
                Notes
              </div>
              <div
                className="text-xs leading-relaxed italic"
                style={{ color: colors.muted }}
              >
                {notes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="mt-16 text-[10px] uppercase tracking-widest text-center"
        style={{ color: withAlpha(colors.primary, 0.25) }}
      >
        {footerText || "This is a digital record generated by SleekInvoices"}
      </div>
    </div>
  );
}

export default ReceiptStyleInvoice;
