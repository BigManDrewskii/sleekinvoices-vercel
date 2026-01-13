import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Currency } from "@/components/ui/typography";
import {
  FileText,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { ViewInvoicePageSkeleton } from "@/components/skeletons";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  draft: { label: "Draft", variant: "secondary", icon: FileText },
  sent: { label: "Sent", variant: "default", icon: Send },
  viewed: { label: "Viewed", variant: "outline", icon: Eye },
  accepted: { label: "Accepted", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "secondary", icon: Clock },
  converted: { label: "Converted", variant: "default", icon: ArrowRight },
};

export default function ViewEstimate() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const estimateId = parseInt(params.id || "0");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, isLoading, error } = trpc.estimates.get.useQuery(
    { id: estimateId },
    { enabled: isAuthenticated && estimateId > 0 }
  );

  const utils = trpc.useUtils();

  const deleteEstimate = trpc.estimates.delete.useMutation({
    onSuccess: () => {
      toast.success("Estimate deleted successfully");
      setLocation("/estimates");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete estimate");
    },
  });

  const convertToInvoice = trpc.estimates.convertToInvoice.useMutation({
    onSuccess: (result) => {
      toast.success(`Converted to invoice ${result.invoiceNumber}`);
      setLocation(`/invoices/${result.invoiceId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to convert estimate");
    },
  });

  const markAsSent = trpc.estimates.markAsSent.useMutation({
    onSuccess: () => {
      toast.success("Estimate marked as sent");
      utils.estimates.get.invalidate({ id: estimateId });
    },
  });

  const markAsAccepted = trpc.estimates.markAsAccepted.useMutation({
    onSuccess: () => {
      toast.success("Estimate marked as accepted");
      utils.estimates.get.invalidate({ id: estimateId });
    },
  });

  const markAsRejected = trpc.estimates.markAsRejected.useMutation({
    onSuccess: () => {
      toast.success("Estimate marked as rejected");
      utils.estimates.get.invalidate({ id: estimateId });
    },
  });

  if (loading || isLoading) {
    return <ViewInvoicePageSkeleton />;
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Estimate Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The estimate you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/estimates">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Estimates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { estimate, lineItems, client } = data;

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

  const isExpired = new Date(estimate.validUntil) < new Date() && 
    !["accepted", "rejected", "converted", "expired"].includes(estimate.status);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/estimates">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{estimate.estimateNumber}</h1>
                <p className="text-muted-foreground">
                  {estimate.title || "Estimate Details"}
                </p>
              </div>
            </div>
            {getStatusBadge(estimate.status)}
          </div>

          {/* Expiration Warning */}
          {isExpired && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-600 dark:text-yellow-400">
                This estimate has expired. Consider creating a new one or extending the validity date.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {estimate.status === "draft" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/estimates/${estimateId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsSent.mutate({ id: estimateId })}
                  disabled={markAsSent.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
              </>
            )}
            
            {(estimate.status === "sent" || estimate.status === "viewed") && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsAccepted.mutate({ id: estimateId })}
                  disabled={markAsAccepted.isPending}
                  className="text-green-600"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Accepted
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRejected.mutate({ id: estimateId })}
                  disabled={markAsRejected.isPending}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Mark as Rejected
                </Button>
              </>
            )}

            {!estimate.convertedToInvoiceId && 
              (estimate.status === "accepted" || estimate.status === "sent" || estimate.status === "viewed") && (
              <Button
                size="sm"
                onClick={() => convertToInvoice.mutate({ id: estimateId })}
                disabled={convertToInvoice.isPending}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert to Invoice
              </Button>
            )}

            {estimate.convertedToInvoiceId && (
              <Link href={`/invoices/${estimate.convertedToInvoiceId}`}>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Invoice
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Estimate Details */}
          <div className="space-y-6">
            {/* Client and Estimate Info */}
            <Card>
              <CardHeader>
                <CardTitle>Estimate Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Client</h3>
                    <p className="text-foreground">{client?.name || "Unknown"}</p>
                    {client?.companyName && (
                      <p className="text-muted-foreground">{client.companyName}</p>
                    )}
                    {client?.email && (
                      <p className="text-muted-foreground">{client.email}</p>
                    )}
                    {client?.address && (
                      <p className="text-muted-foreground whitespace-pre-line">
                        {client.address}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date</span>
                      <span className="font-medium">{formatDate(estimate.issueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valid Until</span>
                      <span className={`font-medium ${isExpired ? "text-destructive" : ""}`}>
                        {formatDate(estimate.validUntil)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency</span>
                      <span className="font-medium">{estimate.currency}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Currency amount={Number(item.rate)} currency={estimate.currency} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Currency amount={Number(item.amount)} currency={estimate.currency} bold />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <Currency amount={Number(estimate.subtotal)} currency={estimate.currency} />
                  </div>
                  {Number(estimate.discountAmount) > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>
                        Discount
                        {estimate.discountType === "percentage" && ` (${estimate.discountValue}%)`}
                      </span>
                      <span>-<Currency amount={Number(estimate.discountAmount)} currency={estimate.currency} /></span>
                    </div>
                  )}
                  {Number(estimate.taxAmount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({estimate.taxRate}%)</span>
                      <Currency amount={Number(estimate.taxAmount)} currency={estimate.currency} />
                    </div>
                  )}
                  <div className="flex justify-between text-lg pt-2 border-t">
                    <span className="font-bold">Total</span>
                    <Currency amount={Number(estimate.total)} currency={estimate.currency} bold />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            {(estimate.notes || estimate.terms) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes & Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {estimate.notes && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Notes</h4>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {estimate.notes}
                      </p>
                    </div>
                  )}
                  {estimate.terms && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Terms & Conditions</h4>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {estimate.terms}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => deleteEstimate.mutate({ id: estimateId })}
        title="Delete Estimate"
        description={`Are you sure you want to delete estimate ${estimate.estimateNumber}? This action cannot be undone.`}
        isLoading={deleteEstimate.isPending}
      />
    </div>
  );
}
