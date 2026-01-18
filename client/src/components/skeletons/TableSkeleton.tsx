/**
 * Table Skeleton Components
 *
 * Provides loading skeleton placeholders for data tables
 * with configurable columns and rows.
 */

import {
  Skeleton,
  SkeletonBadge,
  SkeletonCircle,
} from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Column configuration */
  columns: ColumnConfig[];
  /** Whether to show checkbox column */
  showCheckbox?: boolean;
  /** Whether to show actions column */
  showActions?: boolean;
  /** Additional class names */
  className?: string;
}

interface ColumnConfig {
  /** Width class for the column */
  width?: string;
  /** Type of skeleton to show */
  type: "text" | "badge" | "avatar" | "date" | "currency" | "icon";
}

/**
 * Generic table skeleton with configurable columns
 */
export function TableSkeleton({
  rows = 10,
  columns,
  showCheckbox = false,
  showActions = false,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Table header skeleton */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
        {showCheckbox && <Skeleton className="h-4 w-4 rounded" />}
        {columns.map((col, i) => (
          <Skeleton key={i} className={cn("h-4", col.width || "flex-1")} />
        ))}
        {showActions && <Skeleton className="h-4 w-16" />}
      </div>

      {/* Table rows skeleton */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
            {showCheckbox && <Skeleton className="h-4 w-4 rounded" />}
            {columns.map((col, colIndex) => (
              <div
                key={colIndex}
                className={cn("flex-shrink-0", col.width || "flex-1")}
              >
                {renderColumnSkeleton(col.type)}
              </div>
            ))}
            {showActions && (
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderColumnSkeleton(type: ColumnConfig["type"]) {
  switch (type) {
    case "avatar":
      return <SkeletonCircle size="sm" />;
    case "badge":
      return <SkeletonBadge />;
    case "date":
      return <Skeleton className="h-4 w-24" />;
    case "currency":
      return <Skeleton className="h-4 w-20" />;
    case "icon":
      return <Skeleton className="h-5 w-5 rounded" />;
    case "text":
    default:
      return <Skeleton className="h-4 w-full max-w-[200px]" />;
  }
}

/**
 * Pre-configured skeleton for Clients table
 */
export function ClientsTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-muted/30 border-b border-border">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-4 items-center"
          >
            {/* Name */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
            </div>
            {/* Contact */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            {/* Company */}
            <Skeleton className="h-4 w-28" />
            {/* VAT */}
            <Skeleton className="h-4 w-16" />
            {/* Address */}
            <Skeleton className="h-4 w-32" />
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pre-configured skeleton for Invoices table
 */
export function InvoicesTableSkeleton({ rows = 15 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
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

      {/* Rows */}
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
 * Pre-configured skeleton for Expenses table
 */
export function ExpensesTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_100px_100px_100px_80px_auto] gap-4 px-4 py-3 bg-muted/30 border-b border-border">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_100px_100px_100px_80px_auto] gap-4 px-4 py-4 items-center"
          >
            {/* Expand button */}
            <Skeleton className="h-6 w-6 rounded" />
            {/* Description */}
            <Skeleton className="h-4 w-48" />
            {/* Amount */}
            <Skeleton className="h-4 w-20" />
            {/* Date */}
            <Skeleton className="h-4 w-20" />
            {/* Category */}
            <SkeletonBadge />
            {/* Billable */}
            <Skeleton className="h-4 w-12" />
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple row skeleton for lists
 */
export function ListRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
      <div className="flex items-center gap-4">
        <SkeletonCircle size="md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
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
 * Skeleton for filter/search area above tables
 */
export function TableFilterskeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
      <Skeleton className="h-10 w-full sm:w-80 rounded-lg" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for pagination
 */
export function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}
