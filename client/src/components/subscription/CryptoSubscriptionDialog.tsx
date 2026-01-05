import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bitcoin, ExternalLink, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@shared/subscription";

interface CryptoSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUPPORTED_CRYPTOS = [
  { code: "btc", name: "Bitcoin", symbol: "₿" },
  { code: "eth", name: "Ethereum", symbol: "Ξ" },
  { code: "usdt", name: "Tether", symbol: "₮" },
  { code: "usdc", name: "USD Coin", symbol: "$" },
  { code: "ltc", name: "Litecoin", symbol: "Ł" },
  { code: "doge", name: "Dogecoin", symbol: "Ð" },
  { code: "sol", name: "Solana", symbol: "◎" },
  { code: "xrp", name: "XRP", symbol: "✕" },
  { code: "matic", name: "Polygon", symbol: "M" },
];

export function CryptoSubscriptionDialog({ open, onOpenChange }: CryptoSubscriptionDialogProps) {
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
      toast.success("Crypto payment created! Complete payment to activate Pro.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create crypto payment");
    },
  });

  const handleCreatePayment = () => {
    createCryptoSubscription.mutate({
      payCurrency: selectedCrypto,
    });
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
    onOpenChange(false);
  };

  const selectedCryptoInfo = SUPPORTED_CRYPTOS.find(c => c.code === selectedCrypto);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5 text-amber-500" />
            Pay with Cryptocurrency
          </DialogTitle>
          <DialogDescription>
            Upgrade to Pro for ${SUBSCRIPTION_PLANS.PRO.price}/month using crypto
          </DialogDescription>
        </DialogHeader>

        {!paymentData ? (
          <div className="space-y-6 py-4">
            {/* Benefits reminder */}
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
                        <span className="text-muted-foreground uppercase">({crypto.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price info */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">You'll pay approximately</p>
              <p className="text-2xl font-bold">
                ${SUBSCRIPTION_PLANS.PRO.price} USD
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                in {selectedCryptoInfo?.name} ({selectedCryptoInfo?.symbol})
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Exchange rate calculated at checkout
              </p>
            </div>

            {/* Create payment button */}
            <Button
              onClick={handleCreatePayment}
              disabled={createCryptoSubscription.isPending}
              className="w-full"
            >
              {createCryptoSubscription.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Payment...
                </>
              ) : (
                <>
                  <Bitcoin className="h-4 w-4 mr-2" />
                  Pay with {selectedCryptoInfo?.name}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Powered by NOWPayments • 0.5% transaction fee
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Payment created success */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-600">Payment Created!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete the payment to activate your Pro subscription
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
                <span className="text-sm text-muted-foreground">Payment ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{paymentData.paymentId.slice(0, 12)}...</span>
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

            {/* Open payment page button */}
            <Button onClick={handleOpenPaymentPage} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Payment Page
            </Button>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                After payment is confirmed, your Pro subscription will be activated automatically.
              </p>
              <p className="text-xs text-muted-foreground">
                This may take 10-30 minutes depending on network confirmations.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
