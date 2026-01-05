import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSort?: { key: string; direction: "asc" | "desc" };
  onSort: (key: string) => void;
  className?: string;
  align?: "left" | "center" | "right";
}

export function SortableTableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
  align = "left",
}: SortableTableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const isAscending = currentSort?.direction === "asc";

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <TableHead
      onClick={() => onSort(sortKey)}
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 transition-colors",
        alignClass,
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {isActive && (
          <span className="inline-flex">
            {isAscending ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );
}
