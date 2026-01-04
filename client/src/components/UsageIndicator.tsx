/**
 * UsageIndicator Component
 * 
 * Displays current month's invoice usage for free tier users
 * Shows "X/3 invoices used this month" with visual progress bar
 * Includes upgrade prompt when approaching or at limit
 */

import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function UsageIndicator() {
  const { data: usage, isLoading } = trpc.subscription.getUsage.useQuery();

  // Don't show for Pro users
  if (usage?.isPro) {
    return null;
  }

  if (isLoading || !usage) {
    return null;
  }

  const { invoicesCreated, limit, remaining } = usage;
  const percentage = limit ? (invoicesCreated / limit) * 100 : 0;
  const atLimit = remaining === 0;
  const nearLimit = remaining !== null && remaining <= 1 && !atLimit;

  return (
    <div className="space-y-3">
      {/* Usage Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Invoices this month
        </span>
        <span className="font-medium">
          {invoicesCreated} / {limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            atLimit && "[&>div]:bg-destructive",
            nearLimit && "[&>div]:bg-yellow-500"
          )}
        />
      </div>

      {/* Warning/Limit Messages */}
      {atLimit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Limit reached!</strong> You've created {limit} invoices this month.
            <Link href="/subscription">
              <Button variant="link" size="sm" className="h-auto p-0 ml-1">
                Upgrade to Pro
              </Button>
            </Link>
            {" "}for unlimited invoices.
          </AlertDescription>
        </Alert>
      )}

      {nearLimit && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Only {remaining} invoice{remaining === 1 ? '' : 's'} remaining this month.
            <Link href="/subscription">
              <Button variant="link" size="sm" className="h-auto p-0 ml-1">
                Upgrade to Pro
              </Button>
            </Link>
            {" "}for unlimited access.
          </AlertDescription>
        </Alert>
      )}

      {/* Always show upgrade CTA for free users */}
      {!atLimit && !nearLimit && (
        <Link href="/subscription">
          <Button variant="outline" size="sm" className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Pro - Unlimited Invoices
          </Button>
        </Link>
      )}
    </div>
  );
}
