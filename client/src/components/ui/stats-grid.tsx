import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Standardized grid container for stats cards
 * Default is 4 columns on large screens
 */
export function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4 mb-6", gridCols[columns], className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  variant?: "default" | "highlight" | "muted";
  className?: string;
}

/**
 * Standardized stat card component
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-muted-foreground",
  valueColor,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    default: "",
    highlight: "bg-card/50",
    muted: "bg-muted/30",
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-sm font-medium">
          {title}
        </CardDescription>
        {Icon && <Icon className={cn("h-4 w-4", iconColor)} />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardCompactProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

/**
 * Compact stat card with icon on left (used in Expenses)
 */
export function StatCardCompact({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-muted-foreground",
  className,
}: StatCardCompactProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className={cn("w-8 h-8", iconColor)} />}
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export { StatsGrid as default };
