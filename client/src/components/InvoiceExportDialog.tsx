import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, FileSpreadsheet, FileText } from "lucide-react";
import { Download } from "@phosphor-icons/react";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface Invoice {
  id: number;
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  total: string;
  client: {
    id: number;
    name: string;
    email: string | null;
  };
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  totalPaid?: string;
  amountDue?: string;
  currency?: string;
}

interface InvoiceExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: Invoice[];
  onExportPDF?: () => Promise<void>;
}

export function InvoiceExportDialog({
  open,
  onOpenChange,
  invoices,
  onExportPDF,
}: InvoiceExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Calculate summary stats
  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalPaid || '0'), 0);
  const outstandingAmount = totalAmount - paidAmount;
  const paidCount = invoices.filter(inv => inv.paymentStatus === 'paid').length;
  const currency = invoices[0]?.currency || 'USD';

  const handleExportCSV = () => {
    if (invoices.length === 0) return;

    // Build CSV content with more detailed columns
    const headers = [
      "Invoice Number",
      "Client Name",
      "Client Email",
      "Status",
      "Payment Status",
      "Issue Date",
      "Due Date",
      "Total Amount",
      "Amount Paid",
      "Amount Due",
      "Currency",
    ];

    const rows = invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.client.name,
      invoice.client.email || '',
      invoice.status,
      invoice.paymentStatus || "unpaid",
      new Date(invoice.issueDate).toLocaleDateString(),
      new Date(invoice.dueDate).toLocaleDateString(),
      parseFloat(invoice.total?.toString() || "0").toFixed(2),
      parseFloat(invoice.totalPaid?.toString() || "0").toFixed(2),
      parseFloat(invoice.amountDue?.toString() || invoice.total?.toString() || "0").toFixed(2),
      invoice.currency || "USD",
    ]);

    // Add summary row
    rows.push([]);
    rows.push(['SUMMARY', '', '', '', '', '', '', '', '', '', '']);
    rows.push(['Total Invoices', invoices.length.toString(), '', '', '', '', '', '', '', '', '']);
    rows.push(['Total Amount', '', '', '', '', '', '', totalAmount.toFixed(2), '', '', currency]);
    rows.push(['Total Paid', '', '', '', '', '', '', '', paidAmount.toFixed(2), '', currency]);
    rows.push(['Outstanding', '', '', '', '', '', '', '', '', outstandingAmount.toFixed(2), currency]);

    // Convert to CSV string
    const csvContent = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sleek-invoices-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (invoices.length === 0) return;
    
    // Generate PDF report using HTML
    const htmlContent = generatePDFHTML(invoices, {
      totalAmount,
      paidAmount,
      outstandingAmount,
      paidCount,
      currency,
    });
    
    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        handleExportCSV();
      } else {
        await handleExportPDF();
      }
      onOpenChange(false);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Invoices</DialogTitle>
          <DialogDescription>
            Export {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} with current filters applied.
          </DialogDescription>
        </DialogHeader>
        
        {/* Dialog Body - consistent padding */}
        <div className="px-6 py-4 space-y-6">
          {/* Summary Stats */}
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm font-medium mb-3">Export Summary</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Total Invoices</p>
                <p className="font-semibold">{invoices.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Paid Invoices</p>
                <p className="font-semibold text-green-600">{paidCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-semibold">{formatCurrency(totalAmount, currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Outstanding</p>
                <p className="font-semibold text-orange-600">{formatCurrency(outstandingAmount, currency)}</p>
              </div>
            </div>
          </div>
          
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v: 'csv' | 'pdf') => setExportFormat(v)}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="csv" id="csv" className="mt-1" />
                <div className="flex-1">
                  <label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="font-medium">CSV Spreadsheet</span>
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Best for data analysis in Excel, Google Sheets, or other spreadsheet applications.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="pdf" id="pdf" className="mt-1" />
                <div className="flex-1">
                  <label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-red-600" />
                    <span className="font-medium">PDF Report</span>
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Professional report format with summary statistics, ideal for sharing or archiving.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || invoices.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download weight="bold" className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Generate HTML for PDF export
function generatePDFHTML(
  invoices: Invoice[],
  summary: {
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    paidCount: number;
    currency: string;
  }
): string {
  const formatDate = (date: Date) => new Date(date).toLocaleDateString();
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: summary.currency,
    }).format(amount);
  };

  const statusColors: Record<string, string> = {
    draft: '#6b7280',
    sent: '#3b82f6',
    viewed: '#8b5cf6',
    paid: '#22c55e',
    overdue: '#ef4444',
    canceled: '#9ca3af',
  };

  const paymentStatusColors: Record<string, string> = {
    unpaid: '#ef4444',
    partial: '#f59e0b',
    paid: '#22c55e',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      color: #1f2937;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
    }
    .header .date {
      color: #6b7280;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .summary-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
    }
    .summary-card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .summary-card .value {
      font-size: 24px;
      font-weight: 700;
    }
    .summary-card.paid .value { color: #22c55e; }
    .summary-card.outstanding .value { color: #f59e0b; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f9fafb;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
    }
    .text-right { text-align: right; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .summary { grid-template-columns: repeat(4, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Invoice Report</h1>
      <p class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Invoices</div>
      <div class="value">${invoices.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Total Amount</div>
      <div class="value">${formatMoney(summary.totalAmount)}</div>
    </div>
    <div class="summary-card paid">
      <div class="label">Amount Paid</div>
      <div class="value">${formatMoney(summary.paidAmount)}</div>
    </div>
    <div class="summary-card outstanding">
      <div class="label">Outstanding</div>
      <div class="value">${formatMoney(summary.outstandingAmount)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Invoice #</th>
        <th>Client</th>
        <th>Status</th>
        <th>Payment</th>
        <th>Issue Date</th>
        <th>Due Date</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoices.map(inv => `
        <tr>
          <td><strong>${inv.invoiceNumber}</strong></td>
          <td>${inv.client.name}</td>
          <td>
            <span class="status-badge" style="background-color: ${statusColors[inv.status] || '#6b7280'}">
              ${inv.status}
            </span>
          </td>
          <td>
            <span class="status-badge" style="background-color: ${paymentStatusColors[inv.paymentStatus || 'unpaid']}">
              ${inv.paymentStatus || 'unpaid'}
            </span>
          </td>
          <td>${formatDate(inv.issueDate)}</td>
          <td>${formatDate(inv.dueDate)}</td>
          <td class="text-right">${formatMoney(parseFloat(inv.total || '0'))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by SleekInvoices • ${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} exported</p>
  </div>
</body>
</html>
  `;
}
