import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { InvoiceActionsMenu } from "@/components/invoices/InvoiceActionsMenu";
import { InvoiceNumberCell } from "@/components/invoices/InvoiceNumberCell";
import { Currency, DateDisplay } from "@/components/ui/typography";
import { CurrencyBadge } from "@/components/CurrencySelector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  };
  paymentLink: string | null;
  totalPaid?: string;
  amountDue?: string;
  paymentStatus?: "unpaid" | "partial" | "paid";
  paymentProgress?: number;
  currency?: string;
  quickbooks?: {
    synced: boolean;
    qbInvoiceId: string | null;
    lastSyncedAt: Date | null;
  };
}

interface InvoiceTableProps {
  invoices: Invoice[] | undefined;
  selectedIds: Set<number>;
  allCurrentPageSelected: boolean;
  someCurrentPageSelected: boolean;
  toggleSelectAll: () => void;
  toggleSelect: (id: number) => void;
  sort: { key: string; direction: "asc" | "desc" };
  handleSort: (key: string) => void;
  totalItems: number;
  qbStatus?: { connected: boolean };
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onDownloadPDF: (invoice: Invoice) => void;
  onSendEmail: (invoice: Invoice) => void;
  onCreatePaymentLink: (invoice: Invoice) => void;
  isLoading?: {
    pdf?: boolean;
    email?: boolean;
    paymentLink?: boolean;
    duplicate?: boolean;
  };
  syncingInvoiceId?: number | null;
}

