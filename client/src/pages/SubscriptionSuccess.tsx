import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SubscriptionPageSkeleton } from "@/components/skeletons";

export default function SubscriptionSuccess() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: subscriptionStatus, isLoading } =
    trpc.subscription.getStatus.useQuery(undefined, {
      enabled: isAuthenticated,
      // Poll every 2 seconds, but stop after subscription is active
      refetchInterval: query => {
        return query.state.data?.status === "active" ? false : 2000;
      },
      refetchIntervalInBackground: false,
    });

  // Show loading while auth or subscription data is loading
  if (authLoading || isLoading) {
    return <SubscriptionPageSkeleton />;
  }

  const isActive = subscriptionStatus?.status === "active";
  const currentPeriodEnd = subscriptionStatus?.currentPeriodEnd
    ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-primary">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src="/sleeky/success-states/subscription-upgraded.png"
                alt="Sleeky celebrating your Pro upgrade!"
                className="h-40 w-40 object-contain animate-bounce-subtle"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            {isActive ? "Welcome to Pro!" : "Payment Successful!"}
          </CardTitle>
          <CardDescription className="text-lg">
            {isActive
              ? "Your subscription is now active and you have unlimited access to all Pro features."
              : "Your payment was successful. Your subscription is being activated..."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isActive ? (
            <>
              {/* Subscription Details */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <h3 className="font-semibold text-lg">Subscription Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium">Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">$12/month</span>
                  </div>
                  {currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Next billing date:
                      </span>
                      <span className="font-medium">{currentPeriodEnd}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pro Features */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">What's Included</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Unlimited invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Unlimited clients</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Stripe payment links</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Email sending</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Analytics dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Custom branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="flex-1">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/invoices">Create Invoice</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Activation in Progress */}
              <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  Activating your Pro subscription... This usually takes a few
                  seconds.
                </p>
              </div>

              <Button asChild className="w-full">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
