import { formatCurrency, formatDate } from "@/lib/utils";
import { Currency, DateDisplay } from "@/components/ui/typography";

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
  // Template customization
  primaryColor?: string;
  accentColor?: string;
}

/**
 * Receipt Style Invoice Component
 * 
 * A clean, minimalist receipt-style invoice inspired by thermal receipts.
 * Features:
 * - Monospace typography for financial data
 * - Dashed dividers for section separation
 * - Compact, vertical layout
 * - High-precision tabular alignment
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
  primaryColor = "#18181b",
  accentColor = "#10b981",
}: ReceiptStyleInvoiceProps) {
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'text-emerald-600';
      case 'overdue': return 'text-rose-600';
      case 'pending': 
      case 'sent': return 'text-amber-600';
      case 'draft': return 'text-zinc-500';
      default: return 'text-zinc-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-white p-12 md:p-16 w-full max-w-[800px] mx-auto selection:bg-zinc-100 font-mono">
      {/* Header - Logo & Brand */}
      <div className="flex items-center gap-3 mb-8">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="Company Logo" 
            className="h-8 w-auto object-contain"
          />
        ) : (
          <div className="w-8 h-8 bg-zinc-900 rounded flex items-center justify-center text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        )}
        <span className="text-sm font-medium tracking-tight text-zinc-900">
          {companyName || "SleekInvoices"}
        </span>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-dashed border-zinc-200 w-full" />

      {/* Meta Info */}
      <div className="grid grid-cols-1 gap-4 mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
            Invoice #
          </div>
          <div className="text-sm font-medium tabular-nums">{invoiceNumber}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
              Issued
            </div>
            <div className="text-sm tabular-nums">
              <DateDisplay date={issueDate} format="long" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
              Due
            </div>
            <div className="text-sm tabular-nums">
              <DateDisplay date={dueDate} format="long" />
            </div>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
            Status
          </div>
          <div className={`text-sm flex items-center gap-1.5 ${getStatusColor(status)}`}>
            <span className="text-[8px] leading-none">●</span>
            <span className="font-medium">{getStatusLabel(status)}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-dashed border-zinc-200 w-full" />

      {/* From */}
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
          From
        </div>
        <div className="text-sm leading-relaxed text-zinc-800">
          <div className="font-medium">{companyName || "Your Company"}</div>
          {companyAddress && <div className="whitespace-pre-line">{companyAddress}</div>}
          {companyEmail && <div className="text-zinc-500">{companyEmail}</div>}
          {companyPhone && <div className="text-zinc-500">{companyPhone}</div>}
          {taxId && (
            <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider tabular-nums">
              Tax ID: {taxId}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-dashed border-zinc-200 w-full" />

      {/* To */}
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
          To
        </div>
        <div className="text-sm leading-relaxed text-zinc-800">
          <div className="font-medium">{clientName}</div>
          {clientAddress && <div className="whitespace-pre-line">{clientAddress}</div>}
          {clientEmail && <div className="text-zinc-500">{clientEmail}</div>}
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-dashed border-zinc-200 w-full" />

      {/* Items */}
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
          Items
        </div>
        <div className="mt-4 space-y-4">
          {/* Header */}
          <div className="grid grid-cols-12 text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2 pb-2">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-4 text-right">Price</div>
          </div>
          {/* Line Items */}
          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 text-sm text-zinc-800 gap-y-1">
              <div className="col-span-6 pr-4">{item.description}</div>
              <div className="col-span-2 text-right tabular-nums text-zinc-500">{item.quantity}</div>
              <div className="col-span-4 text-right tabular-nums">
                <Currency amount={item.quantity * item.rate} />
              </div>
              <div className="col-span-12 text-[10px] text-zinc-400 tabular-nums">
                {item.quantity} × <Currency amount={item.rate} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-dashed border-zinc-200 w-full" />

      {/* Totals */}
      <div className="flex flex-col items-end gap-2 text-sm text-zinc-800 mb-6">
        <div className="grid grid-cols-2 gap-8 w-full max-w-[240px]">
          <div className="text-zinc-400">Subtotal</div>
          <div className="text-right tabular-nums">
            <Currency amount={subtotal} />
          </div>
        </div>
        {discountAmount > 0 && (
          <div className="grid grid-cols-2 gap-8 w-full max-w-[240px]">
            <div className="text-emerald-600">Discount</div>
            <div className="text-right tabular-nums text-emerald-600">
              -<Currency amount={discountAmount} />
            </div>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="grid grid-cols-2 gap-8 w-full max-w-[240px]">
            <div className="text-zinc-400">Tax ({taxRate}%)</div>
            <div className="text-right tabular-nums">
              <Currency amount={taxAmount} />
            </div>
          </div>
        )}
        <div className="w-full max-w-[240px] border-t border-zinc-100 my-1"></div>
        <div className="grid grid-cols-2 gap-8 w-full max-w-[240px] text-lg font-medium">
          <div className="text-zinc-900">Total</div>
          <div className="text-right tabular-nums">
            <Currency amount={total} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-dashed border-zinc-200 w-full" />

      {/* Payment & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {paymentTerms && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
              Payment Terms
            </div>
            <div className="text-xs text-zinc-500 whitespace-pre-wrap leading-relaxed tabular-nums">
              {paymentTerms}
            </div>
          </div>
        )}
        {notes && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-1">
              Notes
            </div>
            <div className="text-xs text-zinc-500 leading-relaxed italic">
              {notes}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 text-[10px] text-zinc-300 uppercase tracking-widest text-center">
        This is a digital record generated by SleekInvoices
      </div>
    </div>
  );
}

export default ReceiptStyleInvoice;