export function InvoiceTable({
  invoices,
  selectedIds,
  allCurrentPageSelected,
  someCurrentPageSelected,
  toggleSelectAll,
  toggleSelect,
  sort,
  handleSort,
  totalItems,
  qbStatus,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onDownloadPDF,
  onSendEmail,
  onCreatePaymentLink,
  isLoading = {},
  syncingInvoiceId,
}: InvoiceTableProps) {
  if (!invoices) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm overflow-hidden">
      <div className="p-5 pb-4">
        <h3 className="text-lg font-semibold text-foreground">All Invoices</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-numeric">{totalItems}</span> invoice
          {totalItems !== 1 ? "s" : ""} found
        </p>
      </div>
      <div className="px-5 pb-5">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all invoices on this page"
                    className={
                      someCurrentPageSelected && !allCurrentPageSelected
                        ? "data-[state=checked]:bg-primary/50"
                        : ""
                    }
                  />
                </TableHead>
                <SortableTableHeader
                  label="Invoice #"
                  sortKey="invoiceNumber"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Client"
                  sortKey="client.name"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Issue Date"
                  sortKey="issueDate"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Due Date"
                  sortKey="dueDate"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Amount"
                  sortKey="total"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Payment"
                  sortKey="paymentStatus"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Status"
                  sortKey="status"
                  currentSort={sort}
                  onSort={handleSort}
                />
                {qbStatus?.connected && (
                  <TableHead className="w-[60px] text-center">QB</TableHead>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow
                  key={invoice.id}
                  className={`group ${selectedIds.has(invoice.id) ? "bg-primary/5" : ""}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(invoice.id)}
                      onCheckedChange={() => toggleSelect(invoice.id)}
                      aria-label={`Select invoice ${invoice.invoiceNumber}`}
                    />
                  </TableCell>
                  <TableCell>
                    <InvoiceNumberCell invoiceNumber={invoice.invoiceNumber} />
                  </TableCell>
                  <TableCell>{invoice.client.name}</TableCell>
                  <TableCell>
                    <DateDisplay date={invoice.issueDate} format="short" />
                  </TableCell>
                  <TableCell>
                    <DateDisplay date={invoice.dueDate} format="short" />
                  </TableCell>
                  <TableCell className="font-semibold">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Currency
                          amount={invoice.total}
                          currency={invoice.currency}
                        />
                        {invoice.currency && invoice.currency !== "USD" && (
                          <CurrencyBadge code={invoice.currency} />
                        )}
                      </div>
                      {invoice.paymentStatus &&
                        invoice.paymentStatus !== "unpaid" && (
                          <div className="text-xs text-muted-foreground">
                            Paid: <Currency amount={invoice.totalPaid || "0"} />
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.paymentStatus ? (
                      <PaymentStatusBadge status={invoice.paymentStatus} />
                    ) : (
                      <PaymentStatusBadge status="unpaid" />
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  {qbStatus?.connected && (
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-center">
                              {invoice.quickbooks?.synced ? (
                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-emerald-500"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span className="text-xs">
                              {invoice.quickbooks?.synced && (
                                <div className="font-medium">
                                  Synced to QuickBooks
                                </div>
                              )}
                              {invoice.quickbooks?.lastSyncedAt && (
                                <div className="text-muted-foreground">
                                  {new Date(
                                    invoice.quickbooks.lastSyncedAt
                                  ).toLocaleString()}
                                </div>
                              )}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <InvoiceActionsMenu
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoiceNumber}
                      hasPaymentLink={!!invoice.paymentLink}
                      onView={() => onView(invoice)}
                      onEdit={() => onEdit(invoice)}
                      onDownloadPDF={() => onDownloadPDF(invoice)}
                      onSendEmail={() => onSendEmail(invoice)}
                      onCreatePaymentLink={() => onCreatePaymentLink(invoice)}
                      onDelete={() => onDelete(invoice)}
                      onDuplicate={() => onDuplicate(invoice)}
                      quickBooksConnected={qbStatus?.connected || false}
                      isLoading={{
                        pdf: isLoading.pdf,
                        email: isLoading.email,
                        paymentLink: isLoading.paymentLink,
                        duplicate: isLoading.duplicate,
                        quickBooksSync: syncingInvoiceId === invoice.id,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden px-5 pb-5 space-y-4">
          {invoices.map(invoice => (
            <div
              key={invoice.id}
              className={`border rounded-lg p-4 space-y-3 ${selectedIds.has(invoice.id) ? "border-primary bg-primary/5" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(invoice.id)}
                    onCheckedChange={() => toggleSelect(invoice.id)}
                    aria-label={`Select invoice ${invoice.invoiceNumber}`}
                    className="mt-1"
                  />
                  <div>
                    <InvoiceNumberCell invoiceNumber={invoice.invoiceNumber} />
                    <p className="text-sm text-muted-foreground">
                      {invoice.client.name}
                    </p>
                  </div>
                </div>
                <InvoiceActionsMenu
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                  hasPaymentLink={!!invoice.paymentLink}
                  onView={() => onView(invoice)}
                  onEdit={() => onEdit(invoice)}
                  onDownloadPDF={() => onDownloadPDF(invoice)}
                  onSendEmail={() => onSendEmail(invoice)}
                  onCreatePaymentLink={() => onCreatePaymentLink(invoice)}
                  onDelete={() => onDelete(invoice)}
                  onDuplicate={() => onDuplicate(invoice)}
                  quickBooksConnected={qbStatus?.connected || false}
                  isLoading={{
                    pdf: isLoading.pdf,
                    email: isLoading.email,
                    paymentLink: isLoading.paymentLink,
                    duplicate: isLoading.duplicate,
                    quickBooksSync: syncingInvoiceId === invoice.id,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={invoice.status} />
                  <PaymentStatusBadge
                    status={invoice.paymentStatus || "unpaid"}
                  />
                  {qbStatus?.connected && invoice.quickbooks?.synced && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-emerald-500"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <span className="text-xs">Synced to QuickBooks</span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold flex items-center gap-1 justify-end">
                    <Currency
                      amount={invoice.total}
                      currency={invoice.currency}
                    />
                    {invoice.currency && invoice.currency !== "USD" && (
                      <CurrencyBadge code={invoice.currency} />
                    )}
                  </p>
                  {invoice.paymentStatus &&
                    invoice.paymentStatus !== "unpaid" && (
                      <p className="text-xs text-muted-foreground">
                        Paid: <Currency amount={invoice.totalPaid || "0"} />
                      </p>
                    )}
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>
                  Issued:{" "}
                  <DateDisplay date={invoice.issueDate} format="short" />
                </span>
                <span>
                  Due: <DateDisplay date={invoice.dueDate} format="short" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
