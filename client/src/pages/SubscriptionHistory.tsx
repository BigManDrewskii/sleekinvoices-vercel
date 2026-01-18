import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Currency, Numeric } from "@/components/ui/typography";
import {
  ArrowLeft,
  Bitcoin,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Coins,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";

export default function SubscriptionHistory() {
  const { loading, isAuthenticated } = useAuth();

  const { data: history, isLoading: historyLoading } =
    trpc.crypto.getHistory.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  if (loading || historyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "finished":
      case "confirmed":
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "waiting":
      case "confirming":
      case "sending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "failed":
      case "expired":
      case "refunded":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    let variant: "success" | "warning" | "error" | "neutral" = "neutral";

    if (["finished", "confirmed", "active"].includes(statusLower)) {
      variant = "success";
    } else if (["waiting", "confirming", "sending"].includes(statusLower)) {
      variant = "warning";
    } else if (["failed", "expired", "refunded"].includes(statusLower)) {
      variant = "error";
    }

    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDurationLabel = (months: number) => {
    if (months === 1) return "1 Month";
    return `${months} Months`;
  };

  const items = history?.items || [];
  const totalCryptoPayments = history?.totalCryptoPayments || 0;

  // Calculate totals
  const completedPayments = items.filter(item =>
    ["finished", "confirmed", "active"].includes(item.status.toLowerCase())
  );
  const totalSpent = completedPayments.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalMonths = completedPayments.reduce(
    (sum, item) => sum + item.months,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/subscription">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subscription
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Payment History
            </h1>
            <p className="text-muted-foreground">
              View all your subscription payments and extensions
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Payments
                    </p>
                    <p className="text-2xl font-bold">{items.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl">
                      <Currency amount={totalSpent} bold />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Duration
                    </p>
                    <p className="text-2xl font-bold">{totalMonths} Months</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Payment Timeline
              </CardTitle>
              <CardDescription>
                {totalCryptoPayments > 0
                  ? `${totalCryptoPayments} crypto payment${totalCryptoPayments > 1 ? "s" : ""}`
                  : "No payments yet"}
                {history?.hasStripeSubscription &&
                  " • Stripe subscription active"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No payment history
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any subscription payments yet.
                  </p>
                  <Link href="/subscription">
                    <Button>View Plans</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`relative flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors ${
                        index === 0 ? "border-primary/50" : "border-border"
                      }`}
                    >
                      {/* Timeline connector */}
                      {index < items.length - 1 && (
                        <div className="absolute left-[2.1rem] top-16 w-0.5 h-[calc(100%-2rem)] bg-border" />
                      )}

                      {/* Icon */}
                      <div className="flex-shrink-0 z-10">
                        <div
                          className={`p-2 rounded-full ${
                            item.type === "crypto"
                              ? "bg-amber-500/20"
                              : "bg-blue-500/20"
                          }`}
                        >
                          {item.type === "crypto" ? (
                            <Bitcoin className="h-5 w-5 text-amber-500" />
                          ) : (
                            <CreditCard className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {item.type === "crypto"
                                  ? "Crypto Payment"
                                  : "Stripe Subscription"}
                              </span>
                              {item.isExtension && (
                                <Badge variant="secondary">Extension</Badge>
                              )}
                              {getStatusBadge(item.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getDurationLabel(item.months)} •{" "}
                              {formatDate(item.date)}
                            </p>
                            {item.type === "crypto" &&
                              "cryptoCurrency" in item && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Paid{" "}
                                  <Numeric
                                    value={item.cryptoAmount}
                                    decimals={6}
                                  />{" "}
                                  {item.cryptoCurrency}
                                </p>
                              )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status)}
                              <span className="text-lg">
                                <Currency amount={item.amount} bold />
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">
                    About Payment History
                  </p>
                  <p>
                    This page shows all your subscription payments including
                    one-time crypto payments and recurring Stripe subscriptions.
                    Crypto payments are processed via NOWPayments and may take a
                    few minutes to confirm on the blockchain.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
