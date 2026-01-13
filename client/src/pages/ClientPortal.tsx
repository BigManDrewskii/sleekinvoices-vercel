import { useEffect, useState } from "react";
import { useParams, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExternalLink, Bitcoin, Loader2, Check, Copy, AlertCircle, Coins } from "lucide-react";
import { GearLoader } from "@/components/ui/gear-loader";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

/**
 * Public client portal - no authentication required
 * Clients access via unique token: /portal/{accessToken}
 */
export default function ClientPortal() {
  const params = useParams();
  const searchString = useSearch();
  const accessToken = params.accessToken as string;
  
  // Parse search params for payment status
  const searchParams = new URLSearchParams(searchString);
  const paymentStatus = searchParams.get('payment');
  const paymentInvoiceId = searchParams.get('invoiceId');
  
  // Crypto payment dialog state
  const [cryptoDialogOpen, setCryptoDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const utils = trpc.useUtils();
  
  const { data: client, isLoading: clientLoading, error: clientError } = trpc.clientPortal.getClientInfo.useQuery(
    { accessToken },
    { 
      enabled: !!accessToken,
      retry: false,
      refetchOnWindowFocus: false
    }
  );
  
  const { data: invoices, isLoading: invoicesLoading } = trpc.clientPortal.getInvoices.useQuery(
    { accessToken },
    { 
      enabled: !!accessToken && !!client,
      retry: false,
      refetchOnWindowFocus: false
    }
  );
  
  // Create crypto payment mutation
  const createCryptoPayment = trpc.clientPortal.createCryptoPayment.useMutation({
    onSuccess: (data) => {
      setPaymentUrl(data.invoiceUrl);
      toast.success("Payment link created! Choose your preferred cryptocurrency.");
      // Refresh invoices to show the new payment URL
      utils.clientPortal.getInvoices.invalidate({ accessToken });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create crypto payment");
    },
  });
  
  // Show payment status toast on mount
  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success("Payment submitted! It may take a few minutes to confirm on the blockchain.");
      // Clear the URL params
      window.history.replaceState({}, '', `/portal/${accessToken}`);
    } else if (paymentStatus === 'cancelled') {
      toast.info("Payment was cancelled.");
      window.history.replaceState({}, '', `/portal/${accessToken}`);
    }
  }, [paymentStatus, accessToken]);
  
  // Reset dialog state when closed
  useEffect(() => {
    if (!cryptoDialogOpen) {
      setPaymentUrl(null);
      setCopied(false);
      setSelectedInvoice(null);
    }
  }, [cryptoDialogOpen]);
  
  const handleOpenCryptoDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    // If invoice already has a crypto payment URL, use it
    if (invoice.cryptoPaymentUrl) {
      setPaymentUrl(invoice.cryptoPaymentUrl);
    }
    setCryptoDialogOpen(true);
  };
  
  const handleCreatePayment = () => {
    if (!selectedInvoice) return;
    createCryptoPayment.mutate({
      accessToken,
      invoiceId: selectedInvoice.id,
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
  
  // Calculate remaining amount for an invoice
  const getRemainingAmount = (invoice: any) => {
    const total = parseFloat(invoice.total);
    const paid = parseFloat(invoice.amountPaid || '0');
    return total - paid;
  };
  
  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No access token provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (clientLoading || invoicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }
  
  if (clientError || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Invalid or expired access token. Please contact your service provider.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Portal</h1>
          <p className="text-muted-foreground">
            Welcome, {client.name}
          </p>
        </div>
        
        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {!invoices || invoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No invoices found.
              </p>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice: any) => {
                  const remaining = getRemainingAmount(invoice);
                  const canPay = invoice.status !== 'paid' && invoice.status !== 'draft' && invoice.status !== 'cancelled' && remaining > 0;
                  
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            Invoice #{invoice.invoiceNumber}
                          </h3>
                          <StatusBadge status={invoice.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Date: {formatDate(invoice.invoiceDate)}
                          {invoice.dueDate && ` • Due: ${formatDate(invoice.dueDate)}`}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {formatCurrency(parseFloat(invoice.total))}
                        </p>
                        {remaining > 0 && remaining < parseFloat(invoice.total) && (
                          <p className="text-sm text-muted-foreground">
                            Remaining: {formatCurrency(remaining)}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 justify-end">
                          {canPay && invoice.stripePaymentLinkUrl && (
                            <Button
                              size="sm"
                              onClick={() => window.open(invoice.stripePaymentLinkUrl, "_blank")}
                            >
                              Pay Now
                            </Button>
                          )}
                          {canPay && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCryptoDialog(invoice)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 relative"
                            >
                              <Bitcoin className="h-4 w-4 mr-1" />
                              Pay with Crypto
                              {remaining < 10 && (
                                <Badge 
                                  variant="outline" 
                                  className="absolute -top-2 -right-2 text-[10px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  $10+
                                </Badge>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/api/invoices/${invoice.id}/pdf?token=${accessToken}`, "_blank")}
                          >
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>If you have any questions, please contact your service provider.</p>
        </div>
      </div>
      
      {/* Crypto Payment Dialog */}
      <Dialog open={cryptoDialogOpen} onOpenChange={setCryptoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[hsl(var(--color-bitcoin))]/10">
                <Bitcoin className="size-4 text-[hsl(var(--color-bitcoin))]" />
              </div>
              Pay with Cryptocurrency
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                getRemainingAmount(selectedInvoice) < 10
                  ? `Pay ${formatCurrency(getRemainingAmount(selectedInvoice))} ${selectedInvoice.currency || 'USD'} — Select a low-fee cryptocurrency for best results`
                  : `Pay ${formatCurrency(getRemainingAmount(selectedInvoice))} ${selectedInvoice.currency || 'USD'} using your preferred cryptocurrency`
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!paymentUrl ? (
              <>
                {/* Small Amount Warning */}
                {selectedInvoice && getRemainingAmount(selectedInvoice) < 10 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Small Amount Notice
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          For amounts under $10, we recommend using low-fee cryptocurrencies:
                        </p>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                          <li className="flex items-center gap-2">
                            <span className="font-medium">Litecoin (LTC)</span>
                            <span className="text-amber-600 dark:text-amber-400">— Fast, low fees</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="font-medium">Stellar (XLM)</span>
                            <span className="text-amber-600 dark:text-amber-400">— Near-instant, minimal fees</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="font-medium">USDT on Tron</span>
                            <span className="text-amber-600 dark:text-amber-400">— Stablecoin, low fees</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Info about crypto payment */}
                <div className="rounded-lg bg-[hsl(var(--color-bitcoin))]/5 border border-[hsl(var(--color-bitcoin))]/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[hsl(var(--color-bitcoin))]">
                    <Coins className="h-5 w-5" />
                    <span className="font-medium">300+ Cryptocurrencies Supported</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to create a payment link. You'll be able to choose from Bitcoin, Ethereum, USDT, USDC, and 300+ other cryptocurrencies on the secure checkout page.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs font-medium">
                      <span className="text-[hsl(var(--color-bitcoin))]">₿</span> BTC
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs font-medium">
                      <span className="text-[hsl(var(--color-ethereum))]">Ξ</span> ETH
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs font-medium">
                      <span className="text-[hsl(var(--color-usdt))]">₮</span> USDT
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs font-medium">
                      <span className="text-[hsl(var(--color-usdc))]">$</span> USDC
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background text-xs font-medium text-muted-foreground">
                      +300 more
                    </span>
                  </div>
                </div>

                {/* Amount Display */}
                {selectedInvoice && (
                  <div className="rounded-lg border p-4 space-y-1">
                    <div className="text-sm text-muted-foreground">Amount to Pay</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(getRemainingAmount(selectedInvoice))} {selectedInvoice.currency || 'USD'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Invoice #{selectedInvoice.invoiceNumber}
                    </div>
                  </div>
                )}

                {/* Create Payment Button */}
                <Button
                  className="w-full bg-gradient-to-r from-[hsl(var(--color-bitcoin))] to-[#f9a825] hover:from-[#e8850f] hover:to-[#e89920] text-white"
                  size="lg"
                  onClick={handleCreatePayment}
                  disabled={createCryptoPayment.isPending}
                >
                  {createCryptoPayment.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Creating Payment Link...
                    </>
                  ) : (
                    <>
                      <Bitcoin className="size-4 mr-2" />
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
                    <span className="font-medium">Payment Link Created!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to choose your preferred cryptocurrency and complete your payment on the NOWPayments secure checkout page.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-[#f7931a] to-[#f9a825] hover:from-[#e8850f] hover:to-[#e89920] text-white"
                    size="lg" 
                    onClick={handleOpenPayment}
                  >
                    <ExternalLink className="size-4 mr-2" />
                    Choose Crypto & Pay
                  </Button>
                  <Button variant="outline" onClick={handleCopyLink} className="w-full">
                    {copied ? (
                      <>
                        <Check className="size-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-2" />
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
          
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setCryptoDialogOpen(false)}>
              {paymentUrl ? "Close" : "Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
