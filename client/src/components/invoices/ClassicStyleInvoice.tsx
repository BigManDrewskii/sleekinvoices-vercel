import { Currency, DateDisplay } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  getOptimalTextColor,
  adjustColorForContrast,
  isLightColor,
  withAlpha,
  lighten,
  darken,
} from "@/lib/color-contrast";
import { useMemo, useEffect } from "react";
import { loadGoogleFont } from "@/lib/google-fonts";
import { INVOICE_TEMPLATE_DEFAULTS } from "@shared/template-presets";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

interface ClassicStyleInvoiceProps {
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
  logoPosition?: "left" | "center" | "right";
  logoWidth?: number;
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
 * Modern Classic Style Invoice Component
 *
 * A refined, contemporary invoice design with clean typography,
 * subtle gradients, and professional layout. Features automatic
 * contrast ratio optimization for accessibility.
 */
export function ClassicStyleInvoice({
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
  status = "draft",
  logoUrl,
  logoPosition = INVOICE_TEMPLATE_DEFAULTS.logoPosition,
  logoWidth = INVOICE_TEMPLATE_DEFAULTS.logoWidth,
  primaryColor = INVOICE_TEMPLATE_DEFAULTS.primaryColor,
  accentColor = INVOICE_TEMPLATE_DEFAULTS.classicAccentColor,
  headingFont = "Inter",
  bodyFont = "Inter",
  fontSize = INVOICE_TEMPLATE_DEFAULTS.fontSize,
  dateFormat = "MMM DD, YYYY",
  showCompanyAddress = true,
  showPaymentTerms = true,
  showTaxField = true,
  showDiscountField = true,
  showNotesField = true,
  footerText,
}: ClassicStyleInvoiceProps) {
  // Load custom fonts dynamically
  useEffect(() => {
    if (headingFont && headingFont !== "Inter") {
      loadGoogleFont(headingFont, ["400", "500", "600", "700"]);
    }
    if (bodyFont && bodyFont !== "Inter") {
      loadGoogleFont(bodyFont, ["400", "500", "600", "700"]);
    }
  }, [headingFont, bodyFont]);

  // Calculate contrast-safe colors
  const colors = useMemo(() => {
    const backgroundColor = "#ffffff";

    // Ensure colors have good contrast against white background
    const safePrimary = adjustColorForContrast(
      primaryColor,
      backgroundColor,
      4.5
    );
    const safeAccent = adjustColorForContrast(
      accentColor,
      backgroundColor,
      4.5
    );

    // Text color for accent background (e.g., logo placeholder)
    const accentText = getOptimalTextColor(safeAccent);

    // Muted colors
    const mutedText = isLightColor(safePrimary)
      ? darken(safePrimary, 40)
      : lighten(safePrimary, 30);

    // Subtle background tint from accent
    const accentTint = withAlpha(safeAccent, 0.05);
    const accentBorder = withAlpha(safeAccent, 0.2);

    // Table header background - subtle version of primary
    const tableHeaderBg = isLightColor(safePrimary)
      ? withAlpha(safePrimary, 0.05)
      : "#f9fafb";

    return {
      primary: safePrimary,
      accent: safeAccent,
      accentText,
      muted: mutedText,
      accentTint,
      accentBorder,
      tableHeaderBg,
      background: backgroundColor,
    };
  }, [primaryColor, accentColor]);

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return {
          bg: withAlpha(colors.accent, 0.1),
          text: colors.accent,
          dot: colors.accent,
        };
      case "overdue":
        return {
          bg: "#fef2f2",
          text: INVOICE_TEMPLATE_DEFAULTS.statusColors.overdue,
          dot: INVOICE_TEMPLATE_DEFAULTS.statusColors.overdue,
        };
      case "sent":
      case "pending":
        return {
          bg: "#fffbeb",
          text: INVOICE_TEMPLATE_DEFAULTS.statusColors.pending,
          dot: INVOICE_TEMPLATE_DEFAULTS.statusColors.pending,
        };
      default:
        return {
          bg: withAlpha(colors.primary, 0.1),
          text: colors.muted,
          dot: colors.muted,
        };
    }
  };

  const statusStyles = getStatusStyles(status);

  return (
    <div
      className="bg-white antialiased"
      style={{
        color: colors.primary,
        fontFamily: `"${bodyFont}", system-ui, sans-serif`,
        fontSize: `${fontSize}px`,
      }}
    >
      {/* Header Section */}
      <div className="px-10 pt-10 pb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          {/* Company Info */}
          <div
            className={cn(
              "flex-1",
              logoPosition === "center" && "flex flex-col items-center",
              logoPosition === "right" && "flex flex-col items-end"
            )}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Logo"
                className="object-contain mb-4"
                style={{
                  height: `${logoWidth}px`,
                  width: "auto",
                }}
              />
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.accentText,
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <span
                  className="text-xl font-semibold tracking-tight"
                  style={{ fontFamily: `"${headingFont}", sans-serif` }}
                >
                  {companyName || "Your Company"}
                </span>
              </div>
            )}
            {companyName && logoUrl && (
              <p
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: `"${headingFont}", sans-serif` }}
              >
                {companyName}
              </p>
            )}
            {showCompanyAddress && companyAddress && (
              <p
                className="text-sm whitespace-pre-line leading-relaxed"
                style={{ color: colors.muted }}
              >
                {companyAddress}
              </p>
            )}
            {companyEmail && (
              <p className="text-sm mt-1" style={{ color: colors.muted }}>
                {companyEmail}
              </p>
            )}
            {companyPhone && (
              <p className="text-sm" style={{ color: colors.muted }}>
                {companyPhone}
              </p>
            )}
            {taxId && (
              <p
                className="text-xs mt-2 font-medium tracking-wide"
                style={{ color: colors.muted, opacity: 0.7 }}
              >
                TAX ID: {taxId}
              </p>
            )}
          </div>

          {/* Invoice Title & Number */}
          <div className="text-right">
            <h1
              className="text-3xl font-bold tracking-tight mb-1"
              style={{ fontFamily: `"${headingFont}", sans-serif` }}
            >
              Invoice
            </h1>
            <p
              className="text-lg font-mono font-medium tracking-tight"
              style={{ color: colors.muted }}
            >
              {invoiceNumber}
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-3"
              style={{
                backgroundColor: statusStyles.bg,
                color: statusStyles.text,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusStyles.dot }}
              />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="mx-10 h-px"
        style={{
          background: `linear-gradient(to right, ${withAlpha(colors.primary, 0.1)}, ${withAlpha(colors.primary, 0.2)}, ${withAlpha(colors.primary, 0.1)})`,
        }}
      />

      {/* Bill To & Dates Section */}
      <div className="px-10 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Bill To */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2"
              style={{ color: colors.muted }}
            >
              Bill To
            </p>
            <p
              className="text-lg font-semibold"
              style={{ fontFamily: `"${headingFont}", sans-serif` }}
            >
              {clientName}
            </p>
            {clientAddress && (
              <p
                className="text-sm whitespace-pre-line leading-relaxed mt-1"
                style={{ color: colors.muted }}
              >
                {clientAddress}
              </p>
            )}
            {clientEmail && (
              <p className="text-sm mt-1" style={{ color: colors.muted }}>
                {clientEmail}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="sm:text-right">
            <div className="inline-grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <span style={{ color: colors.muted }} className="font-medium">
                Issue Date
              </span>
              <span className="font-medium font-mono">
                <DateDisplay date={issueDate} format={dateFormat} />
              </span>
              <span style={{ color: colors.muted }} className="font-medium">
                Due Date
              </span>
              <span className="font-medium font-mono">
                <DateDisplay date={dueDate} format={dateFormat} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="px-10 pb-6">
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: withAlpha(colors.primary, 0.15) }}
        >
          {/* Table Header */}
          <div
            className="border-b"
            style={{
              backgroundColor: colors.tableHeaderBg,
              borderColor: withAlpha(colors.primary, 0.1),
            }}
          >
            <div className="grid grid-cols-12 gap-4 px-5 py-3">
              <div
                className="col-span-6 text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: colors.muted }}
              >
                Description
              </div>
              <div
                className="col-span-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-right"
                style={{ color: colors.muted }}
              >
                Qty
              </div>
              <div
                className="col-span-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-right"
                style={{ color: colors.muted }}
              >
                Rate
              </div>
              <div
                className="col-span-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-right"
                style={{ color: colors.muted }}
              >
                Amount
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div
            className="divide-y"
            style={{ borderColor: withAlpha(colors.primary, 0.05) }}
          >
            {lineItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 px-5 py-4 transition-colors"
                style={{
                  ["--hover-bg" as string]: withAlpha(colors.primary, 0.02),
                }}
                onMouseEnter={e =>
                  (e.currentTarget.style.backgroundColor = withAlpha(
                    colors.primary,
                    0.02
                  ))
                }
                onMouseLeave={e =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <div className="col-span-6 text-sm">{item.description}</div>
                <div
                  className="col-span-2 text-sm text-right font-mono"
                  style={{ color: colors.muted }}
                >
                  {item.quantity}
                </div>
                <div
                  className="col-span-2 text-sm text-right font-mono"
                  style={{ color: colors.muted }}
                >
                  <Currency amount={item.rate} />
                </div>
                <div className="col-span-2 text-sm text-right font-mono font-medium">
                  <Currency amount={item.quantity * item.rate} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Totals Section */}
      <div className="px-10 pb-8">
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between items-center py-2 text-sm">
              <span style={{ color: colors.muted }}>Subtotal</span>
              <span className="font-mono font-medium">
                <Currency amount={subtotal} />
              </span>
            </div>

            {showDiscountField && discountAmount > 0 && (
              <div className="flex justify-between items-center py-2 text-sm">
                <span style={{ color: colors.accent }}>Discount</span>
                <span
                  className="font-mono font-medium"
                  style={{ color: colors.accent }}
                >
                  -<Currency amount={discountAmount} />
                </span>
              </div>
            )}

            {showTaxField && taxAmount > 0 && (
              <div className="flex justify-between items-center py-2 text-sm">
                <span style={{ color: colors.muted }}>
                  Tax {taxRate > 0 && `(${taxRate}%)`}
                </span>
                <span className="font-mono font-medium">
                  <Currency amount={taxAmount} />
                </span>
              </div>
            )}

            <div
              className="border-t pt-3 mt-2"
              style={{ borderColor: withAlpha(colors.primary, 0.15) }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-lg font-semibold"
                  style={{ fontFamily: `"${headingFont}", sans-serif` }}
                >
                  Total
                </span>
                <span
                  className="text-2xl font-bold font-mono"
                  style={{ color: colors.accent }}
                >
                  <Currency amount={total} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Payment Terms */}
      {(showNotesField || showPaymentTerms) && (notes || paymentTerms) && (
        <>
          <div
            className="mx-10 h-px"
            style={{ backgroundColor: withAlpha(colors.primary, 0.1) }}
          />
          <div className="px-10 py-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {showNotesField && notes && (
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2"
                  style={{ color: colors.muted }}
                >
                  Notes
                </p>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: colors.muted }}
                >
                  {notes}
                </p>
              </div>
            )}
            {showPaymentTerms && paymentTerms && (
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2"
                  style={{ color: colors.muted }}
                >
                  Payment Terms
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: colors.muted }}
                >
                  {paymentTerms}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      <div
        className="px-10 py-6 border-t"
        style={{
          backgroundColor: colors.tableHeaderBg,
          borderColor: withAlpha(colors.primary, 0.1),
        }}
      >
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs"
          style={{ color: colors.muted, opacity: 0.7 }}
        >
          <p>{footerText || "Thank you for your business"}</p>
          <p className="font-mono">Generated by SleekInvoices</p>
        </div>
      </div>
    </div>
  );
}
