import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { InvoiceBulkActionsBar } from "@/components/invoices/InvoiceBulkActionsBar";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { Currency, DateDisplay } from "@/components/ui/typography";
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
  Sparkles,
  Filter,
  X,
  Calendar,
  DollarSign,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FilterSection } from "@/components/ui/filter-section";
import { FilterModal } from "@/components/ui/filter-modal";
import { useState, useMemo, useRef, useEffect } from "react";
import { useTableSort } from "@/hooks/useTableSort";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { Link, useLocation, useSearch, useSearchParams } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { CurrencyBadge } from "@/components/CurrencySelector";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";
import { InvoiceExportDialog } from "@/components/InvoiceExportDialog";
import { PDFViewerModal } from "@/components/pdf/PDFViewerModal";
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
    email: string | null;
  };
  paymentLink: string | null;
  // Payment information
  totalPaid?: string;
  amountDue?: string;
  paymentStatus?: "unpaid" | "partial" | "paid";
  paymentProgress?: number;
  currency?: string;
  // QuickBooks sync status
  quickbooks?: {
    synced: boolean;
    qbInvoiceId: string | null;
    lastSyncedAt: Date | null;
  };
}

export default function Invoices() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const { sort, handleSort, sortData } = useTableSort({
    defaultKey: "invoiceNumber",
  });

  const { filters, setFilter, clearFilters, hasActiveFilters } = useUrlFilters({
    pageKey: "invoices",
    filters: [
      { key: "client", defaultValue: "all" },
      { key: "dateRange", defaultValue: "all" },
      { key: "minAmount", defaultValue: "" },
      { key: "maxAmount", defaultValue: "" },
    ],
  });

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Export dialog state
  const [showExportDialog, setShowExportDialog] = useState(false);

  // PDF viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerFileName, setPdfViewerFileName] = useState<string | null>(
    null
  );

  // Parse URL parameters for initial filter (e.g., from Dashboard quick stats)
  useEffect(() => {
    if (!searchString) return;
    const params = new URLSearchParams(searchString);
    const statusParam = params.get("status");
    if (
      statusParam &&
      ["draft", "sent", "paid", "overdue", "canceled"].includes(statusParam)
    ) {
      setStatusFilter(statusParam);
    }
  }, [searchString]);

  const { data: invoices, isLoading: invoicesLoading } =
    trpc.invoices.list.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const utils = trpc.useUtils();
  const { pushUndoAction } = useKeyboardShortcuts();

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      // Success is silent since the item is already removed from UI
    },
    onError: error => {
      utils.invoices.list.invalidate();
      toast.error(
        error.message || "Failed to delete invoice. Item has been restored."
      );
    },
  });

  const { executeDelete } = useUndoableDelete();

  const handleUndoableDelete = (invoice: Invoice) => {
    const previousInvoices = utils.invoices.list.getData();

    const undoDelete = () => {
      if (previousInvoices) {
        utils.invoices.list.setData(undefined, previousInvoices);
      } else {
        utils.invoices.list.invalidate();
      }
    };

    // Register with keyboard shortcuts context for Cmd+Z
    pushUndoAction({
      type: "delete",
      entityType: "invoice",
      description: `Delete invoice ${invoice.invoiceNumber}`,
      undo: undoDelete,
    });

    executeDelete({
      item: invoice,
      itemName: invoice.invoiceNumber,
      itemType: "invoice",
      onOptimisticDelete: () => {
        utils.invoices.list.setData(undefined, old =>
          old?.filter(inv => inv.id !== invoice.id)
        );
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
      },
      onRestore: undoDelete,
      onConfirmDelete: async () => {
        await deleteInvoice.mutateAsync({ id: invoice.id });
      },
    });
  };

  const bulkDeleteInvoices = trpc.invoices.bulkDelete.useMutation({
    // Optimistic update: immediately remove selected invoices
    onMutate: async ({ ids }) => {
      await utils.invoices.list.cancel();
      const previousInvoices = utils.invoices.list.getData();
      const idsSet = new Set(ids);

      // Optimistically remove selected invoices
      utils.invoices.list.setData(undefined, old =>
        old?.filter(invoice => !idsSet.has(invoice.id))
      );

      // Close dialog and clear selection immediately
      setBulkDeleteDialogOpen(false);
      setSelectedIds(new Set());

      return { previousInvoices, deletedCount: ids.length };
    },
    onSuccess: data => {
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
    onSuccess: data => {
      setPdfViewerUrl(data.url);
      setPdfViewerFileName(null);
      setShowPDFViewer(true);
      toast.success("PDF generated successfully");
    },
    onError: error => {
      const message = error.message || "Failed to generate PDF";
      if (
        message.includes("Storage proxy credentials") ||
        message.includes("BUILT_IN_FORGE")
      ) {
        toast.error(
          "PDF generation is not configured. Please contact support."
        );
      } else {
        toast.error(message);
      }
    },
  });

  const sendEmail = trpc.invoices.sendEmail.useMutation({
    // Optimistic update: immediately update status to Sent
    onMutate: async ({ id }) => {
      await utils.invoices.list.cancel();
      const previousInvoices = utils.invoices.list.getData();

      // Optimistically update status to Sent
      utils.invoices.list.setData(undefined, old =>
        old?.map(invoice =>
          invoice.id === id ? { ...invoice, status: "sent" } : invoice
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
    onSuccess: data => {
      toast.success("Payment link created");
      utils.invoices.list.invalidate();
      // Copy to clipboard
      navigator.clipboard.writeText(data.url);
      toast.success("Payment link copied to clipboard");
    },
    onError: error => {
      toast.error(error.message || "Failed to create payment link");
    },
  });

  // QuickBooks integration
  const { data: qbStatus } = trpc.quickbooks.getStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [syncingInvoiceId, setSyncingInvoiceId] = useState<number | null>(null);

  const syncToQuickBooks = trpc.quickbooks.syncInvoice.useMutation({
    onSuccess: (_, variables) => {
      toast.success("Invoice synced to QuickBooks");
      setSyncingInvoiceId(null);
    },
    onError: error => {
      toast.error(error.message || "Failed to sync to QuickBooks");
      setSyncingInvoiceId(null);
    },
  });

  const handleSyncToQuickBooks = (invoiceId: number) => {
    setSyncingInvoiceId(invoiceId);
    syncToQuickBooks.mutate({ invoiceId });
  };

  // Duplicate invoice mutation
  const duplicateInvoice = trpc.invoices.duplicate.useMutation({
    onSuccess: newInvoice => {
      toast.success(`Invoice duplicated as ${newInvoice.invoiceNumber}`);
      utils.invoices.list.invalidate();
      // Navigate to edit the new invoice
      setLocation(`/invoices/${newInvoice.id}/edit`);
    },
    onError: error => {
      toast.error(error.message || "Failed to duplicate invoice");
    },
  });

  const handleDuplicate = (invoiceId: number) => {
    duplicateInvoice.mutate({ id: invoiceId });
  };

  // Bulk update status mutation
  const bulkUpdateStatus = trpc.invoices.bulkUpdateStatus.useMutation({
    onSuccess: data => {
      toast.success(`${data.updatedCount} invoice(s) updated successfully`);
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} invoice(s) failed to update`);
      }
      utils.invoices.list.invalidate();
      setSelectedIds(new Set());
    },
    onError: error => {
      toast.error(error.message || "Failed to update invoices");
    },
  });

  const handleBulkUpdateStatus = (
    status: "draft" | "sent" | "paid" | "overdue" | "canceled"
  ) => {
    bulkUpdateStatus.mutate({ ids: Array.from(selectedIds), status });
  };

  // Bulk send email mutation
  const bulkSendEmail = trpc.invoices.bulkSendEmail.useMutation({
    onSuccess: data => {
      toast.success(`${data.sentCount} invoice(s) sent successfully`);
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} invoice(s) failed to send`);
      }
      utils.invoices.list.invalidate();
      setSelectedIds(new Set());
    },
    onError: error => {
      toast.error(error.message || "Failed to send invoices");
    },
  });

  const handleBulkSendEmail = () => {
    bulkSendEmail.mutate({ ids: Array.from(selectedIds) });
  };

  // Bulk create payment links mutation
  const bulkCreatePaymentLinks =
    trpc.invoices.bulkCreatePaymentLinks.useMutation({
      onSuccess: data => {
        toast.success(`${data.createdCount} payment link(s) created`);
        if (data.errors.length > 0) {
          toast.warning(`${data.errors.length} invoice(s) failed`);
        }
        utils.invoices.list.invalidate();
        setSelectedIds(new Set());
      },
      onError: error => {
        toast.error(error.message || "Failed to create payment links");
      },
    });

  const handleBulkCreatePaymentLinks = () => {
    bulkCreatePaymentLinks.mutate({ ids: Array.from(selectedIds) });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Get unique clients for filter dropdown
  const uniqueClients = useMemo(() => {
    if (!invoices) return [];
    const clients = invoices
      .map(inv => ({ id: inv.client.id, name: inv.client.name }))
      .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)
      .sort((a, b) => a.name.localeCompare(b.name));
    return clients;
  }, [invoices]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.client !== "all") count++;
    if (filters.dateRange !== "all") count++;
    if (filters.minAmount || filters.maxAmount) count++;
    return count;
  }, [filters]);

  // Build active filter chips
  const activeFilters = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      value: string;
      onRemove: () => void;
    }> = [];

    if (filters.client !== "all") {
      const client = uniqueClients.find(
        c => c.id.toString() === filters.client
      );
      chips.push({
        key: "client",
        label: "Client",
        value: client?.name || filters.client,
        onRemove: () => setFilter("client", "all"),
      });
    }

    if (filters.dateRange !== "all") {
      const dateLabels: Record<string, string> = {
        today: "Today",
        week: "Last 7 Days",
        month: "Last 30 Days",
        quarter: "Last 90 Days",
        year: "Last Year",
      };
      chips.push({
        key: "dateRange",
        label: "Date",
        value: dateLabels[filters.dateRange] || filters.dateRange,
        onRemove: () => setFilter("dateRange", "all"),
      });
    }

    if (filters.minAmount) {
      chips.push({
        key: "minAmount",
        label: "Min",
        value: `$${filters.minAmount}`,
        onRemove: () => setFilter("minAmount", ""),
      });
    }

    if (filters.maxAmount) {
      chips.push({
        key: "maxAmount",
        label: "Max",
        value: `$${filters.maxAmount}`,
        onRemove: () => setFilter("maxAmount", ""),
      });
    }

    return chips;
  }, [filters, uniqueClients, setFilter]);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter(invoice => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.client.name.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || invoice.status.toLowerCase() === statusFilter;

      const matchesPayment =
        paymentFilter === "all" ||
        (invoice.paymentStatus || "unpaid") === paymentFilter;

      // Client filter
      const matchesClient =
        filters.client === "all" ||
        invoice.client.id.toString() === filters.client;

      // Date range filter (based on issue date)
      let matchesDateRange = true;
      if (filters.dateRange !== "all") {
        const issueDate = new Date(invoice.issueDate);
        const now = new Date();
        let cutoffDate: Date;

        switch (filters.dateRange) {
          case "today":
            cutoffDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "quarter":
            cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            cutoffDate = new Date(0);
        }
        matchesDateRange = issueDate >= cutoffDate;
      }

      // Amount range filter
      let matchesAmount = true;
      const invoiceTotal = parseFloat(invoice.total?.toString() || "0");
      if (filters.minAmount) {
        const min = parseFloat(filters.minAmount);
        if (!isNaN(min)) matchesAmount = matchesAmount && invoiceTotal >= min;
      }
      if (filters.maxAmount) {
        const max = parseFloat(filters.maxAmount);
        if (!isNaN(max)) matchesAmount = matchesAmount && invoiceTotal <= max;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesClient &&
        matchesDateRange &&
        matchesAmount
      );
    });
  }, [
    invoices,
    searchQuery,
    statusFilter,
    paymentFilter,
    filters.client,
    filters.dateRange,
    filters.minAmount,
    filters.maxAmount,
  ]);

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
  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every(id => selectedIds.has(id));
  const someCurrentPageSelected = currentPageIds.some(id =>
    selectedIds.has(id)
  );

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
      handleUndoableDelete(invoiceToDelete);
    }
  };

  const confirmBulkDelete = () => {
    bulkDeleteInvoices.mutate({ ids: Array.from(selectedIds) });
  };

  const handleDownloadPDF = (invoiceId: number) => {
    generatePDF.mutate({ id: invoiceId });
  };

  const handleViewPDF = (invoiceId: number, invoiceNumber: string) => {
    generatePDF.mutate({ id: invoiceId });
    setPdfViewerFileName(`Invoice-${invoiceNumber}.pdf`);
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

    const rows = sortedInvoices.map(invoice => [
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
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
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
      <main
        id="main-content"
        className="page-content page-transition"
        role="main"
        aria-label="Invoices"
      >
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-header-title">Invoices</h1>
              <p className="page-header-subtitle">
                Manage and track all your invoices
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
                className="gap-2 touch-target"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/invoices/guided")}
                className="gap-2 touch-target border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5"
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="hidden sm:inline">Guided</span>
              </Button>
              <Button
                onClick={() => setLocation("/invoices/create")}
                className="flex-1 sm:flex-none touch-target"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">New Invoice</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>

        <InvoiceBulkActionsBar
          selectedIds={selectedIds}
          clearSelection={clearSelection}
          handleBulkSendEmail={handleBulkSendEmail}
          handleBulkCreatePaymentLinks={handleBulkCreatePaymentLinks}
          handleBulkUpdateStatus={handleBulkUpdateStatus}
          setBulkDeleteDialogOpen={setBulkDeleteDialogOpen}
          bulkSendEmail={bulkSendEmail}
          bulkCreatePaymentLinks={bulkCreatePaymentLinks}
          bulkUpdateStatus={bulkUpdateStatus}
        />

        <InvoiceTable
          invoices={paginatedInvoices}
          selectedIds={selectedIds}
          allCurrentPageSelected={allCurrentPageSelected}
          someCurrentPageSelected={someCurrentPageSelected}
          toggleSelectAll={toggleSelectAll}
          toggleSelect={toggleSelect}
          sort={sort}
          handleSort={handleSort}
          totalItems={totalItems}
          qbStatus={qbStatus}
          onView={(invoice) => window.location.assign(`/invoices/${invoice.id}`)}
          onEdit={(invoice) => window.location.assign(`/invoices/${invoice.id}/edit`)}
          onDelete={(invoice) => handleDelete(invoice as unknown as Invoice)}
          onDuplicate={(invoice) => handleDuplicate(invoice.id)}
          onDownloadPDF={(invoice) => handleDownloadPDF(invoice.id)}
          onSendEmail={(invoice) => handleSendEmail(invoice.id)}
          onCreatePaymentLink={(invoice) => handleCreatePaymentLink(invoice.id)}
          isLoading={{
            pdf: generatePDF.isPending,
            email: sendEmail.isPending,
            paymentLink: createPaymentLink.isPending,
            duplicate: duplicateInvoice.isPending,
          }}
          syncingInvoiceId={syncingInvoiceId}
        />

        {/* Filters */}
        <FilterSection
          searchValue={searchQuery}
          onSearchChange={val => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by invoice number or client name..."
          activeFilters={activeFilters}
          onClearAll={hasActiveFilters ? clearFilters : undefined}
        >
          <Select
            value={statusFilter}
            onValueChange={val => handleFilterChange(setStatusFilter, val)}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
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
          <Select
            value={paymentFilter}
            onValueChange={val => handleFilterChange(setPaymentFilter, val)}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Fully Paid</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={filterModalOpen ? "secondary" : "outline"}
            onClick={() => setFilterModalOpen(true)}
            className="gap-2"
            aria-label={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </FilterSection>

        {/* Filter Modal */}
        <FilterModal
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          title="Invoice Filters"
          fields={[
            {
              key: "client",
              label: "Client",
              type: "select",
              options: [
                { value: "all", label: "All Clients" },
                ...uniqueClients.map(c => ({
                  value: c.id.toString(),
                  label: c.name,
                })),
              ],
            },
            {
              key: "dateRange",
              label: "Date Range",
              type: "select",
              options: [
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "week", label: "Last 7 Days" },
                { value: "month", label: "Last 30 Days" },
                { value: "quarter", label: "Last 90 Days" },
                { value: "year", label: "Last Year" },
              ],
            },
            {
              key: "minAmount",
              label: "Min Amount",
              type: "number",
              placeholder: "0.00",
            },
            {
              key: "maxAmount",
              label: "Max Amount",
              type: "number",
              placeholder: "No limit",
            },
          ]}
          values={filters}
          onChange={setFilter}
          onClear={clearFilters}
        />

        {/* Invoices Table */}
        <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm overflow-hidden">
          <div className="p-5 pb-4">
            <h3 className="text-lg font-semibold text-foreground">
              All Invoices
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-numeric">{totalItems}</span> invoice
              {totalItems !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="px-5 pb-5">
            {invoicesLoading ? (
              <InvoiceListSkeleton />
            ) : !invoices || invoices.length === 0 ? (
              <EmptyState
                {...EmptyStatePresets.invoices}
                action={{
                  label: "Create Invoice",
                  onClick: () => setLocation("/invoices/create"),
                  icon: Plus,
                }}
              />
            ) : filteredInvoices.length === 0 ? (
              <EmptyState {...EmptyStatePresets.search} size="sm" />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto -mx-5 sm:mx-0">
                  <div className="min-w-[900px] px-5 sm:px-0">
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
                          <TableHead className="w-[60px] text-center">
                            QB
                          </TableHead>
                        )}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices?.map(invoice => (
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
                            <InvoiceNumberCell
                              invoiceNumber={invoice.invoiceNumber}
                            />
                          </TableCell>
                          <TableCell>{invoice.client.name}</TableCell>
                          <TableCell>
                            <DateDisplay
                              date={invoice.issueDate}
                              format="short"
                            />
                          </TableCell>
                          <TableCell>
                            <DateDisplay
                              date={invoice.dueDate}
                              format="short"
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Currency
                                  amount={invoice.total}
                                  currency={invoice.currency}
                                />
                                {invoice.currency &&
                                  invoice.currency !== "USD" && (
                                    <CurrencyBadge code={invoice.currency} />
                                  )}
                              </div>
                              {invoice.paymentStatus &&
                                invoice.paymentStatus !== "unpaid" && (
                                  <div className="text-xs text-muted-foreground">
                                    Paid:{" "}
                                    <Currency
                                      amount={invoice.totalPaid || "0"}
                                    />
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {invoice.paymentStatus ? (
                              <PaymentStatusBadge
                                status={invoice.paymentStatus}
                              />
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
                                            className="w-4 h-4 text-emerald-500"
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
                                    {invoice.quickbooks?.synced ? (
                                      <div className="text-xs">
                                        <div className="font-medium">
                                          Synced to QuickBooks
                                        </div>
                                        {invoice.quickbooks.lastSyncedAt && (
                                          <div className="text-muted-foreground">
                                            {new Date(
                                              invoice.quickbooks.lastSyncedAt
                                            ).toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span>Not synced to QuickBooks</span>
                                    )}
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
                              onView={() =>
                                setLocation(`/invoices/${invoice.id}`)
                              }
                              onEdit={() =>
                                setLocation(`/invoices/${invoice.id}/edit`)
                              }
                              onDownloadPDF={() =>
                                handleDownloadPDF(invoice.id)
                              }
                              onViewPDF={() =>
                                handleViewPDF(invoice.id, invoice.invoiceNumber)
                              }
                              onSendEmail={() => handleSendEmail(invoice.id)}
                              onCreatePaymentLink={() =>
                                handleCreatePaymentLink(invoice.id)
                              }
                              onDelete={() => handleDelete(invoice)}
                              onDuplicate={() => handleDuplicate(invoice.id)}
                              onSyncToQuickBooks={() =>
                                handleSyncToQuickBooks(invoice.id)
                              }
                              quickBooksConnected={qbStatus?.connected || false}
                              isLoading={{
                                pdf: generatePDF.isPending,
                                email: sendEmail.isPending,
                                paymentLink: createPaymentLink.isPending,
                                duplicate: duplicateInvoice.isPending,
                                quickBooksSync: syncingInvoiceId === invoice.id,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {paginatedInvoices?.map(invoice => (
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
                            <InvoiceNumberCell
                              invoiceNumber={invoice.invoiceNumber}
                            />
                            <p className="text-sm text-muted-foreground">
                              {invoice.client.name}
                            </p>
                          </div>
                        </div>
                        <InvoiceActionsMenu
                          invoiceId={invoice.id}
                          invoiceNumber={invoice.invoiceNumber}
                          hasPaymentLink={!!invoice.paymentLink}
                          onView={() => setLocation(`/invoices/${invoice.id}`)}
                          onEdit={() =>
                            setLocation(`/invoices/${invoice.id}/edit`)
                          }
                          onDownloadPDF={() => handleDownloadPDF(invoice.id)}
                          onViewPDF={() =>
                            handleViewPDF(invoice.id, invoice.invoiceNumber)
                          }
                          onSendEmail={() => handleSendEmail(invoice.id)}
                          onCreatePaymentLink={() =>
                            handleCreatePaymentLink(invoice.id)
                          }
                          onDelete={() => handleDelete(invoice)}
                          onDuplicate={() => handleDuplicate(invoice.id)}
                          onSyncToQuickBooks={() =>
                            handleSyncToQuickBooks(invoice.id)
                          }
                          quickBooksConnected={qbStatus?.connected || false}
                          isLoading={{
                            pdf: generatePDF.isPending,
                            email: sendEmail.isPending,
                            paymentLink: createPaymentLink.isPending,
                            duplicate: duplicateInvoice.isPending,
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
                          {qbStatus?.connected &&
                            invoice.quickbooks?.synced && (
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
                                    <span className="text-xs">
                                      Synced to QuickBooks
                                    </span>
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
                                Paid:{" "}
                                <Currency amount={invoice.totalPaid || "0"} />
                              </p>
                            )}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>
                          Issued:{" "}
                          <DateDisplay
                            date={invoice.issueDate}
                            format="short"
                          />
                        </span>
                        <span>
                          Due:{" "}
                          <DateDisplay date={invoice.dueDate} format="short" />
                        </span>
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
                      onPageSizeChange={size => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      totalItems={totalItems}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

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
        description={`Are you sure you want to delete ${selectedIds.size} invoice${selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.`}
        isLoading={bulkDeleteInvoices.isPending}
      />

      {/* Export Dialog */}
      <InvoiceExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        invoices={sortedInvoices}
      />

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        open={showPDFViewer}
        onOpenChange={setShowPDFViewer}
        pdfUrl={pdfViewerUrl || ""}
        fileName={pdfViewerFileName || undefined}
      />
    </div>
  );
}
