import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

interface MonthlyUsageCardProps {
  invoicesCreatedThisMonth: number;
  invoiceLimit?: number;
}

export function MonthlyUsageCard({
  invoicesCreatedThisMonth,
  invoiceLimit,
}: MonthlyUsageCardProps) {
  // If no limit, show unlimited message
  if (!invoiceLimit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>Track your invoice creation limit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Unlimited Invoices</p>
              <p className="text-xs text-muted-foreground">
                {invoicesCreatedThisMonth} invoice{invoicesCreatedThisMonth !== 1 ? "s" : ""} created this month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = Math.round((invoicesCreatedThisMonth / invoiceLimit) * 100);
  const remaining = Math.max(0, invoiceLimit - invoicesCreatedThisMonth);

  // Determine color based on usage percentage
  let statusColor = "bg-green-500"; // 0-70%
  let statusLabel = "Good";
  let statusIcon = CheckCircle2;

  if (percentage >= 90) {
    statusColor = "bg-red-500";
    statusLabel = "Critical";
    statusIcon = AlertCircle;
  } else if (percentage >= 70) {
    statusColor = "bg-yellow-500";
    statusLabel = "Warning";
    statusIcon = TrendingUp;
  }

  const StatusIcon = statusIcon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Usage</CardTitle>
        <CardDescription>Track your invoice creation limit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">{invoicesCreatedThisMonth}</p>
            <p className="text-xs text-muted-foreground">invoices created</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-muted-foreground">{remaining}</p>
            <p className="text-xs text-muted-foreground">remaining</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{percentage}%</span>
            <span className="text-xs text-muted-foreground">
              {invoicesCreatedThisMonth} of {invoiceLimit}
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pt-2">
          <StatusIcon className={`h-4 w-4 ${statusColor === "bg-green-500" ? "text-green-500" : statusColor === "bg-yellow-500" ? "text-yellow-500" : "text-red-500"}`} />
          <span className="text-sm font-medium text-foreground">{statusLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
