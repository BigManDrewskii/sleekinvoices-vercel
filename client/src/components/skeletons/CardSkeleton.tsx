/**
 * Card Skeleton Components
 *
 * Provides loading skeleton placeholders for various card types
 * including stat cards, content cards, and feature cards.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonButton,
} from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton for stat/metric cards (e.g., Total Revenue, Outstanding)
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <SkeletonBadge />
        </div>
        <Skeleton className="h-9 w-32 mt-2" />
        <Skeleton className="h-3 w-28 mt-3" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for the dashboard stats grid (4 cards)
 */
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
}

/**
 * Skeleton for content cards with header and body
 */
export function ContentCardSkeleton({
  className,
  showHeader = true,
  bodyLines = 3,
}: {
  className?: string;
  showHeader?: boolean;
  bodyLines?: number;
}) {
  return (
    <Card className={cn("border-border", className)}>
      {showHeader && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <SkeletonButton size="sm" />
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: bodyLines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i === bodyLines - 1 ? "w-3/4" : "w-full")}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for feature/info cards with icon
 */
export function FeatureCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for template/grid cards
 */
export function TemplateCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border overflow-hidden", className)}>
      {/* Preview area */}
      <div className="aspect-[4/3] bg-muted/30">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center justify-between mt-4">
          <SkeletonBadge />
          <SkeletonButton size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for templates grid
 */
export function TemplatesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <TemplateCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for monthly usage card
 */
export function MonthlyUsageCardSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for analytics chart cards
 */
export function ChartCardSkeleton({
  className,
  height = "h-64",
}: {
  className?: string;
  height?: string;
}) {
  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonButton size="sm" />
            <SkeletonButton size="sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("relative", height)}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-6" />
          </div>

          {/* Chart area */}
          <div className="ml-14 h-full flex items-end gap-2 pb-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton
                  className="w-full rounded-t"
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-14 right-0 flex justify-between">
            {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map(
              (_, i) => (
                <Skeleton key={i} className="h-3 w-6" />
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for pie/donut chart cards
 */
export function PieChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for subscription/plan cards
 */
export function PlanCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <SkeletonBadge />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-1">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        <SkeletonButton className="w-full" />
      </CardContent>
    </Card>
  );
}
