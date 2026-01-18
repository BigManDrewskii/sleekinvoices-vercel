import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Eye,
  MousePointerClick,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  Bell,
  Receipt,
  RotateCcw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { DateDisplay } from "@/components/ui/typography";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { ScrollableTableWrapper } from "@/components/ui/scrollable-table-wrapper";
import { useTableSort } from "@/hooks/useTableSort";
import { FilterSection, FilterSelect } from "@/components/ui/filter-section";
import { DataTableLoading } from "@/components/ui/data-table-empty";

// Email type definition
type EmailLog = {
  id: number;
  userId: number;
  invoiceId: number;
  recipientEmail: string;
  subject: string;
  emailType: "invoice" | "reminder" | "receipt";
  sentAt: Date | string;
  success: boolean;
  errorMessage?: string | null;
  messageId?: string | null;
  deliveryStatus?:
    | "sent"
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "complained"
    | "failed"
    | null;
  deliveredAt?: Date | string | null;
  openedAt?: Date | string | null;
  openCount?: number | null;
  clickedAt?: Date | string | null;
  clickCount?: number | null;
  bouncedAt?: Date | string | null;
  bounceType?: string | null;
  retryCount?: number | null;
  lastRetryAt?: Date | string | null;
  nextRetryAt?: Date | string | null;
};

// Status badge component
function StatusBadge({
  status,
  success,
}: {
  status?: string | null;
  success: boolean;
}) {
  if (!success) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  switch (status) {
    case "delivered":
      return (
        <Badge
          variant="default"
          className="gap-1 bg-green-500/20 text-green-400 border-green-500/30"
        >
          <CheckCircle2 className="h-3 w-3" />
          Delivered
        </Badge>
      );
    case "opened":
      return (
        <Badge
          variant="default"
          className="gap-1 bg-blue-500/20 text-blue-400 border-blue-500/30"
        >
          <Eye className="h-3 w-3" />
          Opened
        </Badge>
      );
    case "clicked":
      return (
        <Badge
          variant="default"
          className="gap-1 bg-purple-500/20 text-purple-400 border-purple-500/30"
        >
          <MousePointerClick className="h-3 w-3" />
          Clicked
        </Badge>
      );
    case "bounced":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Bounced
        </Badge>
      );
    case "complained":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Spam
        </Badge>
      );
    case "sent":
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <Send className="h-3 w-3" />
          Sent
        </Badge>
      );
  }
}

