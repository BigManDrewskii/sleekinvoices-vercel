import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useState } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const { sort, handleSort, sortData } = useTableSort({ defaultKey: "invoiceNumber" });

  const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  
  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      utils.invoices.list.invalidate();
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete invoice");
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
    onSuccess: () => {
      toast.success("Invoice sent successfully");
      utils.invoices.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invoice");
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

  const handleDownloadPDF = (invoiceId: number) => {
    generatePDF.mutate({ id: invoiceId });
  };

  const handleSendEmail = (invoiceId: number) => {
    sendEmail.mutate({ id: invoiceId });
  };

  const handleCreatePaymentLink = (invoiceId: number) => {
    createPaymentLink.mutate({ id: invoiceId });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoices</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track all your invoices</p>
          </div>
          <Button onClick={() => setLocation("/invoices/create")} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

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
                        <TableRow key={invoice.id} className="group">
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
                    <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
                        </div>
                        <div className="flex gap-1">
                          <StatusBadge status={invoice.status} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Issue Date</p>
                          <p className="font-medium">{formatDateShort(invoice.issueDate)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due Date</p>
                          <p className="font-medium">{formatDateShort(invoice.dueDate)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="text-lg font-bold">{formatCurrency(invoice.total)}</p>
                          {invoice.paymentStatus && invoice.paymentStatus !== 'unpaid' && (
                            <p className="text-xs text-muted-foreground">Paid: {formatCurrency(invoice.totalPaid || '0')}</p>
                          )}
                        </div>
                        {invoice.paymentStatus ? (
                          <PaymentStatusBadge status={invoice.paymentStatus} />
                        ) : (
                          <PaymentStatusBadge status="unpaid" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/invoices/${invoice.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/invoices/${invoice.id}/edit`)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
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
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t pt-4 mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      pageSizeOptions={[10, 15, 25, 50]}
                    />
                  </div>
                )}
                {totalItems === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No invoices match your filters
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoiceToDelete?.invoiceNumber}? This action cannot be undone.`}
        isLoading={deleteInvoice.isPending}
      />
    </div>
  );
}
