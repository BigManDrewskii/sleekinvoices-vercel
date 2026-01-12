import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, RefreshCw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSectionProps {
  children?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  hasActiveFilters?: boolean;
  showRefresh?: boolean;
  className?: string;
}

export function FilterSection({
  children,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  onClearFilters,
  onRefresh,
  hasActiveFilters = false,
  showRefresh = false,
  className,
}: FilterSectionProps) {
  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search Input */}
          {onSearchChange && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {/* Filter Controls */}
          {children}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {hasActiveFilters && onClearFilters && (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            {showRefresh && onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterSelectProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function FilterSelect({ label, children, className }: FilterSelectProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="text-sm text-muted-foreground block">{label}</label>
      )}
      {children}
    </div>
  );
}

interface ActiveFiltersProps {
  filters: Array<{
    key: string;
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  className?: string;
}

export function ActiveFilters({ filters, className }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 mt-4 pt-4 border-t", className)}>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md"
        >
          {filter.label}: {filter.value}
          <button
            onClick={filter.onRemove}
            className="hover:text-primary/70 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export { FilterSection as default };
