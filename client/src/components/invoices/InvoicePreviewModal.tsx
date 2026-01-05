import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TemplateSelector } from "./TemplateSelector";
import { useState } from "react";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
}

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
  companyName?: string;
  companyAddress?: string;
  templateId?: number | null;
  onTemplateChange?: (templateId: number | null) => void;
}

/**
 * Invoice Preview Modal with Template Support
 * 
 * Shows a full preview of the invoice with the selected template applied.
 * Users can switch templates in the preview to see how different styles look.
 */
export function InvoicePreviewModal({
  open,
  onClose,
  invoiceNumber,
  clientName,
  clientEmail,
  issueDate,
  dueDate,
  lineItems,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  notes,
  paymentTerms,
  companyName,
  companyAddress,
  templateId,
  onTemplateChange,
}: InvoicePreviewModalProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(templateId || null);
  
  // Fetch templates to get the selected template's styling
  const { data: templates } = trpc.templates.list.useQuery();
  
  // Get the template to use for preview (either selected or default)
  const template = previewTemplateId 
    ? templates?.find(t => t.id === previewTemplateId)
    : templates?.find(t => t.isDefault);

  // Apply template colors and fonts
  const primaryColor = template?.primaryColor || "#5f6fff";
  const secondaryColor = template?.secondaryColor || "#4f46e5";
  const headingFont = template?.headingFont || "Inter";
  const bodyFont = template?.bodyFont || "Inter";
  const logoUrl = template?.logoUrl;
  const logoWidth = template?.logoWidth || 120;
  const logoPosition = template?.logoPosition || "left";

  const handleTemplateChange = (newTemplateId: number | null) => {
    setPreviewTemplateId(newTemplateId);
    onTemplateChange?.(newTemplateId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Invoice Preview
          </DialogTitle>
          <DialogDescription>
            Review your invoice before saving. You can switch templates to see different styles.
          </DialogDescription>
        </DialogHeader>

        {/* Template Selector */}
        <div className="mb-4">
          <TemplateSelector
            value={previewTemplateId}
            onChange={handleTemplateChange}
          />
        </div>

        {/* Invoice Preview with Template Styling */}
        <div 
          className="bg-white p-8 rounded-lg border shadow-sm"
          style={{
            fontFamily: bodyFont,
          }}
        >
          {/* Header */}
          <div className="mb-8 pb-4 border-b-2" style={{ borderColor: primaryColor }}>
            {/* Logo Section */}
            {logoUrl && (
              <div className={`mb-4 ${logoPosition === 'center' ? 'text-center' : logoPosition === 'right' ? 'text-right' : ''}`}>
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="rounded"
                  style={{ width: `${logoWidth}px`, height: 'auto', maxHeight: '60px', objectFit: 'contain' }}
                />
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <h1 
                  className="text-4xl font-bold mb-1"
                  style={{ 
                    color: primaryColor,
                    fontFamily: headingFont,
                  }}
                >
                  INVOICE
                </h1>
                <p className="text-lg text-gray-600">{invoiceNumber}</p>
              </div>
              <div className="text-right">
                {companyName && (
                  <p className="font-semibold text-gray-900 text-lg">{companyName}</p>
                )}
                {companyAddress && (
                  <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{companyAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To & Dates */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p 
                className="text-sm font-bold uppercase mb-2"
                style={{ color: secondaryColor }}
              >
                Bill To
              </p>
              <p className="font-semibold text-gray-900 text-lg">{clientName}</p>
              {clientEmail && (
                <p className="text-sm text-gray-600 mt-1">{clientEmail}</p>
              )}
            </div>
            <div className="text-right">
              <div className="mb-3">
                <span className="text-sm font-semibold text-gray-500">Issue Date: </span>
                <span className="text-gray-900 font-medium">{formatDate(issueDate)}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-500">Due Date: </span>
                <span className="text-gray-900 font-medium">{formatDate(dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-8">
            <thead>
              <tr style={{ backgroundColor: `${primaryColor}15` }}>
                <th 
                  className="text-left py-3 px-4 text-sm font-bold uppercase"
                  style={{ color: primaryColor }}
                >
                  Description
                </th>
                <th 
                  className="text-right py-3 px-4 text-sm font-bold uppercase"
                  style={{ color: primaryColor }}
                >
                  Qty
                </th>
                <th 
                  className="text-right py-3 px-4 text-sm font-bold uppercase"
                  style={{ color: primaryColor }}
                >
                  Rate
                </th>
                <th 
                  className="text-right py-3 px-4 text-sm font-bold uppercase"
                  style={{ color: primaryColor }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-900">{item.description}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(item.rate)}</td>
                  <td className="py-3 px-4 text-right text-gray-900 font-medium">{formatCurrency(item.quantity * item.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-gray-700 py-2">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-gray-700 py-2">
                  <span className="font-medium">Discount:</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-gray-700 py-2">
                  <span className="font-medium">Tax:</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div 
                className="flex justify-between text-xl font-bold pt-3 mt-2 border-t-2"
                style={{ 
                  color: primaryColor,
                  borderColor: primaryColor,
                }}
              >
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Payment Terms */}
          {(notes || paymentTerms) && (
            <div className="space-y-4 pt-6 border-t border-gray-200">
              {notes && (
                <div>
                  <p 
                    className="text-sm font-bold uppercase mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Notes
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{notes}</p>
                </div>
              )}
              {paymentTerms && (
                <div>
                  <p 
                    className="text-sm font-bold uppercase mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Payment Terms
                  </p>
                  <p className="text-sm text-gray-700">{paymentTerms}</p>
                </div>
              )}
            </div>
          )}

          {/* Template Attribution */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400 text-center">
              Using {template?.name || "Default"} template
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
