import { CheckCircle2, AlertCircle, TrendingUp, Infinity, Zap, Crown } from "lucide-react";
import { Link } from "wouter";

interface MonthlyUsageCardProps {
  invoicesCreatedThisMonth: number;
  invoiceLimit?: number;
}

export function MonthlyUsageCard({
  invoicesCreatedThisMonth,
  invoiceLimit,
}: MonthlyUsageCardProps) {
  // Pro users - elegant, compact inline display
  if (!invoiceLimit) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 px-4 py-3 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
        {/* Subtle animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Infinity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Unlimited Invoices</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {invoicesCreatedThisMonth} created this month
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500 tracking-wide uppercase">Pro</span>
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round((invoicesCreatedThisMonth / invoiceLimit) * 100);
  const remaining = Math.max(0, invoiceLimit - invoicesCreatedThisMonth);
  const isNearLimit = percentage >= 70;
  const isAtLimit = percentage >= 90;

  // Determine status styling
  let accentColor = "emerald";
  let StatusIcon = CheckCircle2;
  let statusBg = "bg-emerald-500/10";
  let statusRing = "ring-emerald-500/20";
  let statusText = "text-emerald-500";
  let progressBg = "bg-emerald-500";
  let gradientFrom = "from-emerald-500/5";
  let gradientTo = "to-emerald-500/10";
  let shadowColor = "shadow-emerald-500/10";
  let statusMessage = "You're doing great!";

  if (isAtLimit) {
    accentColor = "red";
    StatusIcon = AlertCircle;
    statusBg = "bg-red-500/10";
    statusRing = "ring-red-500/20";
    statusText = "text-red-500";
    progressBg = "bg-red-500";
    gradientFrom = "from-red-500/5";
    gradientTo = "to-red-500/10";
    shadowColor = "shadow-red-500/10";
    statusMessage = "Upgrade for unlimited invoices";
  } else if (isNearLimit) {
    accentColor = "amber";
    StatusIcon = TrendingUp;
    statusBg = "bg-amber-500/10";
    statusRing = "ring-amber-500/20";
    statusText = "text-amber-500";
    progressBg = "bg-amber-500";
    gradientFrom = "from-amber-500/5";
    gradientTo = "to-amber-500/10";
    shadowColor = "shadow-amber-500/10";
    statusMessage = "Running low on invoices";
  }

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${gradientFrom} ${gradientTo} p-5 transition-all duration-300 hover:border-border hover:shadow-xl ${shadowColor}`}>
      {/* Decorative elements */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl opacity-50" />
      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-tr from-primary/5 to-transparent blur-xl opacity-30" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${statusBg} ring-1 ${statusRing} transition-transform duration-300 group-hover:scale-105`}>
              <StatusIcon className={`h-5 w-5 ${statusText}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Monthly Usage</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{statusMessage}</p>
            </div>
          </div>
          
          {/* Usage Counter */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tabular-nums text-foreground">{invoicesCreatedThisMonth}</span>
              <span className="text-lg text-muted-foreground font-medium">/ {invoiceLimit}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">invoices created</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/30">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${progressBg}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${statusText}`}>{percentage}%</span>
              <span className="text-xs text-muted-foreground">used</span>
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{remaining}</span> remaining
            </span>
          </div>
        </div>

        {/* Upgrade CTA for users near/at limit */}
        {isNearLimit && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <Link href="/settings?tab=billing">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 group/cta">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upgrade to Pro</p>
                    <p className="text-xs text-muted-foreground">Unlimited invoices & premium features</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 -translate-x-2 group-hover/cta:opacity-100 group-hover/cta:translate-x-0 transition-all duration-200">
                  <span>Upgrade</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
