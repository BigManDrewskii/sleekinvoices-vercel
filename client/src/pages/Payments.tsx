import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  DollarSign,
  CreditCard,
  Banknote,
  FileCheck,
  Bitcoin,
  Hash,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/PageLayout";
import { PaymentsPageSkeleton } from "@/components/skeletons";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { Currency, DateDisplay } from "@/components/ui/typography";
import { AnimatedCurrency, AnimatedInteger } from "@/components/ui/animated-number";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { FilterSection, FilterSelect } from "@/components/ui/filter-section";

// Payment type definition
type Payment = {
  id: number;
  invoiceId: number;
  userId: number;
  amount: string;
  currency: string;
  paymentMethod: "stripe" | "manual" | "bank_transfer" | "check" | "cash" | "crypto";
  stripePaymentIntentId?: string | null;
  cryptoAmount?: string | null;
  cryptoCurrency?: string | null;
  cryptoNetwork?: string | null;
  cryptoTxHash?: string | null;
  cryptoWalletAddress?: string | null;
  paymentDate: Date | string;
  receivedDate?: Date | string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export default function Payments() {
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: "",
    currency: "USD",
    paymentMethod: "manual" as "manual" | "bank_transfer" | "check" | "cash" | "crypto",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    // Crypto fields
    cryptoAmount: "",
    cryptoCurrency: "",
    cryptoNetwork: "",
    cryptoTxHash: "",
    cryptoWalletAddress: "",
  });

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Sorting with useTableSort hook
  const { sort, handleSort, sortData } = useTableSort({ defaultKey: "paymentDate", defaultDirection: "desc" });

  const { data: payments, isLoading, refetch } = trpc.payments.list.useQuery({});
  const { data: stats } = trpc.payments.getStats.useQuery();
  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      setRecordPaymentOpen(false);
      refetch();
      setFormData({
        invoiceId: "",
        amount: "",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
        cryptoAmount: "",
        cryptoCurrency: "",
        cryptoNetwork: "",
        cryptoTxHash: "",
        cryptoWalletAddress: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });

  // Filter and sort payments
  const filteredAndSortedPayments = useMemo(() => {
    if (!payments) return [];

    let result = [...payments];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((payment) =>
        payment.invoiceId.toString().includes(query) ||
        payment.notes?.toLowerCase().includes(query) ||
        payment.paymentMethod.toLowerCase().includes(query)
      );
    }

    // Apply method filter
    if (methodFilter !== "all") {
      result = result.filter((payment) => payment.paymentMethod === methodFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((payment) => payment.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const now = new Date();
      result = result.filter((payment) => {
        const paymentDate = new Date(payment.paymentDate);

        switch (dateRange) {
          case "today":
            return paymentDate.toDateString() === now.toDateString();
          case "7days":
            return paymentDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case "30days":
            return paymentDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          case "90days":
            return paymentDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          case "year":
            return paymentDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          default:
            return true;
        }
      });
    }

    // Apply sorting using useTableSort
    return sortData(result);
  }, [payments, searchQuery, methodFilter, statusFilter, dateRange, sortData]);

  // Pagination calculations
  const totalItems = filteredAndSortedPayments.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedPayments, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, methodFilter, statusFilter, dateRange]);

  const handleRecordPayment = () => {
    if (!formData.invoiceId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createPaymentMutation.mutate({
      invoiceId: parseInt(formData.invoiceId),
      amount: formData.amount,
      currency: formData.currency,
      paymentMethod: formData.paymentMethod,
      paymentDate: new Date(formData.paymentDate),
      notes: formData.notes || undefined,
      // Include crypto fields if crypto payment
      ...(formData.paymentMethod === "crypto" && {
        cryptoAmount: formData.cryptoAmount || undefined,
        cryptoCurrency: formData.cryptoCurrency || undefined,
        cryptoNetwork: formData.cryptoNetwork || undefined,
        cryptoTxHash: formData.cryptoTxHash || undefined,
        cryptoWalletAddress: formData.cryptoWalletAddress || undefined,
      }),
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "stripe":
        return <CreditCard className="h-4 w-4" />;
      case "bank_transfer":
        return <Banknote className="h-4 w-4" />;
      case "check":
        return <FileCheck className="h-4 w-4" />;
      case "crypto":
        return <Bitcoin className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number, currency: string = "USD") => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMethodFilter("all");
    setStatusFilter("all");
    setDateRange("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(searchQuery || methodFilter !== "all" || statusFilter !== "all" || dateRange !== "all");

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getBlockExplorerUrl = (txHash: string, network?: string | null) => {
    const networkLower = (network || "mainnet").toLowerCase();
    switch (networkLower) {
      case "polygon":
        return `https://polygonscan.com/tx/${txHash}`;
      case "arbitrum":
        return `https://arbiscan.io/tx/${txHash}`;
      case "optimism":
        return `https://optimistic.etherscan.io/tx/${txHash}`;
      case "bsc":
        return `https://bscscan.com/tx/${txHash}`;
      case "solana":
        return `https://solscan.io/tx/${txHash}`;
      default:
        return `https://etherscan.io/tx/${txHash}`;
    }
  };

  return (
    <PageLayout
      title="Payments"
      subtitle="Track and manage invoice payments"
      headerActions={
        <Button onClick={() => setRecordPaymentOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Record Payment</span>
          <span className="sm:hidden">Record</span>
        </Button>
      }
    >

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Received</CardDescription>
              <CardTitle className="text-2xl">
                <AnimatedCurrency amount={Number(stats.totalAmount) || 0} bold duration={900} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <AnimatedInteger value={stats.totalCount} duration={600} /> payments
              </p>
            </CardContent>
          </Card>

          {stats.byMethod.map((methodStat) => (
            <Card key={methodStat.method}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  {getPaymentMethodIcon(methodStat.method)}
                  {methodStat.method.replace("_", " ").toUpperCase()}
                </CardDescription>
                <CardTitle className="text-2xl">
                  <AnimatedCurrency amount={Number(methodStat.total) || 0} bold duration={900} delay={100} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <AnimatedInteger value={methodStat.count} duration={600} delay={100} /> payments
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters Section */}
      <FilterSection
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Search Input */}
          <div className="relative flex-1">
            <Input
              placeholder="Search by invoice ID, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Method Filter */}
          <FilterSelect label="Payment Method">
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </FilterSelect>

          {/* Status Filter */}
          <FilterSelect label="Status">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            {filteredAndSortedPayments.length} payment{filteredAndSortedPayments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PaymentsPageSkeleton />
          ) : !payments || payments.length === 0 ? (
            <EmptyState
              {...EmptyStatePresets.payments}
              action={{
                label: "Record Payment",
                onClick: () => setRecordPaymentOpen(true),
                icon: Plus,
              }}
            />
          ) : filteredAndSortedPayments.length === 0 ? (
            <EmptyState
              {...EmptyStatePresets.search}
              action={{
                label: "Clear Filters",
                onClick: clearFilters,
              }}
              size="sm"
            />
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <SortableTableHeader
                        label="Date"
                        sortKey="paymentDate"
                        currentSort={sort}
                        onSort={handleSort}
                      />
                      <TableHead>Invoice</TableHead>
                      <SortableTableHeader
                        label="Amount"
                        sortKey="amount"
                        currentSort={sort}
                        onSort={handleSort}
                      />
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow 
                        key={payment.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedPayment(payment as Payment)}
                      >
                        <TableCell className="font-medium">
                          <DateDisplay date={payment.paymentDate} format="long" />
                        </TableCell>
                        <TableCell>
                          <span className="font-numeric text-sm bg-muted/50 px-2 py-1 rounded">
                            #{payment.invoiceId}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          <Currency amount={payment.amount} currency={payment.currency} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-muted/50">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </div>
                            <span className="capitalize text-sm">
                              {payment.paymentMethod.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                          {payment.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t">
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
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                {selectedPayment && getPaymentMethodIcon(selectedPayment.paymentMethod)}
              </div>
              <div>
                <span className="text-lg">Payment Details</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  Payment #{selectedPayment?.id}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6 py-4">
              {/* Amount and Status */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    <Currency amount={selectedPayment.amount} currency={selectedPayment.currency} />
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    Invoice ID
                  </div>
                  <p className="font-numeric">#{selectedPayment.invoiceId}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" />
                    Payment Method
                  </div>
                  <p className="font-medium capitalize">{selectedPayment.paymentMethod.replace("_", " ")}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Payment Date
                  </div>
                  <p className="font-medium"><DateDisplay date={selectedPayment.paymentDate} format="long" /></p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Recorded At
                  </div>
                  <p className="font-medium"><DateDisplay date={selectedPayment.createdAt} format="long" /></p>
                </div>
              </div>

              {/* Stripe Details */}
              {selectedPayment.paymentMethod === "stripe" && selectedPayment.stripePaymentIntentId && (
                <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-[#635BFF]" />
                    Stripe Details
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Payment Intent ID</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                        {selectedPayment.stripePaymentIntentId}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => copyToClipboard(selectedPayment.stripePaymentIntentId!, "stripe")}
                      >
                        {copiedField === "stripe" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Crypto Details */}
              {selectedPayment.paymentMethod === "crypto" && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/5 to-yellow-500/5 border border-orange-500/10 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Bitcoin className="h-4 w-4 text-orange-500" />
                    Cryptocurrency Details
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPayment.cryptoAmount && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Crypto Amount</p>
                        <p className="font-numeric">
                          {parseFloat(selectedPayment.cryptoAmount).toFixed(8)} {selectedPayment.cryptoCurrency?.toUpperCase()}
                        </p>
                      </div>
                    )}
                    {selectedPayment.cryptoNetwork && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Network</p>
                        <p className="font-medium capitalize">{selectedPayment.cryptoNetwork}</p>
                      </div>
                    )}
                  </div>

                  {selectedPayment.cryptoTxHash && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted/50 px-2 py-1.5 rounded font-mono flex-1 truncate">
                          {selectedPayment.cryptoTxHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(selectedPayment.cryptoTxHash!, "txHash")}
                        >
                          {copiedField === "txHash" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          asChild
                        >
                          <a 
                            href={getBlockExplorerUrl(selectedPayment.cryptoTxHash, selectedPayment.cryptoNetwork)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedPayment.cryptoWalletAddress && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" />
                        Receiving Wallet
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted/50 px-2 py-1.5 rounded font-mono flex-1 truncate">
                          {selectedPayment.cryptoWalletAddress}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(selectedPayment.cryptoWalletAddress!, "wallet")}
                        >
                          {copiedField === "wallet" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedPayment.notes && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm p-3 rounded-lg bg-muted/30 border">
                    {selectedPayment.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPayment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Manually record a payment received for an invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceId">Invoice ID *</Label>
              <Input
                id="invoiceId"
                type="number"
                placeholder="Enter invoice ID"
                value={formData.invoiceId}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceId: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Crypto Payment Fields */}
            {formData.paymentMethod === "crypto" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Bitcoin className="h-4 w-4" />
                  Cryptocurrency Details
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cryptoAmount">Crypto Amount</Label>
                    <Input
                      id="cryptoAmount"
                      type="text"
                      placeholder="0.00000000"
                      value={formData.cryptoAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, cryptoAmount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cryptoCurrency">Crypto Currency</Label>
                    <Select
                      value={formData.cryptoCurrency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cryptoCurrency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDT">Tether (USDT)</SelectItem>
                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                        <SelectItem value="SOL">Solana (SOL)</SelectItem>
                        <SelectItem value="XRP">Ripple (XRP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cryptoNetwork">Network</Label>
                  <Select
                    value={formData.cryptoNetwork}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cryptoNetwork: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mainnet">Mainnet</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      <SelectItem value="optimism">Optimism</SelectItem>
                      <SelectItem value="bsc">BNB Chain</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cryptoTxHash">Transaction Hash</Label>
                  <Input
                    id="cryptoTxHash"
                    type="text"
                    placeholder="0x..."
                    value={formData.cryptoTxHash}
                    onChange={(e) =>
                      setFormData({ ...formData, cryptoTxHash: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cryptoWalletAddress">Receiving Wallet Address</Label>
                  <Input
                    id="cryptoWalletAddress"
                    type="text"
                    placeholder="0x... or bc1..."
                    value={formData.cryptoWalletAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, cryptoWalletAddress: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) =>
                  setFormData({ ...formData, paymentDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecordPaymentOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={createPaymentMutation.isPending}
            >
              {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
