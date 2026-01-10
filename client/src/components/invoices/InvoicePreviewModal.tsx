import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogBody } from "@/components/shared/DialogPatterns";
import { Button } from "@/components/ui/button";
import { Eye, X, Receipt, FileText, Smartphone, Tablet, Monitor, FileDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TemplateSelector } from "./TemplateSelector";
import { useState } from "react";
import { ReceiptStyleInvoice } from "./ReceiptStyleInvoice";
import { ClassicStyleInvoice } from "./ClassicStyleInvoice";
import { A4PreviewContainer, type PreviewFormat, type PreviewDevice } from "./A4PreviewContainer";
import { cn } from "@/lib/utils";

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
  templateId?: number | null;
  onTemplateChange?: (templateId: number | null) => void;
}

type InvoiceStyle = 'classic' | 'receipt';

/**
 * Invoice Preview Modal with Standardized A4 Preview
 * 
 * Shows a full preview of the invoice with proper A4 proportions.
 * Users can switch between Receipt and Classic styles, and preview
 * how the invoice will appear in different formats (A4/PDF, Web, Email).
 */
export function InvoicePreviewModal({
  open,
  onClose,
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
  templateId,
  onTemplateChange,
}: InvoicePreviewModalProps) {
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(templateId || null);
  const [invoiceStyle, setInvoiceStyle] = useState<InvoiceStyle>('receipt');
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('a4');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  
  // Fetch templates to get the selected template's styling
  const { data: templates } = trpc.templates.list.useQuery();
  
  // Get the template to use for preview (either selected or default)
  const template = previewTemplateId 
    ? templates?.find(t => t.id === previewTemplateId)
    : templates?.find(t => t.isDefault);

  // Apply template colors
  const primaryColor = template?.primaryColor || "#18181b";
  const accentColor = template?.accentColor || "#5f6fff";
  const logoUrl = template?.logoUrl;

  const handleTemplateChange = (newTemplateId: number | null) => {
    setPreviewTemplateId(newTemplateId);
    onTemplateChange?.(newTemplateId);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Invoice Preview
          </DialogTitle>
          <DialogDescription>
            Preview your invoice in different formats and styles before saving.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-hidden flex flex-col">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4 pb-4 border-b shrink-0">
            {/* Style Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Style:</span>
              <div className="flex bg-muted/50 p-0.5 rounded-lg">
                <button
                  onClick={() => setInvoiceStyle('receipt')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    invoiceStyle === 'receipt' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Receipt
                </button>
                <button
                  onClick={() => setInvoiceStyle('classic')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    invoiceStyle === 'classic' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Classic
                </button>
              </div>
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Format:</span>
              <div className="flex bg-muted/50 p-0.5 rounded-lg">
                <button
                  onClick={() => setPreviewFormat('a4')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    previewFormat === 'a4'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  A4/PDF
                </button>
                <button
                  onClick={() => setPreviewFormat('web')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    previewFormat === 'web'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Web
                </button>
                <button
                  onClick={() => setPreviewFormat('email')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    previewFormat === 'email'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Email
                </button>
              </div>
            </div>

            {/* Device Selector - only show for web format */}
            {previewFormat === 'web' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Device:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    title="Mobile"
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      previewDevice === 'mobile'
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    title="Tablet"
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      previewDevice === 'tablet'
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Tablet className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    title="Desktop"
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      previewDevice === 'desktop'
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Template Selector - only show for classic style */}
            {invoiceStyle === 'classic' && (
              <div className="flex-1 w-full lg:w-auto lg:max-w-[200px] ml-auto">
                <TemplateSelector
                  value={previewTemplateId}
                  onChange={handleTemplateChange}
                />
              </div>
            )}
          </div>

          {/* Preview Container */}
          <div className="flex-1 overflow-hidden">
            <A4PreviewContainer
              format={previewFormat}
              device={previewDevice}
              maxHeight="calc(95vh - 280px)"
              className="h-full"
            >
              {invoiceStyle === 'receipt' ? (
                <ReceiptStyleInvoice
                  invoiceNumber={invoiceNumber}
                  clientName={clientName}
                  clientEmail={clientEmail}
                  clientAddress={clientAddress}
                  issueDate={issueDate}
                  dueDate={dueDate}
                  lineItems={lineItems}
                  subtotal={subtotal}
                  discountAmount={discountAmount}
                  taxAmount={taxAmount}
                  taxRate={taxRate}
                  total={total}
                  notes={notes}
                  paymentTerms={paymentTerms}
                  companyName={companyName}
                  companyAddress={companyAddress}
                  companyEmail={companyEmail}
                  companyPhone={companyPhone}
                  taxId={taxId}
                  status={status}
                  logoUrl={logoUrl || undefined}
                />
              ) : (
                <ClassicStyleInvoice
                  invoiceNumber={invoiceNumber}
                  clientName={clientName}
                  clientEmail={clientEmail}
                  clientAddress={clientAddress}
                  issueDate={issueDate}
                  dueDate={dueDate}
                  lineItems={lineItems}
                  subtotal={subtotal}
                  discountAmount={discountAmount}
                  taxAmount={taxAmount}
                  taxRate={taxRate}
                  total={total}
                  notes={notes}
                  paymentTerms={paymentTerms}
                  companyName={companyName}
                  companyAddress={companyAddress}
                  companyEmail={companyEmail}
                  companyPhone={companyPhone}
                  taxId={taxId}
                  status={status}
                  logoUrl={logoUrl || undefined}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              )}
            </A4PreviewContainer>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4 shrink-0">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