// Email type badge
function TypeBadge({ type }: { type: string }) {
  switch (type) {
    case "invoice":
      return (
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Invoice
        </Badge>
      );
    case "reminder":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-yellow-500/30 text-yellow-400"
        >
          <Bell className="h-3 w-3" />
          Reminder
        </Badge>
      );
    case "receipt":
      return (
        <Badge
          variant="outline"
          className="gap-1 border-green-500/30 text-green-400"
        >
          <Receipt className="h-3 w-3" />
          Receipt
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function EmailHistory() {
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Sorting
  const { sort, handleSort, sortData } = useTableSort({
    defaultKey: "sentAt",
    defaultDirection: "desc",
  });

  // Fetch all email logs (client-side pagination)
  const {
    data: emails,
    isLoading,
    refetch,
  } = trpc.emailHistory.list.useQuery({});

  // Fetch stats
  const { data: stats } = trpc.emailHistory.stats.useQuery();

  // Retry mutation
  const retryMutation = trpc.emailHistory.retry.useMutation({
    onSuccess: () => {
      toast.success("Email retry initiated");
      refetch();
    },
    onError: error => {
      toast.error(error.message || "Failed to retry email");
    },
  });

  // Filter and sort emails
  const filteredAndSortedEmails = useMemo(() => {
    if (!emails) return [];
    const emailList = emails.logs || [];

    let result = [...emailList];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        email =>
          email.recipientEmail?.toLowerCase().includes(query) ||
          email.subject?.toLowerCase().includes(query) ||
          email.invoiceId?.toString().includes(query)
      );
    }

    // Email type filter
    if (emailTypeFilter !== "all") {
      result = result.filter(email => email.emailType === emailTypeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(email => email.deliveryStatus === statusFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      result = result.filter(email => {
        const emailDate = new Date(email.sentAt);

        switch (dateRange) {
          case "today":
            return emailDate.toDateString() === now.toDateString();
          case "7days":
            return (
              emailDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            );
          case "30days":
            return (
              emailDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            );
          case "90days":
            return (
              emailDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            );
          case "year":
            return (
              emailDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            );
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return sortData(result);
  }, [emails, searchQuery, emailTypeFilter, statusFilter, dateRange, sortData]);

  // Pagination
  const totalItems = filteredAndSortedEmails.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedEmails = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedEmails.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedEmails, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, emailTypeFilter, statusFilter, dateRange]);

  const handleRetry = async (emailId: number) => {
    retryMutation.mutate({ id: emailId });
  };

  const openDetails = (email: EmailLog) => {
    setSelectedEmail(email);
    setDetailsOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setEmailTypeFilter("all");
    setStatusFilter("all");
    setDateRange("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    searchQuery ||
    emailTypeFilter !== "all" ||
    statusFilter !== "all" ||
    dateRange !== "all"
  );

  return (
    <PageLayout
      title="Email History"
      subtitle="Track all sent emails and their delivery status"
    >
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>Total Sent</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>Delivered</CardDescription>
              <CardTitle className="text-2xl text-green-400">
                {stats.delivered}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>Opened</CardDescription>
              <CardTitle className="text-2xl text-blue-400">
                {stats.opened}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-2xl text-destructive">
                {stats.failed}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <FilterSection
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by email or subject..."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Email Type Filter */}
          <FilterSelect label="Email Type">
            <Select value={emailTypeFilter} onValueChange={setEmailTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
              </SelectContent>
            </Select>
          </FilterSelect>

          {/* Status Filter */}
          <FilterSelect label="Delivery Status">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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

      {/* Email Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email History</CardTitle>
          <CardDescription>
            {filteredAndSortedEmails.length} email
            {filteredAndSortedEmails.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollableTableWrapper minWidth={800}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <SortableTableHeader
                  label="Type"
                  sortKey="emailType"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Status"
                  sortKey="deliveryStatus"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Sent"
                  sortKey="sentAt"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <TableHead>Opens</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <DataTableLoading colSpan={7} rows={5} />
              ) : !emails || filteredAndSortedEmails.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState {...EmptyStatePresets.emailHistory} size="sm" />
                  </td>
                </tr>
              ) : (
                paginatedEmails.map(email => (
                  <TableRow
                    key={email.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetails(email)}
                  >
                    <TableCell className="font-medium">
                      {email.recipientEmail}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {email.subject}
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={email.emailType} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={email.deliveryStatus}
                        success={email.success}
                      />
                    </TableCell>
                    <TableCell>
                      <DateDisplay date={email.sentAt} />
                    </TableCell>
                    <TableCell>
                      {email.openCount ? (
                        <span className="text-blue-400">{email.openCount}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!email.success && (email.retryCount || 0) < 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleRetry(email.id);
                          }}
                          disabled={retryMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </ScrollableTableWrapper>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-border/50 pt-4">
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
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </Card>

      {/* Email Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Email Details</DialogTitle>
            <DialogDescription className="text-base">
              Detailed tracking information for this email
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-5 px-0">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-medium">{selectedEmail.recipientEmail}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <TypeBadge type={selectedEmail.emailType} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedEmail.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge
                    status={selectedEmail.deliveryStatus}
                    success={selectedEmail.success}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sent At</p>
                  <p className="font-medium">
                    <DateDisplay date={selectedEmail.sentAt} />
                  </p>
                </div>
              </div>

              {selectedEmail.deliveredAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivered At</p>
                  <p className="font-medium">
                    <DateDisplay date={selectedEmail.deliveredAt} />
                  </p>
                </div>
              )}

              {selectedEmail.openedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      First Opened
                    </p>
                    <p className="font-medium">
                      <DateDisplay date={selectedEmail.openedAt} />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Open Count</p>
                    <p className="font-medium text-blue-400">
                      {selectedEmail.openCount || 0}
                    </p>
                  </div>
                </div>
              )}

              {selectedEmail.clickedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      First Clicked
                    </p>
                    <p className="font-medium">
                      <DateDisplay date={selectedEmail.clickedAt} />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Click Count</p>
                    <p className="font-medium text-purple-400">
                      {selectedEmail.clickCount || 0}
                    </p>
                  </div>
                </div>
              )}

              {selectedEmail.bouncedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bounced At</p>
                    <p className="font-medium">
                      <DateDisplay date={selectedEmail.bouncedAt} />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bounce Type</p>
                    <p className="font-medium text-destructive">
                      {selectedEmail.bounceType || "Unknown"}
                    </p>
                  </div>
                </div>
              )}

              {selectedEmail.errorMessage && (
                <div>
                  <p className="text-sm text-muted-foreground">Error Message</p>
                  <p className="font-medium text-destructive">
                    {selectedEmail.errorMessage}
                  </p>
                </div>
              )}

              {selectedEmail.retryCount != null &&
                selectedEmail.retryCount > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Retry Attempts
                      </p>
                      <p className="font-medium">
                        {selectedEmail.retryCount} / 3
                      </p>
                    </div>
                    {selectedEmail.nextRetryAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Next Retry
                        </p>
                        <p className="font-medium">
                          <DateDisplay date={selectedEmail.nextRetryAt} />
                        </p>
                      </div>
                    )}
                  </div>
                )}

              {selectedEmail.messageId && (
                <div>
                  <p className="text-sm text-muted-foreground">Message ID</p>
                  <p className="font-mono text-xs text-muted-foreground truncate">
                    {selectedEmail.messageId}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedEmail &&
              !selectedEmail.success &&
              (selectedEmail.retryCount ?? 0) < 3 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleRetry(selectedEmail.id);
                    setDetailsOpen(false);
                  }}
                  disabled={retryMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Email
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
