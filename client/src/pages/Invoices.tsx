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
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

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
}

export default function Invoices() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

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
  });

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
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
                <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-6" />
              </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              <Link href="/invoices" className="text-sm font-medium text-foreground">Invoices</Link>
              <Link href="/clients" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Clients
                </Link>
              <Link href="/analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {user?.name || "Settings"}
              </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">Manage and track all your invoices</p>
          </div>
          <Button onClick={() => setLocation("/invoices/create")}>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
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
              {filteredInvoices?.length || 0} invoice{filteredInvoices?.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
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
            ) : filteredInvoices && filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices match your filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices?.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.client.name}</TableCell>
                        <TableCell>{formatDateShort(invoice.issueDate)}</TableCell>
                        <TableCell>{formatDateShort(invoice.dueDate)}</TableCell>
                        <TableCell className="font-semibold">
                          <div className="space-y-1">
                            <div>{formatCurrency(invoice.total)}</div>
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
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/invoices/${invoice.id}`)}
                              title="View invoice"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/invoices/${invoice.id}/edit`)}
                              title="Edit invoice"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPDF(invoice.id)}
                              disabled={generatePDF.isPending}
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendEmail(invoice.id)}
                              disabled={sendEmail.isPending}
                              title="Send email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            {!invoice.paymentLink && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCreatePaymentLink(invoice.id)}
                                disabled={createPaymentLink.isPending}
                                title="Create payment link"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(invoice)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
