import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DialogIconHeader,
  DialogBody,
  DialogActions,
} from "@/components/shared/DialogPatterns";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Calendar,
  CreditCard,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Check } from "@phosphor-icons/react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";

interface PartialPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoiceNumber: string;
  total: number;
  currency: string;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "manual", label: "Other" },
] as const;

export function PartialPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  total,
  currency,
  onSuccess,
}: PartialPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [paymentDate, setPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("");
  const [cryptoTxHash, setCryptoTxHash] = useState("");

  const utils = trpc.useUtils();

  const { data: summary, isLoading: summaryLoading } =
    trpc.payments.getSummary.useQuery({ invoiceId }, { enabled: open });

  const recordPayment = trpc.payments.recordPartial.useMutation({
    // Optimistic update: immediately update payment summary
    onMutate: async newPayment => {
      await utils.payments.getSummary.cancel({ invoiceId });
      const previousSummary = utils.payments.getSummary.getData({ invoiceId });

      // Optimistically update the summary
      if (previousSummary) {
        const paymentAmount = parseFloat(newPayment.amount);
        const newTotalPaid = previousSummary.totalPaid + paymentAmount;
        const newRemaining = previousSummary.total - newTotalPaid;

        utils.payments.getSummary.setData(
          { invoiceId },
          {
            ...previousSummary,
            totalPaid: newTotalPaid,
            remaining: newRemaining,
            isFullyPaid: newRemaining <= 0,
            payments: [
              {
                id: -Date.now(),
                invoiceId,
                userId: 0,
                amount: newPayment.amount,
                currency,
                paymentMethod: newPayment.paymentMethod,
                stripePaymentIntentId: null,
                cryptoCurrency: newPayment.cryptoCurrency || null,
                cryptoTxHash: newPayment.cryptoTxHash || null,
                paymentDate: newPayment.paymentDate,
                notes: newPayment.notes || null,
                status: "completed" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as (typeof previousSummary.payments)[0],
              ...previousSummary.payments,
            ],
          }
        );
      }

      // Close dialog immediately for instant feedback
      handleClose();

      return { previousSummary };
    },
    onSuccess: result => {
      toast.success(`Payment of ${currency} ${amount} recorded successfully`);
      if (result.remaining <= 0) {
        toast.success("Invoice is now fully paid!");
      }
      onSuccess();
    },
    onError: (error, _variables, context) => {
      if (context?.previousSummary) {
        utils.payments.getSummary.setData(
          { invoiceId },
          context.previousSummary
        );
      }
      toast.error(error.message || "Failed to record payment");
    },
    onSettled: () => {
      utils.payments.getSummary.invalidate({ invoiceId });
      utils.payments.getByInvoice.invalidate({ invoiceId });
      utils.invoices.list.invalidate();
      utils.invoices.get.invalidate({ id: invoiceId });
    },
  });

  const handleClose = () => {
    setAmount("");
    setPaymentMethod("bank_transfer");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setNotes("");
    setCryptoCurrency("");
    setCryptoTxHash("");
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (summary && paymentAmount > summary.remaining) {
      toast.error(
        `Amount cannot exceed remaining balance of ${currency} ${summary.remaining.toFixed(2)}`
      );
      return;
    }

    recordPayment.mutate({
      invoiceId,
      amount,
      paymentMethod: paymentMethod as any,
      paymentDate: new Date(paymentDate),
      notes: notes || undefined,
      cryptoCurrency: paymentMethod === "crypto" ? cryptoCurrency : undefined,
      cryptoTxHash: paymentMethod === "crypto" ? cryptoTxHash : undefined,
    });
  };

  const paidPercentage = summary
    ? (summary.totalPaid / summary.total) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <DialogIconHeader
              icon={CreditCard}
              title="Record Payment"
              variant="success"
              size="sm"
            />
          </DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <DialogBody spacing="relaxed">
          {/* Payment Summary */}
          {summaryLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : summary ? (
            <div className="space-y-3 p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Total</span>
                <span className="font-medium">
                  {currency} {summary.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="font-medium text-green-500">
                  {currency} {summary.totalPaid.toFixed(2)}
                </span>
              </div>
              <Progress value={paidPercentage} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-bold">
                  {currency} {summary.remaining.toFixed(2)}
                </span>
              </div>

              {summary.isFullyPaid && (
                <Alert className="mt-2 bg-green-500/10 border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    This invoice is fully paid
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : null}

          {/* Payment Form */}
          {summary && !summary.isFullyPaid && (
            <div className="space-y-4">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Payment Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={summary.remaining}
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={() =>
                      setAmount((summary.remaining / 2).toFixed(2))
                    }
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={() => setAmount(summary.remaining.toFixed(2))}
                  >
                    Full Amount
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-sm font-medium">
                  Payment Method
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4 text-muted-foreground" />
                      <SelectValue placeholder="Select payment method" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Crypto Fields */}
              {paymentMethod === "crypto" && (
                <div className="space-y-4 p-3 border border-[hsl(var(--color-bitcoin))]/30 bg-[hsl(var(--color-bitcoin))]/5 rounded-lg">
                  <div className="space-y-2">
                    <Label
                      htmlFor="cryptoCurrency"
                      className="text-sm font-medium"
                    >
                      Cryptocurrency
                    </Label>
                    <Input
                      id="cryptoCurrency"
                      placeholder="e.g., BTC, ETH, USDT"
                      value={cryptoCurrency}
                      onChange={e => setCryptoCurrency(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="cryptoTxHash"
                      className="text-sm font-medium"
                    >
                      Transaction Hash{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="cryptoTxHash"
                      placeholder="0x..."
                      value={cryptoTxHash}
                      onChange={e => setCryptoTxHash(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate" className="text-sm font-medium">
                  Payment Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this payment..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    className="pl-9 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          {summary && summary.payments.length > 0 && (
            <div className="space-y-2">
              <div className="h-px bg-border" />
              <Label className="text-sm font-medium">Payment History</Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {summary.payments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                      </span>
                      <span className="text-muted-foreground">
                        {payment.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                    <span className="font-medium text-green-500">
                      +{currency} {Number(payment.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogBody>

        {summary && !summary.isFullyPaid && (
          <DialogActions
            onClose={handleClose}
            onSubmit={handleSubmit}
            submitText="Record Payment"
            cancelText="Cancel"
            isLoading={recordPayment.isPending}
            disabled={!amount || parseFloat(amount) <= 0}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
