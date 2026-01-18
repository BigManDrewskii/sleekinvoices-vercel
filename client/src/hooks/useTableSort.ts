import { useState } from "react";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: string;
  direction: SortDirection;
}

interface UseTableSortOptions {
  defaultKey?: string;
  defaultDirection?: SortDirection;
}

export function useTableSort(options: UseTableSortOptions = {}) {
  const [sort, setSort] = useState<SortState>({
    key: options.defaultKey || "",
    direction: options.defaultDirection || "asc",
  });

  const handleSort = (key: string) => {
    setSort(prev => {
      // If clicking the same column, toggle direction
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      // If clicking a new column, sort ascending
      return {
        key,
        direction: "asc",
      };
    });
  };

  const sortData = <T extends Record<string, any>>(data: T[]): T[] => {
    if (!sort.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sort.direction === "asc" ? 1 : -1;
      if (bValue == null) return sort.direction === "asc" ? -1 : 1;

      // Handle numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        const diff = aValue.getTime() - bValue.getTime();
        return sort.direction === "asc" ? diff : -diff;
      }

      // Handle strings
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sort.direction === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  };

  return {
    sort,
    handleSort,
    sortData,
  };
}
