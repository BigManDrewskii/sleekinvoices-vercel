import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogBody } from "@/components/shared/DialogPatterns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Bitcoin,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  Clock,
  Shield,
} from "lucide-react";
import {
  getCryptoTierByMonths,
  getCryptoSavings,
  CARD_PRICE_PER_MONTH,
} from "@shared/subscription";
import { CryptoDurationSelector } from "./CryptoDurationSelector";

interface CryptoSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If true, this is an extension for an existing Pro user */
  isExtension?: boolean;
}

const SUPPORTED_CRYPTOS = [
  { code: "btc", name: "Bitcoin", symbol: "₿" },
  { code: "eth", name: "Ethereum", symbol: "Ξ" },
  { code: "usdt", name: "Tether (ERC-20)", symbol: "₮" },
  { code: "usdtbsc", name: "Tether (BSC)", symbol: "₮" },
  { code: "usdtmatic", name: "Tether (Polygon)", symbol: "₮" },
  { code: "usdc", name: "USD Coin", symbol: "$" },
  { code: "ltc", name: "Litecoin", symbol: "Ł" },
  { code: "sol", name: "Solana", symbol: "◎" },
  { code: "matic", name: "Polygon", symbol: "M" },
];

type Step = "duration" | "crypto" | "payment";

export function CryptoSubscriptionDialog({
  open,
  onOpenChange,
  isExtension = false,
}: CryptoSubscriptionDialogProps) {
  const [step, setStep] = useState<Step>("duration");
  const [selectedMonths, setSelectedMonths] = useState(3); // Default to 3 months (recommended)
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [paymentData, setPaymentData] = useState<{
    paymentUrl: string;
    paymentId: string;
    cryptoAmount: string;
    cryptoCurrency: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const createCryptoSubscription = trpc.subscription.createCryptoCheckout.useMutation({
    onSuccess: (data) => {
      setPaymentData({
        paymentUrl: data.paymentUrl,
        paymentId: data.paymentId,
        cryptoAmount: data.cryptoAmount,
        cryptoCurrency: data.cryptoCurrency,
      });
      setStep("payment");
      toast.success("Payment created! Complete payment to activate Pro.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create crypto payment");
    },
  });

  const extendSubscription = trpc.subscription.extendCryptoSubscription.useMutation({
    onSuccess: (data) => {
      setPaymentData({
        paymentUrl: data.paymentUrl,
        paymentId: data.paymentId,
        cryptoAmount: data.cryptoAmount,
        cryptoCurrency: data.cryptoCurrency,
      });
      setStep("payment");
      toast.success("Payment created! Complete payment to extend your subscription.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create extension payment");
    },
  });

  const handleCreatePayment = () => {
    if (isExtension) {
      extendSubscription.mutate({
        months: selectedMonths,
        payCurrency: selectedCrypto,
      });
    } else {
      createCryptoSubscription.mutate({
        months: selectedMonths,
        payCurrency: selectedCrypto,
      });
    }
  };

  const handleCopyPaymentId = () => {
    if (paymentData?.paymentId) {
      navigator.clipboard.writeText(paymentData.paymentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Payment ID copied!");
    }
  };

  const handleOpenPaymentPage = () => {
    if (paymentData?.paymentUrl) {
      window.open(paymentData.paymentUrl, "_blank");
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    setSelectedCrypto("btc");
    setSelectedMonths(3);
    setStep("duration");
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === "crypto") {
      setStep("duration");
    }
  };

  const selectedTier = getCryptoTierByMonths(selectedMonths);
  const savings = getCryptoSavings(selectedMonths);
  const cardTotal = CARD_PRICE_PER_MONTH * selectedMonths;
  const selectedCryptoInfo = SUPPORTED_CRYPTOS.find((c) => c.code === selectedCrypto);
  const isPending = createCryptoSubscription.isPending || extendSubscription.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            {step === "crypto" && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="mr-1"
                onClick={handleBack}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#f7931a]/10">
              <Bitcoin className="size-4 text-[#f7931a]" />
            </div>
            {isExtension ? "Extend Subscription" : "Pay with Cryptocurrency"}
          </DialogTitle>
          <DialogDescription>
            {step === "duration" && "Choose your subscription duration"}
            {step === "crypto" && "Select your preferred cryptocurrency"}
            {step === "payment" && "Complete your payment"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Duration Selection */}
        {step === "duration" && (
          <DialogBody spacing="relaxed">
            {/* Benefits reminder */}
            {!isExtension && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Pro Benefits</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Unlimited invoices</li>
                  <li>• Stripe payment links</li>
                  <li>• Email sending & reminders</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            )}

            {/* Duration selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Duration</label>
              <CryptoDurationSelector
                selectedMonths={selectedMonths}
                onSelect={setSelectedMonths}
              />
            </div>

            {/* Summary */}
            {selectedTier && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Your price</span>
                  <span className="text-2xl font-bold">
                    ${selectedTier.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Card price would be</span>
                  <span className="line-through">${cardTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-green-500 font-medium mt-1">
                  <span>You save</span>
                  <span>${savings.toFixed(2)} ({selectedTier.savingsPercent}% off)</span>
                </div>
              </div>
            )}

            {/* Continue button */}
            <Button onClick={() => setStep("crypto")} className="w-full">
              Continue to Payment
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Powered by NOWPayments • Secure crypto payments
            </p>
          </DialogBody>
        )}

        {/* Step 2: Crypto Selection */}
        {step === "crypto" && (
          <DialogBody spacing="relaxed">
            {/* Selected duration summary */}
            {selectedTier && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">{selectedTier.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    (${selectedTier.pricePerMonth.toFixed(2)}/mo)
                  </span>
                </div>
                <span className="text-lg font-bold">
                  ${selectedTier.totalPrice.toFixed(2)}
                </span>
              </div>
            )}

            {/* Crypto selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Cryptocurrency</label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crypto" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CRYPTOS.map((crypto) => (
                    <SelectItem key={crypto.code} value={crypto.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{crypto.symbol}</span>
                        <span>{crypto.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Exchange rate calculated at checkout
              </p>
            </div>

            {/* Network info for stablecoins */}
            {(selectedCrypto.includes("usdt") || selectedCrypto === "usdc") && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                <Shield className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-amber-600">Network Selection</p>
                  <p className="text-muted-foreground mt-0.5">
                    Make sure to send on the correct network to avoid loss of funds.
                    {selectedCrypto === "usdtbsc" && " You selected BSC (BEP-20)."}
                    {selectedCrypto === "usdtmatic" && " You selected Polygon (MATIC)."}
                    {selectedCrypto === "usdt" && " You selected Ethereum (ERC-20)."}
                  </p>
                </div>
              </div>
            )}

            {/* Create payment button */}
            <Button
              variant="crypto"
              size="lg"
              onClick={handleCreatePayment}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <Bitcoin className="size-4" />
                  Pay ${selectedTier?.totalPrice.toFixed(2)} with {selectedCryptoInfo?.name}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              0.5% transaction fee • Payment expires in 10 minutes
            </p>
          </DialogBody>
        )}

        {/* Step 3: Payment Created */}
        {step === "payment" && paymentData && (
          <DialogBody spacing="relaxed">
            {/* Payment created success */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-600">Payment Created!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete the payment to {isExtension ? "extend" : "activate"} your subscription
              </p>
            </div>

            {/* Payment details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-mono font-semibold">
                  {paymentData.cryptoAmount} {paymentData.cryptoCurrency.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-semibold">{selectedTier?.label}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Payment ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">
                    {paymentData.paymentId.slice(0, 12)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPaymentId}
                    className="h-6 w-6 p-0"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Timer warning */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-600">
                Payment expires in 10 minutes. Complete payment before expiration.
              </span>
            </div>

            {/* Open payment page button */}
            <Button variant="crypto" size="lg" onClick={handleOpenPaymentPage} className="w-full">
              <ExternalLink className="size-4" />
              Open Payment Page
            </Button>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                After payment is confirmed, your subscription will be{" "}
                {isExtension ? "extended" : "activated"} automatically.
              </p>
              <p className="text-xs text-muted-foreground">
                This may take 10-30 minutes depending on network confirmations.
              </p>
            </div>
          </DialogBody>
        )}
      </DialogContent>
    </Dialog>
  );
}
