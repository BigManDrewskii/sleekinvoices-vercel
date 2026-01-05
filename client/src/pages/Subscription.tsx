import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Check, CreditCard, ExternalLink, Bitcoin } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { SUBSCRIPTION_PLANS } from "@shared/subscription";
import { Navigation } from "@/components/Navigation";
import { CryptoSubscriptionDialog } from "@/components/subscription/CryptoSubscriptionDialog";

export default function Subscription() {
  const { user, loading, isAuthenticated } = useAuth();
  const [cryptoDialogOpen, setCryptoDialogOpen] = useState(false);

  const { data: subscriptionStatus, isLoading: statusLoading } = trpc.subscription.getStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const createPortalSession = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to open billing portal");
    },
  });

  const utils = trpc.useUtils();
  const syncStatus = trpc.subscription.syncStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      // Refresh subscription status
      utils.subscription.getStatus.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sync subscription status");
    },
  });

  const handleUpgrade = () => {
    createCheckout.mutate();
  };

  const handleManageBilling = () => {
    createPortalSession.mutate();
  };

  const handleSyncStatus = () => {
    syncStatus.mutate();
  };

  if (loading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const isActive = subscriptionStatus?.status === "active";
  const currentPeriodEnd = subscriptionStatus?.currentPeriodEnd
    ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Subscription</h1>
            <p className="text-muted-foreground">
              {isActive
                ? `You're on the ${SUBSCRIPTION_PLANS.PRO.name} plan with unlimited invoices`
                : `Upgrade to ${SUBSCRIPTION_PLANS.PRO.name} for unlimited invoices and features`}
            </p>
          </div>

          {/* Current Status */}
          {isActive && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Active Subscription
                </CardTitle>
                <CardDescription>Your Pro subscription is active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Plan:</strong> {SUBSCRIPTION_PLANS.PRO.name} (${SUBSCRIPTION_PLANS.PRO.price}/month)
                  </p>
                  {currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Next billing date:</strong> {currentPeriodEnd}
                    </p>
                  )}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={createPortalSession.isPending}
                    className="flex-1"
                  >
                    {createPortalSession.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Billing
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleSyncStatus}
                    disabled={syncStatus.isPending}
                  >
                    {syncStatus.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Syncing...
                      </>
                    ) : (
                      "Sync Status"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className={!isActive ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <CardDescription>Get started with basic features</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${SUBSCRIPTION_PLANS.FREE.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{SUBSCRIPTION_PLANS.FREE.invoiceLimit} invoices per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Basic invoice templates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Client management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PDF generation</span>
                  </li>
                </ul>
                {!isActive && (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className={isActive ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Pro
                  {isActive && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Everything you need to grow</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${SUBSCRIPTION_PLANS.PRO.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold">Unlimited invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Unlimited clients</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Stripe payment links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Email sending</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Analytics dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Custom branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                {!isActive ? (
                  <div className="space-y-3">
                    <Button
                      onClick={handleUpgrade}
                      disabled={createCheckout.isPending}
                      className="w-full"
                    >
                      {createCheckout.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay with Card
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCryptoDialogOpen(true)}
                      className="w-full"
                    >
                      <Bitcoin className="h-4 w-4 mr-2" />
                      Pay with Crypto
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      BTC, ETH, USDT, and 300+ cryptocurrencies accepted
                    </p>
                  </div>
                ) : (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Can I cancel anytime?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time from the billing portal.
                  You'll retain access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  What payment methods do you accept?
                </h3>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards through Stripe, plus 300+ cryptocurrencies
                  including Bitcoin, Ethereum, USDT, and more via NOWPayments.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Is there a free trial?
                </h3>
                <p className="text-sm text-muted-foreground">
                  The free plan allows you to create {SUBSCRIPTION_PLANS.FREE.invoiceLimit} invoices per month with no time limit.
                  Upgrade to {SUBSCRIPTION_PLANS.PRO.name} when you're ready for unlimited invoices.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Crypto Subscription Dialog */}
      <CryptoSubscriptionDialog
        open={cryptoDialogOpen}
        onOpenChange={setCryptoDialogOpen}
      />
    </div>
  );
}
