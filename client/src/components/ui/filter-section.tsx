import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
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
  showSearch?: boolean;
  activeFilters?: Array<{
    key: string;
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  onClearAll?: () => void;
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
  showSearch = true,
  className,
  activeFilters = [],
  onClearAll,
}: FilterSectionProps) {
  return (
    <Card className={cn("mb-6 shadow-sm border-border/60", className)}>
      <CardContent className="p-4 md:p-5 lg:p-6">
        {/* Search Row - Always prominent */}
        {onSearchChange && showSearch && (
          <div className="mb-4 md:mb-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue || ""}
                onChange={e => onSearchChange(e.target.value)}
                aria-label={searchPlaceholder.replace("...", "")}
                className="pl-12 h-11 md:h-12 text-sm rounded-lg border-border/60 bg-background shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
              {activeFilters.map(filter => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/8 text-primary text-xs font-medium rounded-lg border border-primary/20 shadow-xs transition-all hover:bg-primary/12 hover:border-primary/30"
                >
                  <span className="text-primary/70">{filter.label}:</span>
                  {filter.value}
                  <button
                    type="button"
                    onClick={filter.onRemove}
                    className="ml-1 p-0.5 rounded-md hover:bg-primary/20 transition-colors"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {onClearAll && activeFilters.length > 1 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 flex-1">
            {children}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 md:ml-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/40 md:border-none w-full md:w-auto">
            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground h-9 px-3 rounded-lg"
              >
                <X className="h-4 w-4 mr-1.5" />
                Clear
              </Button>
            )}

            {showRefresh && onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="h-9 px-3 rounded-lg border-border/60"
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
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
  id?: string;
  label?: string;
  children: React.ReactNode;
  className?: string;
  hideLabel?: boolean;
  icon?: React.ReactNode;
}

export function FilterSelect({
  id,
  label,
  children,
  className,
  hideLabel = false,
  icon,
}: FilterSelectProps) {
  return (
    <div className={cn("min-w-[140px] md:min-w-[160px]", className)}>
      {!hideLabel && label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-muted-foreground mb-1.5 block ml-0.5"
        >
          {label}
        </label>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

export { FilterSection as default };
