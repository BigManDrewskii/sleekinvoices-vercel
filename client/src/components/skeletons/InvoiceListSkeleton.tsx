/**
 * Invoice List Skeleton
 *
 * Provides loading skeleton for the invoices table/list view
 * with both desktop table and mobile card layouts.
 */

import { Skeleton, SkeletonBadge } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface InvoiceListSkeletonProps {
  /** Number of rows to display */
  rows?: number;
}

/**
 * Desktop table skeleton for invoices
 */
function InvoiceTableSkeleton({ rows = 15 }: InvoiceListSkeletonProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[auto_minmax(100px,1fr)_minmax(120px,1fr)_100px_100px_100px_80px_80px_auto] gap-4 px-4 py-3 bg-muted/30 border-b border-border items-center">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-8" />
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_minmax(100px,1fr)_minmax(120px,1fr)_100px_100px_100px_80px_80px_auto] gap-4 px-4 py-4 items-center"
          >
            {/* Checkbox */}
            <Skeleton className="h-4 w-4 rounded" />
            {/* Invoice # */}
            <Skeleton className="h-4 w-24" />
            {/* Client */}
            <Skeleton className="h-4 w-32" />
            {/* Issue Date */}
            <Skeleton className="h-4 w-20" />
            {/* Due Date */}
            <Skeleton className="h-4 w-20" />
            {/* Amount */}
            <Skeleton className="h-4 w-20" />
            {/* Payment Badge */}
            <SkeletonBadge />
            {/* Status Badge */}
            <SkeletonBadge />
            {/* Actions */}
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mobile card skeleton for invoices
 */
function InvoiceCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-24" />
            <SkeletonBadge />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-20 ml-auto" />
          <SkeletonBadge className="ml-auto" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Combined skeleton that shows appropriate layout based on screen size
 */
export function InvoiceListSkeleton({ rows = 15 }: InvoiceListSkeletonProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <InvoiceTableSkeleton rows={rows} />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: Math.min(rows, 8) }).map((_, i) => (
          <InvoiceCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

/**
 * Skeleton for invoice filters area
 */
export function InvoiceFiltersSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
      <Skeleton className="h-10 w-full sm:w-80 rounded-lg" />
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Skeleton className="h-10 flex-1 sm:w-32 rounded-lg" />
        <Skeleton className="h-10 flex-1 sm:w-32 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Full page skeleton including filters and table
 */
export function InvoicesPageSkeleton() {
  return (
    <div className="space-y-4">
      <InvoiceFiltersSkeleton />
      <InvoiceListSkeleton />
    </div>
  );
}
