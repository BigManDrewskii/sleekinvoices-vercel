import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

interface AnalyticsMetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}

export function AnalyticsMetricCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
  valueClassName,
}: AnalyticsMetricCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 relative z-10">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="space-y-2">
          <div
            className={cn("text-3xl font-bold tracking-tight", valueClassName)}
          >
            {value}
          </div>

          {/* Subtitle and Trend */}
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  trend.isPositive
                    ? "text-green-600 bg-green-50 dark:bg-green-950/30"
                    : "text-destructive bg-destructive/10"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {Math.abs(trend.value)}% {trend.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
