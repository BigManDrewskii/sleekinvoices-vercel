import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsDateRangeFilterProps {
  value: "7d" | "30d" | "90d" | "1y";
  onChange: (value: "7d" | "30d" | "90d" | "1y") => void;
  className?: string;
}

const DATE_RANGES = [
  { value: "7d" as const, label: "Last 7 days", shortLabel: "7D" },
  { value: "30d" as const, label: "Last 30 days", shortLabel: "30D" },
  { value: "90d" as const, label: "Last 90 days", shortLabel: "90D" },
  { value: "1y" as const, label: "Last year", shortLabel: "1Y" },
];

export function AnalyticsDateRangeFilter({
  value,
  onChange,
  className,
}: AnalyticsDateRangeFilterProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Mobile: Select dropdown */}
      <div className="md:hidden">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: Button group */}
      <div className="hidden md:flex items-center gap-2 bg-muted p-1 rounded-lg">
        {DATE_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={value === range.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(range.value)}
            className={cn(
              "px-3 h-8 text-xs font-medium transition-all",
              value === range.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {range.shortLabel}
          </Button>
        ))}
      </div>
    </div>
  );
}
