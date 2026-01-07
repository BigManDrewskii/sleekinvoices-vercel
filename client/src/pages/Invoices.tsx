import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PaymentStatusBadge } from "@/components/shared/PaymentStatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { InvoiceListSkeleton } from "@/components/skeletons/InvoiceListSkeleton";
import { InvoiceActionsMenu } from "@/components/invoices/InvoiceActionsMenu";
import { InvoiceNumberCell } from "@/components/invoices/InvoiceNumberCell";
import { Pagination } from "@/components/shared/Pagination";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Mail,
  Link as LinkIcon,
  File,
  ChevronDown,
  CheckSquare,
  XSquare,
  FileSpreadsheet,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { CurrencyBadge } from "@/components/CurrencySelector";

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
  paymentLink: string | null;
  // Payment information
  totalPaid?: string;
  amountDue?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paymentProgress?: number;
  currency?: string;
}

export default function Invoices() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const { sort, handleSort, sortData } = useTableSort({ defaultKey: "invoiceNumber" });
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  
  const deleteInvoice = trpc.invoices.delete.useMutation({
    // Optimistic update: immediately remove from UI
    onMutate: async ({ id }) => {
      await utils.invoices.list.cancel();
      const previousInvoices = utils.invoices.list.getData();
      
      // Optimistically remove the invoice
      utils.invoices.list.setData(undefined, (old) => 
        old?.filter((invoice) => invoice.id !== id)
      );
      
      // Close dialog immediately
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      
      return { previousInvoices };
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
    },
    onError: (error, _variables, context) => {
      if (context?.previousInvoices) {
        utils.invoices.list.setData(undefined, context.previousInvoices);
      }
      toast.error(error.message || "Failed to delete invoice");
    },
    onSettled: () => {
      utils.invoices.list.invalidate();
    },
  });

  const bulkDeleteInvoices = trpc.invoices.bulkDelete.useMutation({
    // Optimistic update: immediately remove selected invoices
    onMutate: async ({ ids }) => {
      await utils.invoices.list.cancel();
      const previousInvoices = utils.invoices.list.getData();
      const idsSet = new Set(ids);
      
      // Optimistically remove selected invoices
      utils.invoices.list.setData(undefined, (old) => 
        old?.filter((invoice) => !idsSet.has(invoice.id))
      );
      
      // Close dialog and clear selection immediately
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());
      
      return { previousInvoices, deletedCount: ids.length };
    },
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} invoice(s) deleted successfully`);
    },
    onError: (error, _variables, context) => {
      if (context?.previousInvoices) {
        utils.invoices.list.setData(undefined, context.previousInvoices);
      }
      toast.error(error.message || "Failed to delete invoices");
    },
    onSettled: () => {
      utils.invoices.list.invalidate();
    },
  });

  const generatePDF = trpc.invoices.generatePDF.useMutation({
    onSuccess: (data) => {
      // Open PDF in new tab
      window.open(data.url, '_blank');
      toast.success("PDF generated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  const sendEmail = trpc.invoices.sendEmail.useMutation({
    // Optimistic update: immediately update status to Sent
    onMutate: async ({ id }) => {
      await utils.invoices.list.cancel();
      const previousInvoices = utils.invoices.list.getData();
      
      // Optimistically update status to Sent
      utils.invoices.list.setData(undefined, (old) => 
        old?.map((invoice) => 
          invoice.id === id ? { ...invoice, status: 'sent' } : invoice
        )
      );
      
      return { previousInvoices };
    },
    onSuccess: () => {
      toast.success("Invoice sent successfully");
    },
    onError: (error, _variables, context) => {
      if (context?.previousInvoices) {
        utils.invoices.list.setData(undefined, context.previousInvoices);
      }
      toast.error(error.message || "Failed to send invoice");
    },
    onSettled: () => {
      utils.invoices.list.invalidate();
    },
  });

  const createPaymentLink = trpc.invoices.createPaymentLink.useMutation({
    onSuccess: (data) => {
      toast.success("Payment link created");
      utils.invoices.list.invalidate();
      // Copy to clipboard
      navigator.clipboard.writeText(data.url);
      toast.success("Payment link copied to clipboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create payment link");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const filteredInvoices = invoices?.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.client.name.toLowerCase().includes(query);
    
    const matchesStatus = statusFilter === "all" || invoice.status.toLowerCase() === statusFilter;
    
    const matchesPayment = 
      paymentFilter === "all" || 
      (invoice.paymentStatus || "unpaid") === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  // Sort the filtered invoices
  const sortedInvoices = sortData(filteredInvoices);

  // Pagination logic
  const totalItems = sortedInvoices.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Bulk selection helpers
  const currentPageIds = paginatedInvoices.map(inv => inv.id);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.has(id));
  const someCurrentPageSelected = currentPageIds.some(id => selectedIds.has(id));
  
  const toggleSelectAll = () => {
    if (allCurrentPageSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedIds);
      currentPageIds.forEach(id => newSelected.delete(id));
      setSelectedIds(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedIds);
      currentPageIds.forEach(id => newSelected.add(id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleDelete = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice.mutate({ id: invoiceToDelete.id });
    }
  };

  const confirmBulkDelete = () => {
    bulkDeleteInvoices.mutate({ ids: Array.from(selectedIds) });
  };

  const handleDownloadPDF = (invoiceId: number) => {
    generatePDF.mutate({ id: invoiceId });
  };

  const handleSendEmail = (invoiceId: number) => {
    sendEmail.mutate({ id: invoiceId });
  };

  const handleCreatePaymentLink = (invoiceId: number) => {
    createPaymentLink.mutate({ id: invoiceId });
  };

  // Export invoices to CSV
  const exportInvoicesCSV = () => {
    if (!sortedInvoices || sortedInvoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }

    // Build CSV content
    const headers = [
      "Invoice Number",
      "Client",
      "Status",
      "Payment Status",
      "Issue Date",
      "Due Date",
      "Total",
      "Currency",
    ];

    const rows = sortedInvoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.client.name,
      invoice.status,
      invoice.paymentStatus || "unpaid",
      new Date(invoice.issueDate).toLocaleDateString(),
      new Date(invoice.dueDate).toLocaleDateString(),
      parseFloat(invoice.total?.toString() || "0").toFixed(2),
      invoice.currency || "USD",
    ]);

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
    
    toast.success(`Exported ${sortedInvoices.length} invoices to CSV`);
  };

  return (
    <div className="page-wrapper">
      <Navigation />

      {/* Main Content */}
      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-header-title">Invoices</h1>
              <p className="page-header-subtitle">Manage and track all your invoices</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => exportInvoicesCSV()}
                className="gap-2 touch-target"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button onClick={() => setLocation("/invoices/create")} className="flex-1 sm:flex-none touch-target">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Invoice</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {selectedIds.size} invoice{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                <XSquare className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number or client name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => handleFilterChange(setStatusFilter, val)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={(val) => handleFilterChange(setPaymentFilter, val)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partially Paid</SelectItem>
              <SelectItem value="paid">Fully Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>
              {totalItems} invoice{totalItems !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <InvoiceListSkeleton />
            ) : !invoices || invoices.length === 0 ? (
              <div className="text-center py-12">
                <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No invoices yet</h3>
                <p className="text-muted-foreground mb-4">Create your first invoice to get started</p>
                <Button onClick={() => setLocation("/invoices/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices match your filters
              </div>
            ) : (
              <>
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
                            className={someCurrentPageSelected && !allCurrentPageSelected ? "data-[state=checked]:bg-primary/50" : ""}
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices?.map((invoice) => (
                        <TableRow 
                          key={invoice.id} 
                          className={`group ${selectedIds.has(invoice.id) ? 'bg-primary/5' : ''}`}
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
                          <TableCell>{formatDateShort(invoice.issueDate)}</TableCell>
                          <TableCell>{formatDateShort(invoice.dueDate)}</TableCell>
                          <TableCell className="font-semibold">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {formatCurrency(invoice.total, invoice.currency)}
                                {invoice.currency && invoice.currency !== 'USD' && (
                                  <CurrencyBadge code={invoice.currency} />
                                )}
                              </div>
                              {invoice.paymentStatus && invoice.paymentStatus !== 'unpaid' && (
                                <div className="text-xs text-muted-foreground">
                                  Paid: {formatCurrency(invoice.totalPaid || '0')}
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
                          <TableCell className="text-right">
                            <InvoiceActionsMenu
                              invoiceId={invoice.id}
                              invoiceNumber={invoice.invoiceNumber}
                              hasPaymentLink={!!invoice.paymentLink}
                              onView={() => setLocation(`/invoices/${invoice.id}`)}
                              onEdit={() => setLocation(`/invoices/${invoice.id}/edit`)}
                              onDownloadPDF={() => handleDownloadPDF(invoice.id)}
                              onSendEmail={() => handleSendEmail(invoice.id)}
                              onCreatePaymentLink={() => handleCreatePaymentLink(invoice.id)}
                              onDelete={() => handleDelete(invoice)}
                              isLoading={{
                                pdf: generatePDF.isPending,
                                email: sendEmail.isPending,
                                paymentLink: createPaymentLink.isPending,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {paginatedInvoices?.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className={`border rounded-lg p-4 space-y-3 ${selectedIds.has(invoice.id) ? 'border-primary bg-primary/5' : ''}`}
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
                            <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
                          </div>
                        </div>
                        <InvoiceActionsMenu
                          invoiceId={invoice.id}
                          invoiceNumber={invoice.invoiceNumber}
                          hasPaymentLink={!!invoice.paymentLink}
                          onView={() => setLocation(`/invoices/${invoice.id}`)}
                          onEdit={() => setLocation(`/invoices/${invoice.id}/edit`)}
                          onDownloadPDF={() => handleDownloadPDF(invoice.id)}
                          onSendEmail={() => handleSendEmail(invoice.id)}
                          onCreatePaymentLink={() => handleCreatePaymentLink(invoice.id)}
                          onDelete={() => handleDelete(invoice)}
                          isLoading={{
                            pdf: generatePDF.isPending,
                            email: sendEmail.isPending,
                            paymentLink: createPaymentLink.isPending,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={invoice.status} />
                          <PaymentStatusBadge status={invoice.paymentStatus || 'unpaid'} />
                        </div>
                        <div className="text-right">
                          <p className="font-semibold flex items-center gap-1 justify-end">
                            {formatCurrency(invoice.total, invoice.currency)}
                            {invoice.currency && invoice.currency !== 'USD' && (
                              <CurrencyBadge code={invoice.currency} />
                            )}
                          </p>
                          {invoice.paymentStatus && invoice.paymentStatus !== 'unpaid' && (
                            <p className="text-xs text-muted-foreground">
                              Paid: {formatCurrency(invoice.totalPaid || '0')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Issued: {formatDateShort(invoice.issueDate)}</span>
                        <span>Due: {formatDateShort(invoice.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      pageSize={pageSize}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      totalItems={totalItems}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
        isLoading={deleteInvoice.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Invoices"
        description={`Are you sure you want to delete ${selectedIds.size} invoice${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        isLoading={bulkDeleteInvoices.isPending}
      />
    </div>
  );
}
