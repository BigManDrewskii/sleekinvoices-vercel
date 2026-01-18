/**
 * Expenses Page Skeleton
 *
 * Provides loading skeleton for the expenses page
 * including stats cards and expenses table.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonButton,
} from "@/components/ui/skeleton";

/**
 * Skeleton for expense stats cards
 */
function ExpenseStatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-28 mt-2" />
        <Skeleton className="h-3 w-20 mt-2" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for expense stats grid
 */
export function ExpenseStatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <ExpenseStatsCardSkeleton />
      <ExpenseStatsCardSkeleton />
      <ExpenseStatsCardSkeleton />
      <ExpenseStatsCardSkeleton />
    </div>
  );
}

/**
 * Skeleton for expense filters
 */
export function ExpenseFiltersSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Skeleton className="h-10 w-36 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Skeleton className="h-10 w-28 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton for single expense row
 */
function ExpenseRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      {/* Expand button */}
      <Skeleton className="h-6 w-6 rounded" />
      {/* Description */}
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      {/* Amount */}
      <Skeleton className="h-5 w-20" />
      {/* Date */}
      <Skeleton className="h-4 w-24" />
      {/* Category */}
      <SkeletonBadge />
      {/* Billable */}
      <Skeleton className="h-4 w-16" />
      {/* Actions */}
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for expenses table
 */
export function ExpensesTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <SkeletonButton />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_100px_100px_100px_80px_auto] gap-4 px-4 py-3 bg-muted/30 border-y border-border">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Table Rows */}
        <div>
          {Array.from({ length: rows }).map((_, i) => (
            <ExpenseRowSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Full expenses page skeleton
 */
export function ExpensesPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <ExpenseStatsGridSkeleton />

      {/* Filters */}
      <ExpenseFiltersSkeleton />

      {/* Table */}
      <ExpensesTableSkeleton />
    </div>
  );
}
