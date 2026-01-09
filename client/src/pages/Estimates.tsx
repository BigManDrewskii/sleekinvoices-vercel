import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Currency, DateDisplay } from "@/components/ui/typography";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { EstimatesPageSkeleton } from "@/components/skeletons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [estimateToDelete, setEstimateToDelete] = useState<any>(null);

  const { data: estimates, isLoading } = trpc.estimates.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();

  const pendingDeleteRef = useRef<{ timeoutId: NodeJS.Timeout; estimateId: number } | null>(null);
  
  const deleteEstimate = trpc.estimates.delete.useMutation({
    onSuccess: () => {
      // Success is silent since the item is already removed from UI
    },
    onError: (error) => {
      utils.estimates.list.invalidate();
      toast.error(error.message || "Failed to delete estimate. Item has been restored.");
    },
  });

  const handleUndoableDelete = (estimate: any) => {
    // Cancel any existing pending delete
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
      pendingDeleteRef.current = null;
    }

    // Snapshot the previous value for potential restore
    const previousEstimates = utils.estimates.list.getData();
    
    // Optimistically remove from UI immediately
    utils.estimates.list.setData(undefined, (old) => 
      old?.filter((e) => e.id !== estimate.id)
    );
    
    // Close dialog
    setDeleteDialogOpen(false);
    setEstimateToDelete(null);

    // Show undo toast
    toast(
      `Estimate "${estimate.estimateNumber}" deleted`,
      {
        description: 'Click undo to restore',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            // Cancel the pending delete
            if (pendingDeleteRef.current) {
              clearTimeout(pendingDeleteRef.current.timeoutId);
              pendingDeleteRef.current = null;
            }
            
            // Restore the estimate to UI
            if (previousEstimates) {
              utils.estimates.list.setData(undefined, previousEstimates);
            } else {
              utils.estimates.list.invalidate();
            }
            
            toast.success('Estimate restored');
          },
        },
      }
    );

    // Set timeout to permanently delete after 5 seconds
    const timeoutId = setTimeout(async () => {
      pendingDeleteRef.current = null;
      
      try {
        await deleteEstimate.mutateAsync({ id: estimate.id });
      } catch (error) {
        // Restore the estimate on error
        if (previousEstimates) {
          utils.estimates.list.setData(undefined, previousEstimates);
        } else {
          utils.estimates.list.invalidate();
        }
      }
    }, 5000);

    pendingDeleteRef.current = { timeoutId, estimateId: estimate.id };
  };

  const convertToInvoice = trpc.estimates.convertToInvoice.useMutation({
    onSuccess: (result) => {
      toast.success(`Converted to invoice ${result.invoiceNumber}`);
      utils.estimates.list.invalidate();
      setLocation(`/invoices/${result.invoiceId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to convert estimate");
    },
  });

  const markAsSent = trpc.estimates.markAsSent.useMutation({
    // Optimistic update: immediately update status
    onMutate: async ({ id }) => {
      await utils.estimates.list.cancel();
      const previousEstimates = utils.estimates.list.getData();
      
      utils.estimates.list.setData(undefined, (old) => 
        old?.map((estimate) => 
          estimate.id === id ? { ...estimate, status: 'sent' } : estimate
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
      
      utils.estimates.list.setData(undefined, (old) => 
        old?.map((estimate) => 
          estimate.id === id ? { ...estimate, status: 'accepted' } : estimate
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
      
      utils.estimates.list.setData(undefined, (old) => 
        old?.map((estimate) => 
          estimate.id === id ? { ...estimate, status: 'rejected' } : estimate
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
        <div className="opacity-70"><GearLoader size="md" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const filteredEstimates = estimates?.filter((estimate) => {
    const query = searchQuery.toLowerCase();
    return (
      estimate.estimateNumber.toLowerCase().includes(query) ||
      estimate.clientName?.toLowerCase().includes(query) ||
      estimate.title?.toLowerCase().includes(query)
    );
  });

  const handleDelete = (estimate: any) => {
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Estimates</h1>
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search estimates by number, client, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Estimates Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Estimates</CardTitle>
            <CardDescription>
              {filteredEstimates?.length || 0} estimate{filteredEstimates?.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <EstimatesPageSkeleton />
            ) : !estimates || estimates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No estimates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first estimate to get started
                </p>
                <Link href="/estimates/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Estimate
                  </Button>
                </Link>
              </div>
            ) : filteredEstimates?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No estimates match your search
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estimate #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEstimates?.map((estimate) => (
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
                          <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                          <TableCell>{formatDate(estimate.validUntil)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(Number(estimate.total), estimate.currency)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLocation(`/estimates/${estimate.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {estimate.status === "draft" && (
                                  <DropdownMenuItem onClick={() => setLocation(`/estimates/${estimate.id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {estimate.status === "draft" && (
                                  <DropdownMenuItem onClick={() => markAsSent.mutate({ id: estimate.id })}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                {(estimate.status === "sent" || estimate.status === "viewed") && (
                                  <>
                                    <DropdownMenuItem onClick={() => markAsAccepted.mutate({ id: estimate.id })}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark as Accepted
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => markAsRejected.mutate({ id: estimate.id })}>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Mark as Rejected
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(estimate.status === "accepted" || estimate.status === "sent" || estimate.status === "viewed") && !estimate.convertedToInvoiceId && (
                                  <DropdownMenuItem 
                                    onClick={() => convertToInvoice.mutate({ id: estimate.id })}
                                    className="text-primary"
                                  >
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                    Convert to Invoice
                                  </DropdownMenuItem>
                                )}
                                {estimate.convertedToInvoiceId && (
                                  <DropdownMenuItem onClick={() => setLocation(`/invoices/${estimate.convertedToInvoiceId}`)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Invoice
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(estimate)}
                                  className="text-red-600"
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
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredEstimates?.map((estimate) => (
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
                          <p className="text-sm text-muted-foreground">{estimate.clientName}</p>
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
                        <span className="font-medium">
                          {formatCurrency(Number(estimate.total), estimate.currency)}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/estimates/${estimate.id}`)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!estimate.convertedToInvoiceId && (estimate.status === "accepted" || estimate.status === "sent" || estimate.status === "viewed") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => convertToInvoice.mutate({ id: estimate.id })}
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
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
