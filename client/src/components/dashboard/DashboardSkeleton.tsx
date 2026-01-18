/**
 * Dashboard Skeleton Components
 *
 * Provides loading skeleton placeholders for dashboard elements
 * to improve perceived performance during data fetching.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonCircle,
} from "@/components/ui/skeleton";

/**
 * Skeleton for individual stat cards on the dashboard
 */
export function StatCardSkeleton() {
  return (
    <Card className="border-border">
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
 * Skeleton for the stats grid (4 cards)
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
 * Skeleton for individual invoice row in recent invoices
 */
export function InvoiceRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
      <div className="flex items-center gap-4">
        <SkeletonCircle size="md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <SkeletonBadge />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

/**
 * Skeleton for recent invoices section
 */
export function RecentInvoicesSkeleton() {
  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <InvoiceRowSkeleton />
          <InvoiceRowSkeleton />
          <InvoiceRowSkeleton />
          <InvoiceRowSkeleton />
          <InvoiceRowSkeleton />
        </div>
      </CardContent>
    </Card>
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
            <SkeletonCircle size="sm" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Full dashboard skeleton for initial page load
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Monthly usage skeleton */}
      <MonthlyUsageCardSkeleton />

      {/* Stats grid skeleton */}
      <StatsGridSkeleton />

      {/* Recent invoices skeleton */}
      <RecentInvoicesSkeleton />
    </div>
  );
}
