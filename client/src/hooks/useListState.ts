import { useState, useMemo } from "react";

export interface UseListStateProps<T> {
  data: T[];
  searchFields?: (keyof T)[];
  defaultSort: {
    field: keyof T;
    direction: "asc" | "desc";
  };
}

/**
 * Comprehensive list state management hook
 * Handles search, sort, and bulk selection for list pages
 */
export function useListState<T extends Record<string, any>>({
  data = [],
  searchFields = [],
  defaultSort,
}: UseListStateProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof T>(defaultSort.field);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    defaultSort.direction
  );

  // Search filtering
  const filtered = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      // Handle null/undefined
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal === bVal) return 0;

      // Compare
      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortField, sortDirection]);

  const toggleSort = (field: keyof T) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return {
    items: sorted,
    searchQuery,
    setSearchQuery,
    sortField,
    sortDirection,
    toggleSort,
    filteredCount: filtered.length,
    totalCount: data.length,
  };
}

/**
 * Bulk selection hook for checkbox-based multi-select
 * Works with Set<number> for efficient lookups
 */
export function useBulkSelection(allItemIds: number[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(allItemIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isSelected = (id: number) => selectedIds.has(id);

  const getSelectedCount = () => selectedIds.size;

  const getSelectedIds = () => Array.from(selectedIds);

  return {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedCount,
    getSelectedIds,
    hasSelection: selectedIds.size > 0,
    isAllSelected: allItemIds.length > 0 && selectedIds.size === allItemIds.length,
  };
}
