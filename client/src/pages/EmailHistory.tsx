import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search, 
  Filter,
  X,
  RefreshCw,
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
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { DateDisplay } from "@/components/ui/typography";
import { DataTableEmpty, DataTableLoading } from "@/components/ui/data-table-empty";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

const ITEMS_PER_PAGE = 20;

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
  deliveryStatus?: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "failed" | null;
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
function StatusBadge({ status, success }: { status?: string | null; success: boolean }) {
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
        <Badge variant="default" className="gap-1 bg-green-500/20 text-green-400 border-green-500/30">
          <CheckCircle2 className="h-3 w-3" />
          Delivered
        </Badge>
      );
    case "opened":
      return (
        <Badge variant="default" className="gap-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
          <Eye className="h-3 w-3" />
          Opened
        </Badge>
      );
    case "clicked":
      return (
        <Badge variant="default" className="gap-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
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
        <Badge variant="outline" className="gap-1 border-yellow-500/30 text-yellow-400">
          <Bell className="h-3 w-3" />
          Reminder
        </Badge>
      );
    case "receipt":
      return (
        <Badge variant="outline" className="gap-1 border-green-500/30 text-green-400">
          <Receipt className="h-3 w-3" />
          Receipt
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function EmailHistory() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch email logs
  const { data, isLoading, refetch } = trpc.emailHistory.list.useQuery({
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
    emailType: emailTypeFilter !== "all" ? emailTypeFilter as "invoice" | "reminder" | "receipt" : undefined,
    deliveryStatus: statusFilter !== "all" ? statusFilter as any : undefined,
    search: searchQuery || undefined,
  });

  // Fetch stats
  const { data: stats } = trpc.emailHistory.stats.useQuery();

  // Retry mutation
  const retryMutation = trpc.emailHistory.retry.useMutation({
    onSuccess: () => {
      toast.success("Email retry initiated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to retry email");
    },
  });

  const emails = data?.logs || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
    setPage(0);
  };

  const hasActiveFilters = searchQuery || emailTypeFilter !== "all" || statusFilter !== "all";

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
              <CardTitle className="text-2xl text-green-400">{stats.delivered}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>Opened</CardDescription>
              <CardTitle className="text-2xl text-blue-400">{stats.opened}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-2xl text-red-400">{stats.failed}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or subject..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            
            <Select value={emailTypeFilter} onValueChange={(v) => { setEmailTypeFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Email Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
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

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opens</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <DataTableLoading colSpan={7} rows={5} />
              ) : emails.length === 0 ? (
                hasActiveFilters ? (
                  <DataTableEmpty
                    colSpan={7}
                    title="No matching emails"
                    description="No emails match your current filters"
                    illustration="/sleeky/empty-states/search-results.png"
                    action={{
                      label: "Clear Filters",
                      onClick: clearFilters,
                    }}
                  />
                ) : (
                  <DataTableEmpty
                    colSpan={7}
                    preset="emailHistory"
                  />
                )
              ) : (
                emails.map((email) => (
                  <TableRow key={email.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetails(email)}>
                    <TableCell className="font-medium">{email.recipientEmail}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{email.subject}</TableCell>
                    <TableCell><TypeBadge type={email.emailType} /></TableCell>
                    <TableCell><StatusBadge status={email.deliveryStatus} success={email.success} /></TableCell>
                    <TableCell><DateDisplay date={email.sentAt} /></TableCell>
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
                          onClick={(e) => {
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
        </CardContent>

        {/* Pagination */}
        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setPage}
        />
      </Card>

      {/* Email Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              Detailed tracking information for this email
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-medium">{selectedEmail.recipientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <TypeBadge type={selectedEmail.emailType} />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium">{selectedEmail.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedEmail.deliveryStatus} success={selectedEmail.success} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sent At</p>
                  <p className="font-medium"><DateDisplay date={selectedEmail.sentAt} /></p>
                </div>
              </div>

              {selectedEmail.deliveredAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivered At</p>
                  <p className="font-medium"><DateDisplay date={selectedEmail.deliveredAt} /></p>
                </div>
              )}

              {selectedEmail.openedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Opened</p>
                    <p className="font-medium"><DateDisplay date={selectedEmail.openedAt} /></p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Open Count</p>
                    <p className="font-medium text-blue-400">{selectedEmail.openCount || 0}</p>
                  </div>
                </div>
              )}

              {selectedEmail.clickedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Clicked</p>
                    <p className="font-medium"><DateDisplay date={selectedEmail.clickedAt} /></p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Click Count</p>
                    <p className="font-medium text-purple-400">{selectedEmail.clickCount || 0}</p>
                  </div>
                </div>
              )}

              {selectedEmail.bouncedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bounced At</p>
                    <p className="font-medium"><DateDisplay date={selectedEmail.bouncedAt} /></p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bounce Type</p>
                    <p className="font-medium text-red-400">{selectedEmail.bounceType || 'Unknown'}</p>
                  </div>
                </div>
              )}

              {selectedEmail.errorMessage && (
                <div>
                  <p className="text-sm text-muted-foreground">Error Message</p>
                  <p className="font-medium text-red-400">{selectedEmail.errorMessage}</p>
                </div>
              )}

              {selectedEmail.retryCount != null && selectedEmail.retryCount > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Retry Attempts</p>
                    <p className="font-medium">{selectedEmail.retryCount} / 3</p>
                  </div>
                  {selectedEmail.nextRetryAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Next Retry</p>
                      <p className="font-medium"><DateDisplay date={selectedEmail.nextRetryAt} /></p>
                    </div>
                  )}
                </div>
              )}

              {selectedEmail.messageId && (
                <div>
                  <p className="text-sm text-muted-foreground">Message ID</p>
                  <p className="font-mono text-xs text-muted-foreground truncate">{selectedEmail.messageId}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedEmail && !selectedEmail.success && ((selectedEmail.retryCount ?? 0) < 3) && (
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
            <Button variant="default" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
