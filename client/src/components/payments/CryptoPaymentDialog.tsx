import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ExternalLink, Bitcoin, Copy, Check, Wallet } from "lucide-react";
import { toast } from "sonner";

interface CryptoPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  amount: number;
  currency: string;
  onPaymentCreated?: () => void;
}

// Currency icons mapping
const currencyIcons: Record<string, string> = {
  btc: "₿",
  eth: "Ξ",
  usdt: "₮",
  usdc: "$",
  ltc: "Ł",
  doge: "Ð",
  sol: "◎",
  xrp: "✕",
  bnb: "B",
  matic: "M",
};

export function CryptoPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  amount,
  currency,
  onPaymentCreated,
}: CryptoPaymentDialogProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch available currencies
  const { data: currencies, isLoading: currenciesLoading } = trpc.crypto.getCurrencies.useQuery(
    undefined,
    { enabled: open }
  );

  // Get price estimate when crypto is selected
  const { data: estimate, isLoading: estimateLoading } = trpc.crypto.getEstimate.useQuery(
    {
      amount,
      fiatCurrency: currency.toLowerCase(),
      cryptoCurrency: selectedCrypto,
    },
    { enabled: open && !!selectedCrypto }
  );

  // Create payment mutation
  const createPayment = trpc.crypto.createPayment.useMutation({
    onSuccess: (data) => {
      setPaymentUrl(data.invoiceUrl);
      toast.success("Crypto payment created! Click the link to complete payment.");
      onPaymentCreated?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create crypto payment");
    },
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedCrypto("");
      setPaymentUrl(null);
      setCopied(false);
    }
  }, [open]);

  const handleCreatePayment = () => {
    if (!selectedCrypto) {
      toast.error("Please select a cryptocurrency");
      return;
    }
    createPayment.mutate({
      invoiceId,
      cryptoCurrency: selectedCrypto,
    });
  };

  const handleCopyLink = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast.success("Payment link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#f7931a]/10">
              <Bitcoin className="size-4 text-[#f7931a]" />
            </div>
            Pay with Cryptocurrency
          </DialogTitle>
          <DialogDescription>
            Pay {formatCurrency(amount)} {currency} using your preferred cryptocurrency
          </DialogDescription>
        </DialogHeader>

        {/* Dialog Body - consistent padding */}
        <div className="px-6 py-4 space-y-5">
          {!paymentUrl ? (
            <>
              {/* Currency Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Cryptocurrency</label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Wallet className="size-4 text-muted-foreground" />
                      <SelectValue placeholder="Choose a cryptocurrency..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {currenciesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      currencies?.popular.map((crypto) => (
                        <SelectItem key={crypto} value={crypto}>
                          <span className="flex items-center gap-2">
                            <span className="font-mono text-lg">
                              {currencyIcons[crypto] || "○"}
                            </span>
                            {crypto.toUpperCase()}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Estimate */}
              {selectedCrypto && (
                <div className="rounded-lg bg-[#f7931a]/5 border border-[#f7931a]/20 p-4 space-y-2">
                  <div className="text-sm text-muted-foreground">Estimated Amount</div>
                  {estimateLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calculating...</span>
                    </div>
                  ) : estimate ? (
                    <div className="text-2xl font-bold text-[#f7931a]">
                      {parseFloat(estimate.cryptoAmount).toFixed(8)}{" "}
                      {selectedCrypto.toUpperCase()}
                    </div>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    Rate is locked when you create the payment
                  </div>
                </div>
              )}

              {/* Create Payment Button */}
              <Button
                variant="crypto"
                size="lg"
                className="w-full"
                onClick={handleCreatePayment}
                disabled={!selectedCrypto || createPayment.isPending}
              >
                {createPayment.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    <Bitcoin className="size-4" />
                    Create Crypto Payment
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Payment Created - Show Link */}
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Payment Created!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the button below to complete your payment on the NOWPayments secure checkout page.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button variant="crypto" size="lg" onClick={handleOpenPayment} className="w-full">
                  <ExternalLink className="size-4" />
                  Open Payment Page
                </Button>
                <Button variant="outline" onClick={handleCopyLink} className="w-full">
                  {copied ? (
                    <>
                      <Check className="size-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy Payment Link
                    </>
                  )}
                </Button>
              </div>

              {/* Payment Info */}
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Payment is processed by NOWPayments</p>
                <p>You'll be redirected back after payment</p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {paymentUrl ? "Close" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
