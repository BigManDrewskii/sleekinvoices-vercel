import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  FileText, 
  Check, 
  CreditCard, 
  ExternalLink, 
  Bitcoin, 
  Clock, 
  AlertTriangle,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { SUBSCRIPTION_PLANS, getAllCryptoTiers } from "@shared/subscription";
import { Navigation } from "@/components/Navigation";
import { CryptoSubscriptionDialog } from "@/components/subscription/CryptoSubscriptionDialog";
import { ExpirationWarningBanner } from "@/components/subscription/ExpirationWarningBanner";

export default function Subscription() {
  const { user, loading, isAuthenticated } = useAuth();
  const [cryptoDialogOpen, setCryptoDialogOpen] = useState(false);
  const [isExtendMode, setIsExtendMode] = useState(false);

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

  const handleOpenCryptoDialog = (extend: boolean = false) => {
    setIsExtendMode(extend);
    setCryptoDialogOpen(true);
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
  
  // Enhanced subscription info from getStatus
  const effectiveEndDate = subscriptionStatus?.effectiveEndDate;
  const daysRemaining = subscriptionStatus?.daysRemaining ?? 0;
  const timeRemaining = subscriptionStatus?.timeRemaining ?? '';
  const isExpiringSoon = subscriptionStatus?.isExpiringSoon ?? false;
  const subscriptionSource = subscriptionStatus?.subscriptionSource;

  // Get crypto tier info for display
  const cryptoTiers = getAllCryptoTiers();
  const lowestCryptoPrice = cryptoTiers[0]?.pricePerMonth || 10;

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

          {/* Expiration Warning Banner */}
          {isActive && isExpiringSoon && (
            <ExpirationWarningBanner
              daysRemaining={daysRemaining}
              timeRemaining={timeRemaining}
              effectiveEndDate={effectiveEndDate ?? null}
            />
          )}

          {/* Current Status - Active Subscription */}
          {isActive && (
            <Card className="mb-8 border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Active Subscription
                </CardTitle>
                <CardDescription>
                  Your Pro subscription is active
                  {subscriptionSource === 'crypto' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-500">
                      <Bitcoin className="h-3 w-3 mr-1" />
                      Crypto
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Plan:</strong> {SUBSCRIPTION_PLANS.PRO.name} (${SUBSCRIPTION_PLANS.PRO.price}/month)
                  </p>
                  {currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <strong>Next billing date:</strong> {currentPeriodEnd}
                    </p>
                  )}
                  {subscriptionSource === 'crypto' && effectiveEndDate && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <strong>Subscription ends:</strong>{' '}
                      {new Date(effectiveEndDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      <span className={`ml-2 ${isExpiringSoon ? 'text-amber-500' : 'text-green-500'}`}>
                        ({timeRemaining})
                      </span>
                    </p>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleManageBilling}
                    disabled={createPortalSession.isPending}
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
                  <Link href="/subscription/history">
                    <Button variant="ghost">
                      <Clock className="h-4 w-4 mr-2" />
                      Payment History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extend Subscription Card - For Pro Users */}
          {isActive && (
            <Card className="mb-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-amber-500" />
                  Extend with Crypto
                </CardTitle>
                <CardDescription>
                  Add more time to your subscription at discounted rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {cryptoTiers.map((tier) => (
                    <div
                      key={tier.months}
                      className="bg-background/50 rounded-lg p-3 text-center border border-border/50"
                    >
                      <div className="text-sm font-medium">{tier.label}</div>
                      <div className="text-lg font-bold">${tier.totalPrice}</div>
                      <div className="text-xs text-green-500">Save {tier.savingsPercent}%</div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleOpenCryptoDialog(true)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Bitcoin className="h-4 w-4 mr-2" />
                  Extend Subscription
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Pay with BTC, ETH, USDT, and 300+ cryptocurrencies
                </p>
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
            <Card className={isActive ? "border-primary" : "border-2 border-primary/50"}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Pro
                    {isActive && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Current
                      </span>
                    )}
                  </CardTitle>
                  {!isActive && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Save up to 29% with crypto
                    </span>
                  )}
                </div>
                <CardDescription>Everything you need to grow</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">${SUBSCRIPTION_PLANS.PRO.price}</span>
                  <span className="text-muted-foreground">/month with card</span>
                  {!isActive && (
                    <div className="text-sm text-green-500 mt-1">
                      or from ${lowestCryptoPrice}/month with crypto
                    </div>
                  )}
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
                          Pay with Card - ${SUBSCRIPTION_PLANS.PRO.price}/mo
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenCryptoDialog(false)}
                      className="w-full border-amber-500/50 hover:bg-amber-500/10"
                    >
                      <Bitcoin className="h-4 w-4 mr-2 text-amber-500" />
                      Pay with Crypto - Save up to 29%
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

          {/* Crypto Pricing Table - Only show for non-Pro users */}
          {!isActive && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-amber-500" />
                  Crypto Pricing
                </CardTitle>
                <CardDescription>
                  Save more when you pay with cryptocurrency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Duration</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Card Price</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Crypto Price</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">You Save</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoTiers.map((tier) => {
                        const cardPrice = SUBSCRIPTION_PLANS.PRO.price * tier.months;
                        const savings = cardPrice - tier.totalPrice;
                        return (
                          <tr key={tier.months} className="border-b last:border-0">
                            <td className="py-3 px-2">
                              <span className="font-medium">{tier.label}</span>
                              {tier.recommended && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Popular
                                </span>
                              )}
                            </td>
                            <td className="text-right py-3 px-2 text-muted-foreground line-through">
                              ${cardPrice.toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-2 font-semibold">
                              ${tier.totalPrice.toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-2 text-green-500 font-medium">
                              ${savings.toFixed(2)} ({tier.savingsPercent}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

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
                  Why is crypto cheaper?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crypto payments have lower processing fees than credit cards, so we pass those
                  savings on to you. The longer the duration, the bigger the discount.
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
        isExtension={isExtendMode}
      />
    </div>
  );
}
