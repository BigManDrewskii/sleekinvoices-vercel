import { useAuth } from "@/_core/hooks/useAuth";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Currency, DateDisplay } from "@/components/ui/typography";
import {
  FileText,
  Edit,
  Trash2,
  Download,
  Mail,
  Link as LinkIcon,
  CheckCircle,
  ArrowLeft,
  Eye,
  Bitcoin,
} from "lucide-react";
import { useState } from "react";
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
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { CryptoPaymentDialog } from "@/components/payments/CryptoPaymentDialog";
import { triggerConfetti } from "@/components/Confetti";
import { PartialPaymentDialog } from "@/components/payments/PartialPaymentDialog";
import { DollarSign } from "lucide-react";
import { ViewInvoicePageSkeleton } from "@/components/skeletons";

export default function ViewInvoice() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const invoiceId = parseInt(params.id || "0");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cryptoDialogOpen, setCryptoDialogOpen] = useState(false);
  const [partialPaymentDialogOpen, setPartialPaymentDialogOpen] = useState(false);

  const { data, isLoading, error } = trpc.invoices.get.useQuery(
    { id: invoiceId },
    { enabled: isAuthenticated && invoiceId > 0 }
  );

  const utils = trpc.useUtils();

  const deleteInvoice = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      setLocation("/invoices");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete invoice");
    },
  });

  const generatePDF = trpc.invoices.generatePDF.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF generated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  const sendEmail = trpc.invoices.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Invoice sent successfully");
      triggerConfetti.invoiceSent();
      utils.invoices.get.invalidate({ id: invoiceId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invoice");
    },
  });

  const sendReminder = trpc.reminders.sendManual.useMutation({
    onSuccess: () => {
      toast.success("Payment reminder sent successfully");
      utils.invoices.get.invalidate({ id: invoiceId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send reminder");
    },
  });
  
  const createPaymentLink = trpc.invoices.createPaymentLink.useMutation({
    onSuccess: (data) => {
      toast.success("Payment link created");
      utils.invoices.get.invalidate({ id: invoiceId });
      navigator.clipboard.writeText(data.url);
      toast.success("Payment link copied to clipboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create payment link");
    },
  });

  const markAsPaid = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      triggerConfetti.paymentReceived();
      utils.invoices.get.invalidate({ id: invoiceId });
      utils.invoices.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice");
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
        <nav className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
                <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-6" />
              </Link>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invoice Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The invoice you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/invoices">
            <a>
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Button>
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const { invoice, lineItems, client, viewCount } = data;

  const handleMarkAsPaid = () => {
    markAsPaid.mutate({
      id: invoiceId,
      status: "paid",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/invoices">
                <a>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </a>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
                <p className="text-muted-foreground">Invoice Details</p>
              </div>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/invoices/${invoiceId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generatePDF.mutate({ id: invoiceId })}
              disabled={generatePDF.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendEmail.mutate({ id: invoiceId })}
              disabled={sendEmail.isPending}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            {invoice.status === 'overdue' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendReminder.mutate({ invoiceId: invoice.id })}
                disabled={sendReminder.isPending}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            )}
            {!invoice.stripePaymentLinkUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => createPaymentLink.mutate({ id: invoiceId })}
                disabled={createPaymentLink.isPending}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue" || invoice.status === "viewed") && (() => {
              const remainingBalance = parseFloat(invoice.total) - parseFloat(invoice.amountPaid);
              return (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCryptoDialogOpen(true)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-2"
                >
                  <Bitcoin className="h-4 w-4" />
                  Pay with Crypto
                  {remainingBalance < 10 && (
                    <Badge variant="outline" className="ml-1 text-[10px] border-amber-500 text-amber-600 dark:text-amber-500">
                      $10+ recommended
                    </Badge>
                  )}
                </Button>
              );
            })()}
            {(invoice.status === "sent" || invoice.status === "overdue" || invoice.status === "viewed") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPartialPaymentDialogOpen(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            )}
            {(invoice.status === "sent" || invoice.status === "overdue") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsPaid}
                disabled={markAsPaid.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Invoice Details */}
          <div className="space-y-6">
            {/* Client and Invoice Info */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Bill To</h3>
                    <div className="space-y-1">
                      <p className="font-semibold">{client?.name || "Unknown Client"}</p>
                      {client?.email && <p className="text-sm">{client.email}</p>}
                      {client?.phone && <p className="text-sm">{client.phone}</p>}
                      {client?.address && <p className="text-sm whitespace-pre-line">{client.address}</p>}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Issue Date: </span>
                      <span className="font-medium"><DateDisplay date={invoice.issueDate} format="long" /></span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Due Date: </span>
                      <span className="font-medium"><DateDisplay date={invoice.dueDate} format="long" /></span>
                    </div>
                    {invoice.paidAt && (
                      <div>
                        <span className="text-sm text-muted-foreground">Paid At: </span>
                        <span className="font-medium"><DateDisplay date={invoice.paidAt!} format="long" /></span>
                      </div>
                    )}
                    {viewCount !== undefined && viewCount > 0 && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Viewed {viewCount} time{viewCount !== 1 ? 's' : ''}</span>
                        {(invoice as any).firstViewedAt && (
                          <span className="text-xs text-muted-foreground">
                            (first: <DateDisplay date={(invoice as any).firstViewedAt} format="long" />)
                          </span>
                        )}
                      </div>
                    )}
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
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right"><Currency amount={item.rate} /></TableCell>
                        <TableCell className="text-right font-medium">
                          <Currency amount={item.amount} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium"><Currency amount={invoice.subtotal} /></span>
                  </div>
                  {parseFloat(invoice.discountAmount) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Discount
                        {invoice.discountType === "percentage"
                          ? ` (${invoice.discountValue}%)`
                          : ""}
                      </span>
                      <span className="text-red-600">-<Currency amount={invoice.discountAmount} /></span>
                    </div>
                  )}
                  {parseFloat(invoice.taxAmount) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                      <span>+<Currency amount={invoice.taxAmount} /></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t-2 border-primary/20">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      <Currency amount={invoice.total} />
                    </span>
                  </div>
                  {parseFloat(invoice.amountPaid) > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="text-green-600">-<Currency amount={invoice.amountPaid} /></span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-semibold">Balance Due</span>
                        <span className="font-bold">
                          <Currency
                            amount={parseFloat(invoice.total) - parseFloat(invoice.amountPaid)}
                          />
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <PaymentHistoryCard invoiceId={invoiceId} invoiceTotal={parseFloat(invoice.total)} />

            {/* Notes and Payment Terms */}
            {(invoice.notes || invoice.paymentTerms || invoice.stripePaymentLinkUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoice.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                      <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.paymentTerms && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Payment Terms
                      </h3>
                      <p className="text-sm">{invoice.paymentTerms}</p>
                    </div>
                  )}
                  {invoice.stripePaymentLinkUrl && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Online Payment
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => {
                              window.open(invoice.stripePaymentLinkUrl!, '_blank');
                              toast.info("Opening payment page in new tab");
                            }}
                          >
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Pay Now with Stripe
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                            {invoice.stripePaymentLinkUrl}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(invoice.stripePaymentLinkUrl!);
                              toast.success("Payment link copied to clipboard");
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Secure payment powered by Stripe. Share this link with your client to accept online payments.
                        </p>
                      </div>
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
        onConfirm={() => deleteInvoice.mutate({ id: invoiceId })}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`}
        isLoading={deleteInvoice.isPending}
       />

      {/* Crypto Payment Dialog */}
      <CryptoPaymentDialog
        open={cryptoDialogOpen}
        onOpenChange={setCryptoDialogOpen}
        invoiceId={invoiceId}
        amount={parseFloat(invoice?.total || '0') - parseFloat(invoice?.amountPaid || '0')}
        currency={invoice?.currency || 'USD'}
        onPaymentCreated={() => utils.invoices.get.invalidate({ id: invoiceId })}
      />

      {/* Partial Payment Dialog */}
      <PartialPaymentDialog
        open={partialPaymentDialogOpen}
        onOpenChange={setPartialPaymentDialogOpen}
        invoiceId={invoiceId}
        invoiceNumber={invoice.invoiceNumber}
        total={parseFloat(invoice.total)}
        currency={invoice.currency}
        onSuccess={() => {
          utils.invoices.get.invalidate({ id: invoiceId });
          utils.invoices.list.invalidate();
        }}
      />
    </div>
  );
}

// Payment History Card Component
function PaymentHistoryCard({ invoiceId, invoiceTotal }: { invoiceId: number; invoiceTotal: number }) {
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    currency: "USD",
    paymentMethod: "manual" as const,
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: payments, refetch } = trpc.payments.getByInvoice.useQuery({ invoiceId });
  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      setRecordPaymentOpen(false);
      refetch();
      setFormData({
        amount: "",
        currency: "USD",
        paymentMethod: "manual",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });

  const handleRecordPayment = () => {
    if (!formData.amount) {
      toast.error("Please enter an amount");
      return;
    }

    createPaymentMutation.mutate({
      invoiceId,
      amount: formData.amount,
      currency: formData.currency,
      paymentMethod: formData.paymentMethod,
      paymentDate: new Date(formData.paymentDate),
      notes: formData.notes || undefined,
    });
  };

  const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const balance = invoiceTotal - totalPaid;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                {payments?.length || 0} payment(s) recorded
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setRecordPaymentOpen(true)}>
              Record Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Payment Summary */}
          <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice Total:</span>
              <span className="font-semibold"><Currency amount={invoiceTotal} /></span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Paid:</span>
              <span className="font-semibold text-green-600"><Currency amount={totalPaid} /></span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">Balance Due:</span>
              <span className="font-bold"><Currency amount={balance} /></span>
            </div>
          </div>

          {/* Payment List */}
          {!payments || payments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No payments recorded yet</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium"><Currency amount={payment.amount} bold /></p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.paymentDate)} • {payment.paymentMethod.replace("_", " ")}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                    )}
                  </div>
                  <StatusBadge status={payment.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for this invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
