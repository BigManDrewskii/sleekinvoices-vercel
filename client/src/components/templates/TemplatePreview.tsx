interface TemplatePreviewProps {
  template: {
    name: string;
    templateType: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
    fontSize: number;
    logoUrl?: string | null;
    logoPosition: string;
    logoWidth: number;
    headerLayout: string;
    footerLayout: string;
    showCompanyAddress: boolean;
    showPaymentTerms: boolean;
    showTaxField: boolean;
    showDiscountField: boolean;
    showNotesField: boolean;
    footerText: string | null;
    dateFormat: string;
  };
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    switch (template.dateFormat) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "MMM DD, YYYY":
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      default: // MM/DD/YYYY
        return `${month}/${day}/${year}`;
    }
  };

  const headerAlignClass = 
    template.headerLayout === "centered" ? "text-center" :
    template.headerLayout === "split" ? "flex justify-between items-start" :
    ""; // standard

  const logoAlignClass =
    template.logoPosition === "center" ? "mx-auto" :
    template.logoPosition === "right" ? "ml-auto" :
    ""; // left

  return (
    <div 
      className="bg-white border rounded-lg shadow-sm p-8 space-y-6"
      style={{
        fontFamily: template.bodyFont,
        fontSize: `${template.fontSize}px`,
        color: template.secondaryColor,
      }}
    >
      {/* Header */}
      <div className={headerAlignClass}>
        {template.headerLayout === "split" ? (
          <>
            <div>
              {template.logoUrl ? (
                <img 
                  src={template.logoUrl} 
                  alt="Company Logo" 
                  className="rounded"
                  style={{ width: `${template.logoWidth}px`, height: 'auto', maxHeight: '60px', objectFit: 'contain' }}
                />
              ) : (
                <div 
                  className="h-12 w-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500"
                  style={{ width: `${template.logoWidth}px` }}
                >
                  Logo
                </div>
              )}
            </div>
            <div className="text-right">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ 
                  fontFamily: template.headingFont,
                  color: template.primaryColor 
                }}
              >
                INVOICE
              </h1>
              <p className="text-sm">
                <span className="font-semibold">Invoice #:</span> INV-001
              </p>
              <p className="text-sm">
                <span className="font-semibold">Date:</span> {formatDate(new Date())}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className={logoAlignClass}>
              {template.logoUrl ? (
                <img 
                  src={template.logoUrl} 
                  alt="Company Logo" 
                  className="rounded mb-4"
                  style={{ width: `${template.logoWidth}px`, height: 'auto', maxHeight: '60px', objectFit: 'contain' }}
                />
              ) : (
                <div 
                  className="h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 mb-4"
                  style={{ width: `${template.logoWidth}px` }}
                >
                  Logo
                </div>
              )}
            </div>
            <h1 
              className="text-3xl font-bold mb-4"
              style={{ 
                fontFamily: template.headingFont,
                color: template.primaryColor 
              }}
            >
              INVOICE
            </h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold">Invoice #:</p>
                <p>INV-001</p>
              </div>
              <div>
                <p className="font-semibold">Date:</p>
                <p>{formatDate(new Date())}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Company & Client Info */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: template.primaryColor + '20' }}>
        <div>
          <h3 
            className="font-bold mb-2"
            style={{ 
              fontFamily: template.headingFont,
              color: template.primaryColor 
            }}
          >
            From
          </h3>
          <p className="font-semibold">Your Company Name</p>
          {template.showCompanyAddress && (
            <>
              <p className="text-sm">123 Business Street</p>
              <p className="text-sm">City, State 12345</p>
            </>
          )}
        </div>
        <div>
          <h3 
            className="font-bold mb-2"
            style={{ 
              fontFamily: template.headingFont,
              color: template.primaryColor 
            }}
          >
            Bill To
          </h3>
          <p className="font-semibold">Client Name</p>
          <p className="text-sm">456 Client Avenue</p>
          <p className="text-sm">City, State 67890</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="pt-4">
        <table className="w-full text-sm">
          <thead>
            <tr 
              className="border-b-2"
              style={{ 
                borderColor: template.primaryColor,
                color: template.primaryColor,
                fontFamily: template.headingFont,
              }}
            >
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Rate</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">Sample Service</td>
              <td className="text-right py-3">1</td>
              <td className="text-right py-3">$100.00</td>
              <td className="text-right py-3">$100.00</td>
            </tr>
            <tr className="border-b">
              <td className="py-3">Another Service</td>
              <td className="text-right py-3">2</td>
              <td className="text-right py-3">$50.00</td>
              <td className="text-right py-3">$100.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end pt-4">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>$200.00</span>
          </div>
          {template.showDiscountField && (
            <div className="flex justify-between" style={{ color: template.accentColor }}>
              <span>Discount (10%):</span>
              <span>-$20.00</span>
            </div>
          )}
          {template.showTaxField && (
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>$14.40</span>
            </div>
          )}
          <div 
            className="flex justify-between font-bold text-lg pt-2 border-t-2"
            style={{ 
              borderColor: template.primaryColor,
              color: template.primaryColor,
              fontFamily: template.headingFont,
            }}
          >
            <span>Total:</span>
            <span>$194.40</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {template.showPaymentTerms && (
        <div 
          className="pt-4 border-t text-sm"
          style={{ borderColor: template.primaryColor + '20' }}
        >
          <h3 
            className="font-bold mb-2"
            style={{ 
              fontFamily: template.headingFont,
              color: template.primaryColor 
            }}
          >
            Payment Terms
          </h3>
          <p>Payment is due within 30 days of invoice date.</p>
        </div>
      )}

      {/* Notes */}
      {template.showNotesField && (
        <div 
          className="pt-4 border-t text-sm"
          style={{ borderColor: template.primaryColor + '20' }}
        >
          <h3 
            className="font-bold mb-2"
            style={{ 
              fontFamily: template.headingFont,
              color: template.primaryColor 
            }}
          >
            Notes
          </h3>
          <p>Thank you for your business. We appreciate your prompt payment.</p>
        </div>
      )}

      {/* Footer */}
      {template.footerText && (
        <div 
          className={`pt-6 border-t text-center text-sm ${
            template.footerLayout === "minimal" ? "text-xs" : ""
          }`}
          style={{ 
            borderColor: template.primaryColor + '20',
            color: template.secondaryColor + 'cc',
          }}
        >
          {template.footerLayout === "detailed" ? (
            <div className="space-y-2">
              <p className="font-semibold">{template.footerText}</p>
              <p className="text-xs">For questions, contact us at support@example.com</p>
            </div>
          ) : (
            <p>{template.footerText}</p>
          )}
        </div>
      )}
    </div>
  );
}
