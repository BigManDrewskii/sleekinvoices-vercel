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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import type { LucideIcon } from "lucide-react";
import type { Estimate, EstimateWithClient } from "@shared/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Currency, DateDisplay } from "@/components/ui/typography";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  MoreHorizontal,
} from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { EstimatesPageSkeleton } from "@/components/skeletons";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { ScrollableTableWrapper } from "@/components/ui/scrollable-table-wrapper";
import { useTableSort } from "@/hooks/useTableSort";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { FilterSection, FilterSelect } from "@/components/ui/filter-section";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: LucideIcon;
  }
> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  sent: { label: "Sent", variant: "default", icon: Send },
  viewed: { label: "Viewed", variant: "outline", icon: Eye },
  accepted: { label: "Accepted", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "secondary", icon: Clock },
  converted: { label: "Converted", variant: "default", icon: ArrowRight },
};

export default function Estimates() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] =
    useState<EstimateWithClient | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting
  const { sort, handleSort, sortData } = useTableSort({
    defaultKey: "issueDate",
    defaultDirection: "desc",
  });

  const { data: estimates, isLoading } = trpc.estimates.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const utils = trpc.useUtils();

  const deleteEstimate = trpc.estimates.delete.useMutation({
    onSuccess: () => {
      // Success is silent since the item is already removed from UI
    },
    onError: error => {
      utils.estimates.list.invalidate();
      toast.error(
        error.message || "Failed to delete estimate. Item has been restored."
      );
    },
  });

  const { executeDelete } = useUndoableDelete();

  const handleUndoableDelete = (estimate: EstimateWithClient) => {
    const previousEstimates = utils.estimates.list.getData();

    executeDelete({
      item: estimate,
      itemName: estimate.estimateNumber,
      itemType: "estimate",
      onOptimisticDelete: () => {
        utils.estimates.list.setData(undefined, old =>
          old?.filter(e => e.id !== estimate.id)
        );
        setDeleteDialogOpen(false);
        setEstimateToDelete(null);
      },
      onRestore: () => {
        if (previousEstimates) {
          utils.estimates.list.setData(undefined, previousEstimates);
        } else {
          utils.estimates.list.invalidate();
        }
      },
      onConfirmDelete: async () => {
        await deleteEstimate.mutateAsync({ id: estimate.id });
      },
    });
  };

  const convertToInvoice = trpc.estimates.convertToInvoice.useMutation({
    onSuccess: result => {
      toast.success(`Converted to invoice ${result.invoiceNumber}`);
      utils.estimates.list.invalidate();
      setLocation(`/invoices/${result.invoiceId}`);
    },
    onError: error => {
      toast.error(error.message || "Failed to convert estimate");
    },
  });

  const markAsSent = trpc.estimates.markAsSent.useMutation({
    // Optimistic update: immediately update status
    onMutate: async ({ id }) => {
      await utils.estimates.list.cancel();
      const previousEstimates = utils.estimates.list.getData();

      utils.estimates.list.setData(undefined, old =>
        old?.map(estimate =>
          estimate.id === id ? { ...estimate, status: "sent" } : estimate
        )
      );

      return { previousEstimates };
    },
    onSuccess: () => {
      toast.success("Estimate marked as sent");
    },
    onError: (_error, _variables, context) => {
      if (context?.previousEstimates) {
        utils.estimates.list.setData(undefined, context.previousEstimates);
      }
    },
    onSettled: () => {
      utils.estimates.list.invalidate();
    },
  });

  const markAsAccepted = trpc.estimates.markAsAccepted.useMutation({
    // Optimistic update: immediately update status
    onMutate: async ({ id }) => {
      await utils.estimates.list.cancel();
      const previousEstimates = utils.estimates.list.getData();

      utils.estimates.list.setData(undefined, old =>
        old?.map(estimate =>
          estimate.id === id ? { ...estimate, status: "accepted" } : estimate
        )
      );

      return { previousEstimates };
    },
    onSuccess: () => {
      toast.success("Estimate marked as accepted");
    },
    onError: (_error, _variables, context) => {
      if (context?.previousEstimates) {
        utils.estimates.list.setData(undefined, context.previousEstimates);
      }
    },
    onSettled: () => {
      utils.estimates.list.invalidate();
    },
  });

  const markAsRejected = trpc.estimates.markAsRejected.useMutation({
    // Optimistic update: immediately update status
    onMutate: async ({ id }) => {
      await utils.estimates.list.cancel();
      const previousEstimates = utils.estimates.list.getData();

      utils.estimates.list.setData(undefined, old =>
        old?.map(estimate =>
          estimate.id === id ? { ...estimate, status: "rejected" } : estimate
        )
      );

      return { previousEstimates };
    },
    onSuccess: () => {
      toast.success("Estimate marked as rejected");
    },
    onError: (_error, _variables, context) => {
      if (context?.previousEstimates) {
        utils.estimates.list.setData(undefined, context.previousEstimates);
      }
    },
    onSettled: () => {
      utils.estimates.list.invalidate();
    },
  });

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

  // Filter, sort, and paginate estimates
  const filteredAndSortedEstimates = useMemo(() => {
    if (!estimates) return [];

    let result = [...estimates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        estimate =>
          estimate.estimateNumber.toLowerCase().includes(query) ||
          estimate.clientName?.toLowerCase().includes(query) ||
          estimate.title?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(estimate => estimate.status === statusFilter);
    }

    // Date range filter (by issue date)
    if (dateRange !== "all") {
      const now = new Date();
      result = result.filter(estimate => {
        const estimateDate = new Date(estimate.issueDate);

        switch (dateRange) {
          case "today":
            return estimateDate.toDateString() === now.toDateString();
          case "7days":
            return (
              estimateDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            );
          case "30days":
            return (
              estimateDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            );
          case "90days":
            return (
              estimateDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            );
          case "year":
            return (
              estimateDate >=
              new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            );
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return sortData(result);
  }, [estimates, searchQuery, statusFilter, dateRange, sortData]);

  // Pagination
  const totalItems = filteredAndSortedEstimates.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedEstimates = filteredAndSortedEstimates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    searchQuery ||
    statusFilter !== "all" ||
    dateRange !== "all"
  );

  const handleDelete = (estimate: EstimateWithClient) => {
    setEstimateToDelete(estimate);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (estimateToDelete) {
      handleUndoableDelete(estimateToDelete);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Estimates
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create quotes and convert them to invoices
            </p>
          </div>
          <Link href="/estimates/create">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Estimate
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <FilterSection
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search estimates by number, client, or title..."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {/* Status Filter */}
            <FilterSelect label="Status">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </FilterSelect>

            {/* Date Range Filter */}
            <FilterSelect label="Date Range">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </FilterSelect>
          </div>
        </FilterSection>

        {/* Estimates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Estimates</CardTitle>
            <CardDescription>
              <span className="font-numeric">
                {filteredAndSortedEstimates.length}
              </span>{" "}
              estimate{filteredAndSortedEstimates.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EstimatesPageSkeleton />
            ) : !estimates || estimates.length === 0 ? (
              <EmptyState
                {...EmptyStatePresets.estimates}
                action={{
                  label: "Create Estimate",
                  onClick: () => setLocation("/estimates/create"),
                  icon: Plus,
                }}
              />
            ) : filteredAndSortedEstimates.length === 0 ? (
              <EmptyState {...EmptyStatePresets.search} size="sm" />
            ) : (
              <>
                {/* Desktop Table */}
                <ScrollableTableWrapper minWidth={850} className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHeader
                          label="Estimate #"
                          sortKey="estimateNumber"
                          currentSort={sort}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Client"
                          sortKey="clientName"
                          currentSort={sort}
                          onSort={handleSort}
                        />
                        <TableHead>Title</TableHead>
                        <SortableTableHeader
                          label="Status"
                          sortKey="status"
                          currentSort={sort}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Valid Until"
                          sortKey="validUntil"
                          currentSort={sort}
                          onSort={handleSort}
                        />
                        <SortableTableHeader
                          label="Amount"
                          sortKey="total"
                          currentSort={sort}
                          onSort={handleSort}
                          align="right"
                        />
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEstimates.map(estimate => (
                        <TableRow key={estimate.id}>
                          <TableCell className="font-medium">
                            <Link href={`/estimates/${estimate.id}`}>
                              <span className="text-primary hover:underline cursor-pointer">
                                {estimate.estimateNumber}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>{estimate.clientName || "—"}</TableCell>
                          <TableCell>{estimate.title || "—"}</TableCell>
                          <TableCell>
                            {getStatusBadge(estimate.status)}
                          </TableCell>
                          <TableCell>
                            {formatDate(estimate.validUntil)}
                          </TableCell>
                          <TableCell className="text-right font-numeric">
                            {formatCurrency(
                              Number(estimate.total),
                              estimate.currency
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="More actions for this estimate"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setLocation(`/estimates/${estimate.id}`)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {estimate.status === "draft" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setLocation(
                                        `/estimates/${estimate.id}/edit`
                                      )
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {estimate.status === "draft" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      markAsSent.mutate({ id: estimate.id })
                                    }
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                {(estimate.status === "sent" ||
                                  estimate.status === "viewed") && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        markAsAccepted.mutate({
                                          id: estimate.id,
                                        })
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Accepted
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        markAsRejected.mutate({
                                          id: estimate.id,
                                        })
                                      }
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Mark as Rejected
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(estimate.status === "accepted" ||
                                  estimate.status === "sent" ||
                                  estimate.status === "viewed") &&
                                  !estimate.convertedToInvoiceId && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        convertToInvoice.mutate({
                                          id: estimate.id,
                                        })
                                      }
                                      className="text-primary"
                                    >
                                      <ArrowRight className="h-4 w-4 mr-2" />
                                      Convert to Invoice
                                    </DropdownMenuItem>
                                  )}
                                {estimate.convertedToInvoiceId && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setLocation(
                                        `/invoices/${estimate.convertedToInvoiceId}`
                                      )
                                    }
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Invoice
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(estimate)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollableTableWrapper>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {paginatedEstimates.map(estimate => (
                    <div
                      key={estimate.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/estimates/${estimate.id}`}>
                            <span className="font-medium text-primary hover:underline cursor-pointer">
                              {estimate.estimateNumber}
                            </span>
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {estimate.clientName}
                          </p>
                        </div>
                        {getStatusBadge(estimate.status)}
                      </div>
                      {estimate.title && (
                        <p className="text-sm">{estimate.title}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Valid until {formatDate(estimate.validUntil)}
                        </span>
                        <span className="font-numeric">
                          {formatCurrency(
                            Number(estimate.total),
                            estimate.currency
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setLocation(`/estimates/${estimate.id}`)
                          }
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!estimate.convertedToInvoiceId &&
                          (estimate.status === "accepted" ||
                            estimate.status === "sent" ||
                            estimate.status === "viewed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                convertToInvoice.mutate({ id: estimate.id })
                              }
                              className="flex-1 text-primary"
                            >
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Convert
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(estimate)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 pt-4 border-t border-border/20">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={size => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      pageSizeOptions={[10, 25, 50, 100]}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Estimate"
        description={`Are you sure you want to delete estimate ${estimateToDelete?.estimateNumber}? This action cannot be undone.`}
        isLoading={deleteEstimate.isPending}
      />
    </div>
  );
}
