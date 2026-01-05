import { useEffect } from 'react';
import { loadGoogleFont } from '@/lib/google-fonts';

export interface SleekTemplateSettings {
  // Brand Identity
  name: string;
  logoUrl?: string | null;
  logoPosition: 'left' | 'center' | 'right';
  logoWidth: number;
  
  // Colors (Simple 4-color system)
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  
  // Typography
  headingFont: string;
  headingWeight: number;
  bodyFont: string;
  bodyWeight: number;
  fontSize: number;
  
  // Layout
  headerLayout: 'standard' | 'centered' | 'split';
  tableStyle: 'minimal' | 'bordered' | 'striped';
  
  // Field Visibility
  showCompanyAddress: boolean;
  showPaymentTerms: boolean;
  showTaxField: boolean;
  showDiscountField: boolean;
  showNotesField: boolean;
  
  // Footer
  footerText: string | null;
  dateFormat: string;
}

interface SleekDefaultTemplateProps {
  settings: SleekTemplateSettings;
  invoiceData?: {
    invoiceNumber: string;
    date: Date;
    dueDate?: Date;
    companyName: string;
    companyAddress?: string;
    clientName: string;
    clientAddress?: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    subtotal: number;
    discountPercent?: number;
    discountAmount?: number;
    taxPercent?: number;
    taxAmount?: number;
    total: number;
    paymentTerms?: string;
    notes?: string;
  };
  scale?: number;
}

// Default sample data for preview
const defaultInvoiceData = {
  invoiceNumber: 'INV-001',
  date: new Date(),
  companyName: 'Your Company Name',
  companyAddress: '123 Business Street\nCity, State 12345',
  clientName: 'Client Name',
  clientAddress: '456 Client Avenue\nCity, State 67890',
  lineItems: [
    { description: 'Professional Services', quantity: 1, rate: 150, amount: 150 },
    { description: 'Consultation', quantity: 2, rate: 75, amount: 150 },
  ],
  subtotal: 300,
  discountPercent: 10,
  discountAmount: 30,
  taxPercent: 8,
  taxAmount: 21.60,
  total: 291.60,
  paymentTerms: 'Payment is due within 30 days of invoice date.',
  notes: 'Thank you for your business.',
};

