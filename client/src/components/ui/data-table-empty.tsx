import * as React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { Skeleton } from "@/components/skeletons";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DataTableEmptyProps {
  colSpan: number;
  preset?: keyof typeof EmptyStatePresets;
  title?: string;
  description?: string;
  illustration?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DataTableEmpty({
  colSpan,
  preset,
  title,
  description,
  illustration,
  action,
  size = "sm",
  className,
}: DataTableEmptyProps) {
  const presetProps = preset ? EmptyStatePresets[preset] : null;

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className={cn("py-8", className)}>
        <EmptyState
          title={title || presetProps?.title || "No data"}
          description={description || presetProps?.description || ""}
          illustration={illustration || presetProps?.illustration}
          action={action}
          size={size}
        />
      </TableCell>
    </TableRow>
  );
}

interface DataTableLoadingProps {
  colSpan: number;
  rows?: number;
  className?: string;
}

export function DataTableLoading({
  colSpan,
  rows = 5,
  className,
}: DataTableLoadingProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: colSpan }).map((_, j) => (
            <TableCell key={j} className={className}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

interface DataTableNoResultsProps {
  colSpan: number;
  title?: string;
  description?: string;
  onClearFilters?: () => void;
  className?: string;
}

export function DataTableNoResults({
  colSpan,
  title = "No matching results",
  description = "No items match your current filters",
  onClearFilters,
  className,
}: DataTableNoResultsProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className={cn("py-8", className)}>
        <EmptyState
          illustration="/sleeky/empty-states/search-results.png"
          title={title}
          description={description}
          action={
            onClearFilters
              ? {
                  label: "Clear Filters",
                  onClick: onClearFilters,
                }
              : undefined
          }
          size="sm"
        />
      </TableCell>
    </TableRow>
  );
}

export { DataTableEmpty as default };