export function SleekDefaultTemplate({ 
  settings, 
  invoiceData = defaultInvoiceData,
  scale = 1 
}: SleekDefaultTemplateProps) {
  // Load fonts dynamically
  useEffect(() => {
    if (settings.headingFont) {
      loadGoogleFont(settings.headingFont, ['400', '500', '600', '700']);
    }
    if (settings.bodyFont && settings.bodyFont !== settings.headingFont) {
      loadGoogleFont(settings.bodyFont, ['400', '500', '600', '700']);
    }
  }, [settings.headingFont, settings.bodyFont]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    switch (settings.dateFormat) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "MMM DD, YYYY":
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      default:
        return `${month}/${day}/${year}`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Derive text colors from background
  const isLightBg = isLightColor(settings.backgroundColor);
  const textColor = isLightBg ? settings.secondaryColor : '#ffffff';
  const mutedTextColor = isLightBg ? `${settings.secondaryColor}99` : '#ffffffaa';

  return (
    <div 
      className="w-full"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div 
        className="w-[612px] min-h-[792px] p-12 shadow-lg"
        style={{
          fontFamily: `"${settings.bodyFont}", sans-serif`,
          fontSize: `${settings.fontSize}px`,
          fontWeight: settings.bodyWeight,
          color: textColor,
          backgroundColor: settings.backgroundColor,
        }}
      >
        {/* Header */}
        <header className={`mb-10 ${getHeaderAlignment(settings.headerLayout)}`}>
          {settings.headerLayout === 'split' ? (
            <div className="flex justify-between items-start">
              <Logo settings={settings} />
              <div className="text-right">
                <h1 
                  className="text-4xl tracking-tight mb-3"
                  style={{ 
                    fontFamily: `"${settings.headingFont}", sans-serif`,
                    fontWeight: settings.headingWeight,
                    color: settings.primaryColor,
                  }}
                >
                  INVOICE
                </h1>
                <div className="space-y-1" style={{ color: mutedTextColor }}>
                  <p><span className="font-medium" style={{ color: textColor }}>#{invoiceData.invoiceNumber}</span></p>
                  <p>{formatDate(invoiceData.date)}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Logo settings={settings} centered={settings.headerLayout === 'centered'} />
              <h1 
                className={`text-4xl tracking-tight mt-6 mb-4 ${settings.headerLayout === 'centered' ? 'text-center' : ''}`}
                style={{ 
                  fontFamily: `"${settings.headingFont}", sans-serif`,
                  fontWeight: settings.headingWeight,
                  color: settings.primaryColor,
                }}
              >
                INVOICE
              </h1>
              <div className={`flex gap-8 ${settings.headerLayout === 'centered' ? 'justify-center' : ''}`} style={{ color: mutedTextColor }}>
                <p><span className="font-medium" style={{ color: textColor }}>Invoice #:</span> {invoiceData.invoiceNumber}</p>
                <p><span className="font-medium" style={{ color: textColor }}>Date:</span> {formatDate(invoiceData.date)}</p>
              </div>
            </>
          )}
        </header>

        {/* Divider */}
        <div 
          className="h-px mb-8"
          style={{ backgroundColor: `${settings.primaryColor}30` }}
        />

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 
              className="text-xs uppercase tracking-wider mb-3"
              style={{ 
                fontFamily: `"${settings.headingFont}", sans-serif`,
                fontWeight: 600,
                color: settings.primaryColor,
              }}
            >
              From
            </h3>
            <p className="font-semibold mb-1">{invoiceData.companyName}</p>
            {settings.showCompanyAddress && invoiceData.companyAddress && (
              <p className="text-sm whitespace-pre-line" style={{ color: mutedTextColor }}>
                {invoiceData.companyAddress}
              </p>
            )}
          </div>
          <div>
            <h3 
              className="text-xs uppercase tracking-wider mb-3"
              style={{ 
                fontFamily: `"${settings.headingFont}", sans-serif`,
                fontWeight: 600,
                color: settings.primaryColor,
              }}
            >
              Bill To
            </h3>
            <p className="font-semibold mb-1">{invoiceData.clientName}</p>
            {invoiceData.clientAddress && (
              <p className="text-sm whitespace-pre-line" style={{ color: mutedTextColor }}>
                {invoiceData.clientAddress}
              </p>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr 
                style={{ 
                  borderBottomWidth: '2px',
                  borderBottomColor: settings.primaryColor,
                }}
              >
                <th 
                  className="text-left py-3 text-xs uppercase tracking-wider"
                  style={{ 
                    fontFamily: `"${settings.headingFont}", sans-serif`,
                    fontWeight: 600,
                    color: settings.primaryColor,
                  }}
                >
                  Description
                </th>
                <th 
                  className="text-right py-3 text-xs uppercase tracking-wider w-20"
                  style={{ 
                    fontFamily: `"${settings.headingFont}", sans-serif`,
                    fontWeight: 600,
                    color: settings.primaryColor,
                  }}
                >
                  Qty
                </th>
                <th 
                  className="text-right py-3 text-xs uppercase tracking-wider w-24"
                  style={{ 
                    fontFamily: `"${settings.headingFont}", sans-serif`,
                    fontWeight: 600,
                    color: settings.primaryColor,
                  }}
                >
                  Rate
                </th>
                <th 
                  className="text-right py-3 text-xs uppercase tracking-wider w-28"
                  style={{ 
                    fontFamily: `"${settings.headingFont}", sans-serif`,
                    fontWeight: 600,
                    color: settings.primaryColor,
                  }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.lineItems.map((item, index) => (
                <tr 
                  key={index}
                  className={getTableRowStyle(settings.tableStyle, index)}
                  style={{ 
                    borderBottomColor: `${settings.secondaryColor}20`,
                    backgroundColor: settings.tableStyle === 'striped' && index % 2 === 1 
                      ? `${settings.primaryColor}08` 
                      : 'transparent',
                  }}
                >
                  <td className="py-4">{item.description}</td>
                  <td className="text-right py-4" style={{ color: mutedTextColor }}>{item.quantity}</td>
                  <td className="text-right py-4" style={{ color: mutedTextColor }}>{formatCurrency(item.rate)}</td>
                  <td className="text-right py-4 font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm" style={{ color: mutedTextColor }}>
              <span>Subtotal</span>
              <span style={{ color: textColor }}>{formatCurrency(invoiceData.subtotal)}</span>
            </div>
            
            {settings.showDiscountField && invoiceData.discountAmount && invoiceData.discountAmount > 0 && (
              <div className="flex justify-between text-sm" style={{ color: settings.accentColor }}>
                <span>Discount ({invoiceData.discountPercent}%)</span>
                <span>-{formatCurrency(invoiceData.discountAmount)}</span>
              </div>
            )}
            
            {settings.showTaxField && invoiceData.taxAmount && invoiceData.taxAmount > 0 && (
              <div className="flex justify-between text-sm" style={{ color: mutedTextColor }}>
                <span>Tax ({invoiceData.taxPercent}%)</span>
                <span style={{ color: textColor }}>{formatCurrency(invoiceData.taxAmount)}</span>
              </div>
            )}
            
            <div 
              className="flex justify-between pt-3 text-lg font-semibold"
              style={{ 
                borderTopWidth: '2px',
                borderTopColor: settings.primaryColor,
                fontFamily: `"${settings.headingFont}", sans-serif`,
              }}
            >
              <span style={{ color: settings.primaryColor }}>Total</span>
              <span style={{ color: settings.primaryColor }}>{formatCurrency(invoiceData.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        {settings.showPaymentTerms && invoiceData.paymentTerms && (
          <div className="mb-6">
            <h3 
              className="text-xs uppercase tracking-wider mb-2"
              style={{ 
                fontFamily: `"${settings.headingFont}", sans-serif`,
                fontWeight: 600,
                color: settings.primaryColor,
              }}
            >
              Payment Terms
            </h3>
            <p className="text-sm" style={{ color: mutedTextColor }}>
              {invoiceData.paymentTerms}
            </p>
          </div>
        )}

        {/* Notes */}
        {settings.showNotesField && invoiceData.notes && (
          <div className="mb-6">
            <h3 
              className="text-xs uppercase tracking-wider mb-2"
              style={{ 
                fontFamily: `"${settings.headingFont}", sans-serif`,
                fontWeight: 600,
                color: settings.primaryColor,
              }}
            >
              Notes
            </h3>
            <p className="text-sm" style={{ color: mutedTextColor }}>
              {invoiceData.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        {settings.footerText && (
          <footer 
            className="mt-auto pt-6 text-center text-sm"
            style={{ 
              borderTopWidth: '1px',
              borderTopColor: `${settings.primaryColor}20`,
              color: mutedTextColor,
            }}
          >
            {settings.footerText}
          </footer>
        )}
      </div>
    </div>
  );
}

// Helper Components
function Logo({ settings, centered = false }: { settings: SleekTemplateSettings; centered?: boolean }) {
  const alignClass = centered 
    ? 'mx-auto' 
    : settings.logoPosition === 'right' 
      ? 'ml-auto' 
      : settings.logoPosition === 'center' 
        ? 'mx-auto' 
        : '';

  if (settings.logoUrl) {
    return (
      <img 
        src={settings.logoUrl}
        alt="Company Logo"
        className={`object-contain ${alignClass}`}
        style={{ 
          width: `${settings.logoWidth}px`,
          maxHeight: '60px',
        }}
      />
    );
  }

  return (
    <div 
      className={`flex items-center justify-center rounded ${alignClass}`}
      style={{ 
        width: `${settings.logoWidth}px`,
        height: '48px',
        backgroundColor: `${settings.primaryColor}15`,
        color: settings.primaryColor,
        fontSize: '12px',
        fontWeight: 500,
      }}
    >
      Logo
    </div>
  );
}

// Helper Functions
function getHeaderAlignment(layout: string): string {
  switch (layout) {
    case 'centered':
      return 'text-center';
    case 'split':
      return '';
    default:
      return '';
  }
}

function getTableRowStyle(style: string, index: number): string {
  switch (style) {
    case 'bordered':
      return 'border-b';
    case 'striped':
      return '';
    default: // minimal
      return 'border-b border-dashed';
  }
}

function isLightColor(hex: string): boolean {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 128;
}

// Default settings for the Sleek template
export const defaultSleekSettings: SleekTemplateSettings = {
  name: 'Sleek - Default',
  logoUrl: null,
  logoPosition: 'left',
  logoWidth: 120,
  primaryColor: '#5f6fff',
  secondaryColor: '#1e293b',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  headingFont: 'Inter',
  headingWeight: 600,
  bodyFont: 'Inter',
  bodyWeight: 400,
  fontSize: 14,
  headerLayout: 'split',
  tableStyle: 'minimal',
  showCompanyAddress: true,
  showPaymentTerms: true,
  showTaxField: true,
  showDiscountField: true,
  showNotesField: true,
  footerText: 'Thank you for your business!',
  dateFormat: 'MM/DD/YYYY',
};
