# Table Design System - SleekInvoices

**Last Updated**: January 12, 2026
**Version**: 1.0.0

## Overview

This document defines the standardized table design system used across all data tables in SleekInvoices. All table pages (Expenses, Payments, EmailHistory, Products, Clients, Invoices, Estimates) follow these consistent patterns for pagination, sorting, filtering, and styling.

## Design Principles

1. **Consistency** - All tables use the same components and patterns
2. **Flexibility** - Each table can opt-in to features as needed
3. **Accessibility** - Keyboard navigation, ARIA labels, screen reader support
4. **Responsiveness** - Mobile-friendly with proper touch targets
5. **Performance** - Client-side pagination and sorting for optimal UX

---

## Standard Components Library

### Core Components

#### 1. Pagination (`@/components/shared/Pagination`)

**Purpose**: Standardized pagination with page numbers and size selector

**Props**:

```typescript
{
  currentPage: number;        // 1-based page index
  totalPages: number;         // Total number of pages
  pageSize: number;           // Items per page
  totalItems: number;         // Total items count
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions: number[];  // [10, 25, 50, 100]
}
```

**Features**:

- 1-based page indexing (page 1 = first page)
- Shows up to 5 page number buttons
- Page size selector dropdown
- Shows item count (e.g., "Showing 1 to 25 of 100")
- Disabled state for first/last pages

#### 2. SortableTableHeader (`@/components/shared/SortableTableHeader`)

**Purpose**: Clickable table header with visual sort indicators

**Props**:

```typescript
{
  label: string;              // Column label
  sortKey: string;            // Key to sort by
  currentSort: SortState;     // Current sort state
  onSort: (key: string) => void;
  align?: "left" | "center" | "right";
}
```

**Features**:

- Chevron icon indicates sort direction
- Toggles asc/desc on click
- Hover state for better UX
- Supports text alignment

#### 3. FilterSection (`@/components/ui/filter-section`)

**Purpose**: Consistent filter UI container

**Components**:

- `FilterSection` - Container with clear filters button
- `FilterSelect` - Labeled filter dropdown wrapper
- `ActiveFilters` - Visual display of active filters

**Props**:

```typescript
FilterSection: {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  children: ReactNode;
}

FilterSelect: {
  label: string;
  children: ReactNode;  // Select component
}
```

#### 4. useTableSort Hook (`@/hooks/useTableSort`)

**Purpose**: State management for sorting

**Returns**:

```typescript
{
  sort: { key: string; direction: "asc" | "desc" };
  handleSort: (key: string) => void;
  sortData: <T>(data: T[]) => T[];
}
```

**Features**:

- Handles sort state
- Toggle direction on same column click
- Generic sort function (strings, numbers, dates)
- Nested property support

---

## Standard Table Structure

### Card Wrapper Pattern

```tsx
<Card className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm">
  <CardHeader>
    <CardTitle>Table Title</CardTitle>
    <CardDescription>
      {filteredAndSortedItems.length} item
      {filteredAndSortedItems.length !== 1 ? "s" : ""} found
    </CardDescription>
  </CardHeader>

  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <SortableTableHeader
            label="Column 1"
            sortKey="field1"
            currentSort={sort}
            onSort={handleSort}
          />
          <SortableTableHeader
            label="Column 2"
            sortKey="field2"
            currentSort={sort}
            onSort={handleSort}
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <DataTableLoading colSpan={3} rows={5} />
        ) : !items || filteredAndSortedItems.length === 0 ? (
          <tr>
            <td colSpan={3}>
              <EmptyState {...EmptyStatePresets.tableName} />
            </td>
          </tr>
        ) : (
          paginatedItems.map(item => (
            <TableRow
              key={item.id}
              className="hover:bg-muted/50 cursor-pointer"
            >
              <TableCell className="p-2">{item.field1}</TableCell>
              <TableCell className="p-2">{item.field2}</TableCell>
              <TableCell className="p-2 text-right">
                <DropdownMenu>...</DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </CardContent>

  {/* Pagination */}
  {totalPages > 1 && (
    <div className="px-5 pb-4 border-t border-border/20 pt-4">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={size => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        pageSizeOptions={[10, 25, 50, 100]}
      />
    </div>
  )}
</Card>
```

---

## Standard State Management

### Required State

```typescript
// Pagination
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(25); // Default varies by table

// Sorting
const { sort, handleSort, sortData } = useTableSort({
  defaultKey: "primaryField",
  defaultDirection: "desc",
});

// Filters (example)
const [searchQuery, setSearchQuery] = useState("");
const [statusFilter, setStatusFilter] = useState<string>("all");
const [dateRange, setDateRange] = useState<string>("all");
```

### Standard Filter and Sort Logic

```typescript
const filteredAndSortedItems = useMemo(() => {
  if (!items) return [];

  let result = [...items];

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      item =>
        item.field1.toLowerCase().includes(query) ||
        item.field2?.toLowerCase().includes(query)
    );
  }

  // Apply category/status filters
  if (statusFilter !== "all") {
    result = result.filter(item => item.status === statusFilter);
  }

  // Apply date range filter
  if (dateRange !== "all") {
    const now = new Date();
    result = result.filter(item => {
      const itemDate = new Date(item.date);

      switch (dateRange) {
        case "today":
          return itemDate.toDateString() === now.toDateString();
        case "7days":
          return itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "30days":
          return itemDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "90days":
          return itemDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case "year":
          return (
            itemDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          );
        default:
          return true;
      }
    });
  }

  // Apply sorting
  return sortData(result);
}, [items, searchQuery, statusFilter, dateRange, sortData]);

// Pagination calculations
const totalItems = filteredAndSortedItems.length;
const totalPages = Math.ceil(totalItems / pageSize);
const paginatedItems = filteredAndSortedItems.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);

// Reset to page 1 when filters change
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter, dateRange]);
```

---

## Standard Filter Pattern

### FilterSection Implementation

```tsx
<FilterSection
  hasActiveFilters={hasActiveFilters}
  onClearFilters={clearFilters}
>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
    {/* Search Input */}
    <div className="relative flex-1">
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
    </div>

    {/* Standard Date Range Filter */}
    <FilterSelect label="Date Range">
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger>
          <SelectValue placeholder="All Time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="7days">Last 7 Days</SelectItem>
          <SelectItem value="30days">Last 30 Days</SelectItem>
          <SelectItem value="90days">Last 90 Days</SelectItem>
          <SelectItem value="year">Last Year</SelectItem>
        </SelectContent>
      </Select>
    </FilterSelect>

    {/* Custom filters as needed */}
  </div>
</FilterSection>
```

### Clear Filters Function

```typescript
const clearFilters = () => {
  setSearchQuery("");
  setStatusFilter("all");
  setDateRange("all");
  // ... reset other filters
  setCurrentPage(1);
};

const hasActiveFilters = !!(
  (searchQuery || statusFilter !== "all" || dateRange !== "all")
  // ... check other filters
);
```

---

## Styling Standards

### Table Card Styling

**Card Classes**:

```
rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm
```

**Header Structure**:

```tsx
<CardHeader>
  <CardTitle>Table Title</CardTitle>
  <CardDescription>
    {count} item{count !== 1 ? "s" : ""} found
  </CardDescription>
</CardHeader>
```

### Row Styling

**Standard Row Classes**:

```
hover:bg-muted/50 cursor-pointer transition-colors
```

**Cell Padding**:

```
className="p-2"  // Standard cell padding
```

**Text Alignment**:

```
// Left (default)
<TableCell>Content</TableCell>

// Right (for numbers/amounts)
<TableCell className="text-right">$100.00</TableCell>

// Center
<TableCell className="text-center">Badge</TableCell>
```

### Pagination Spacing

**Standard Padding**:

```tsx
<div className="px-5 pb-4 border-t border-border/20 pt-4">
  <Pagination ... />
</div>
```

- `px-5` - Horizontal padding matches card content
- `pb-4` - Bottom padding
- `pt-4` - Top padding
- `border-t border-border/20` - Top border separator

---

## Page-Specific Defaults

| Page             | Default Page Size | Default Sort      | Sortable Columns                                |
| ---------------- | ----------------- | ----------------- | ----------------------------------------------- |
| **Expenses**     | 25                | Date (desc)       | Date, Amount, Category, Description             |
| **Payments**     | 10                | Date (desc)       | Date, Amount                                    |
| **EmailHistory** | 20                | Sent Date (desc)  | Sent Date, Type, Status                         |
| **Products**     | 25                | Name (asc)        | Name, Rate, Category                            |
| **Clients**      | 25                | Name (asc)        | Name, Email                                     |
| **Invoices**     | 15                | Created (desc)    | 7+ columns                                      |
| **Estimates**    | 25                | Issue Date (desc) | Estimate #, Client, Status, Valid Until, Amount |

---

## Common Patterns

### 1. Pagination Pattern

**Standard Setup**:

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(25);

const totalItems = filteredAndSortedItems.length;
const totalPages = Math.ceil(totalItems / pageSize);
const paginatedItems = filteredAndSortedItems.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);
```

**Always use 1-based indexing** for consistency and user familiarity.

### 2. Sorting Pattern

**Use useTableSort hook**:

```typescript
const { sort, handleSort, sortData } = useTableSort({
  defaultKey: "date",
  defaultDirection: "desc",
});

// In filter/sort logic:
const result = sortData(filteredItems);
```

**In table header**:

```tsx
<SortableTableHeader
  label="Column Name"
  sortKey="fieldName"
  currentSort={sort}
  onSort={handleSort}
/>
```

### 3. Date Range Filtering Pattern

**Standard Options**:

- All Time (default)
- Today
- Last 7 Days
- Last 30 Days
- Last 90 Days
- Last Year

**Standard Logic**:

```typescript
if (dateRange !== "all") {
  const now = new Date();
  result = result.filter(item => {
    const itemDate = new Date(item.dateField);

    switch (dateRange) {
      case "today":
        return itemDate.toDateString() === now.toDateString();
      case "7days":
        return itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30days":
        return itemDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90days":
        return itemDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "year":
        return itemDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });
}
```

### 4. Empty State Pattern

**Loading State**:

```tsx
{isLoading ? (
  <DataTableLoading colSpan={columnCount} rows={5} />
) : ...}
```

**No Data**:

```tsx
{!items || items.length === 0 ? (
  <tr>
    <td colSpan={columnCount}>
      <EmptyState
        {...EmptyStatePresets.tableName}
        action={{
          label: "Add Item",
          onClick: handleAdd,
          icon: Plus,
        }}
      />
    </td>
  </tr>
) : ...}
```

**No Results (Filtered)**:

```tsx
{filteredItems.length === 0 ? (
  <tr>
    <td colSpan={columnCount}>
      <EmptyState
        {...EmptyStatePresets.search}
        size="sm"
      />
    </td>
  </tr>
) : ...}
```

---

## Feature Implementation Guide

### Adding Pagination to a Table

**Step 1**: Add state

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(25);
```

**Step 2**: Calculate pagination

```typescript
const totalItems = filteredAndSortedItems.length;
const totalPages = Math.ceil(totalItems / pageSize);
const paginatedItems = filteredAndSortedItems.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);
```

**Step 3**: Add reset on filter change

```typescript
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, statusFilter, dateRange]);
```

**Step 4**: Render pagination

```tsx
{totalPages > 1 && (
  <div className="px-5 pb-4 border-t border-border/20 pt-4">
    <Pagination ... />
  </div>
)}
```

### Adding Sorting to a Table

**Step 1**: Add useTableSort hook

```typescript
import { useTableSort } from "@/hooks/useTableSort";

const { sort, handleSort, sortData } = useTableSort({
  defaultKey: "date",
  defaultDirection: "desc",
});
```

**Step 2**: Apply sorting in filter logic

```typescript
const filteredAndSorted = useMemo(() => {
  const filtered = items.filter(...);
  return sortData(filtered);
}, [items, filters, sortData]);
```

**Step 3**: Replace TableHead with SortableTableHeader

```tsx
<SortableTableHeader
  label="Date"
  sortKey="date"
  currentSort={sort}
  onSort={handleSort}
/>
```

### Adding Date Range Filter

**Step 1**: Add state

```typescript
const [dateRange, setDateRange] = useState<string>("all");
```

**Step 2**: Add to FilterSection

```tsx
<FilterSelect label="Date Range">
  <Select value={dateRange} onValueChange={setDateRange}>
    <SelectTrigger>
      <SelectValue placeholder="All Time" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Time</SelectItem>
      <SelectItem value="today">Today</SelectItem>
      <SelectItem value="7days">Last 7 Days</SelectItem>
      <SelectItem value="30days">Last 30 Days</SelectItem>
      <SelectItem value="90days">Last 90 Days</SelectItem>
      <SelectItem value="year">Last Year</SelectItem>
    </SelectContent>
  </Select>
</FilterSelect>
```

**Step 3**: Add to filter logic (see Date Range Filtering Pattern above)

**Step 4**: Update clearFilters

```typescript
const clearFilters = () => {
  // ... other resets
  setDateRange("all");
};
```

**Step 5**: Update hasActiveFilters

```typescript
const hasActiveFilters = !!(
  // ... other filters
  (dateRange !== "all")
);
```

---

## Mobile Responsiveness

### Desktop/Mobile Split Pattern

Used by: Invoices, Clients, Estimates

```tsx
{
  /* Desktop Table */
}
<div className="hidden md:block overflow-x-auto">
  <Table>...</Table>
</div>;

{
  /* Mobile Cards */
}
<div className="md:hidden space-y-4">
  {paginatedItems.map(item => (
    <Card key={item.id}>{/* Simplified card layout */}</Card>
  ))}
</div>;
```

### Single View Pattern

Used by: Expenses, Payments, EmailHistory, Products

Tables remain the same on mobile with responsive column hiding:

```tsx
<TableHead className="hidden md:table-cell">Desktop Only</TableHead>
```

---

## Action Column Patterns

### Dropdown Menu

```tsx
<TableCell className="text-right">
  <DropdownMenu>
    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem
        onClick={e => {
          e.stopPropagation();
          handleView(item);
        }}
      >
        <Eye className="mr-2 h-4 w-4" />
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={e => {
          e.stopPropagation();
          handleEdit(item);
        }}
      >
        <Edit className="mr-2 h-4 w-4" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={e => {
          e.stopPropagation();
          handleDelete(item);
        }}
        className="text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

**Key Pattern**: Use `e.stopPropagation()` to prevent row click when clicking dropdown.

---

## Bulk Actions Pattern

Used by: Invoices, Clients

### Selection State

```typescript
const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

const isAllSelected =
  paginatedItems.length > 0 &&
  paginatedItems.every(item => selectedIds.has(item.id));

const isSomeSelected = selectedIds.size > 0 && !isAllSelected;
```

### Select All Checkbox

```tsx
<TableHead className="w-[40px]">
  <Checkbox
    checked={isAllSelected}
    indeterminate={isSomeSelected}
    onCheckedChange={handleSelectAll}
    aria-label="Select all"
  />
</TableHead>
```

### Individual Row Checkbox

```tsx
<TableCell onClick={e => e.stopPropagation()}>
  <Checkbox
    checked={selectedIds.has(item.id)}
    onCheckedChange={checked => handleSelectOne(item.id, checked)}
    aria-label={`Select ${item.name}`}
  />
</TableCell>
```

---

## Spacing and Alignment Standards

### Horizontal Padding

**Standard Pattern**: `px-5` throughout card content

```tsx
<Card>
  <CardContent className="p-0">
    {/* Header Section */}
    <div className="px-5 py-4">
      <h3>Title</h3>
    </div>

    {/* Table Section */}
    <div className="px-5 pb-5">
      <Table>...</Table>
    </div>

    {/* Pagination Section */}
    <div className="px-5 pb-4 border-t border-border/20 pt-4">
      <Pagination ... />
    </div>
  </CardContent>
</Card>
```

**Note**: Use `CardContent className="p-0"` to remove default padding, then apply consistent `px-5` to each section.

### Vertical Spacing

- Header section: `py-4`
- Table section: `pb-5`
- Pagination section: `pb-4 pt-4` (with `border-t`)

---

## TypeScript Patterns

### Standard Imports

```typescript
import { useState, useMemo, useEffect } from "react";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { FilterSection, FilterSelect } from "@/components/ui/filter-section";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { DataTableLoading } from "@/components/ui/data-table-empty";
```

### Type Definitions

```typescript
// Sort state
type SortDirection = "asc" | "desc";
type SortField = "name" | "date" | "amount" | "status";

interface SortState {
  key: string;
  direction: SortDirection;
}

// Filter state
type FilterValue = string | number | null;
```

---

## Best Practices

### DO ✅

1. **Use 1-based pagination** for all tables
2. **Reset to page 1** when filters change
3. **Use FilterSection** for consistent filter UI
4. **Use SortableTableHeader** for sortable columns
5. **Apply filters → sorting → pagination** in that order
6. **Use useMemo** for expensive filtering/sorting operations
7. **Include date range filter** for time-based data
8. **Show item count** in CardDescription
9. **Use EmptyStatePresets** for consistent messaging
10. **Stop propagation** on dropdown menu clicks

### DON'T ❌

1. Don't mix 0-based and 1-based pagination
2. Don't implement custom pagination UI (use Pagination component)
3. Don't use manual sort buttons (use SortableTableHeader)
4. Don't skip FilterSection wrapper
5. Don't forget to reset page on filter changes
6. Don't apply pagination before filtering/sorting
7. Don't hardcode page sizes (use pageSizeOptions)
8. Don't forget empty states for both no data and no results

---

## Accessibility Guidelines

### Keyboard Navigation

- All sortable headers are clickable
- All filters are keyboard accessible
- Pagination buttons support Tab navigation
- Dropdowns open with Enter/Space

### Screen Reader Support

- Use `aria-label` on icon-only buttons
- SortableTableHeader announces sort state
- Pagination shows item count
- Empty states have descriptive text

### Focus Management

- Visible focus indicators on all interactive elements
- Logical tab order (filters → table → pagination)
- Focus trap in modals/dialogs

---

## Migration Checklist

When standardizing a new table page:

- [ ] Import Pagination, SortableTableHeader, useTableSort, FilterSection
- [ ] Add pagination state (currentPage, pageSize)
- [ ] Add sorting with useTableSort hook
- [ ] Add date range filter state
- [ ] Create filteredAndSortedItems useMemo
- [ ] Add pagination calculations (totalItems, totalPages, paginatedItems)
- [ ] Add useEffect to reset page on filter changes
- [ ] Replace TableHead with SortableTableHeader for sortable columns
- [ ] Update table body to map over paginatedItems (not filtered items)
- [ ] Wrap filters in FilterSection component
- [ ] Add clearFilters function
- [ ] Add hasActiveFilters calculation
- [ ] Add Pagination component at bottom of CardContent
- [ ] Verify px-5 spacing throughout
- [ ] Test all features (pagination, sorting, filters work together)

---

## Example: Minimal Table Implementation

```tsx
import { useState, useMemo, useEffect } from "react";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { FilterSection, FilterSelect } from "@/components/ui/filter-section";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";

export default function MyTable() {
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");

  // Sorting
  const { sort, handleSort, sortData } = useTableSort({
    defaultKey: "date",
    defaultDirection: "desc",
  });

  // Data
  const { data: items, isLoading } = trpc.myTable.list.useQuery();

  // Filter, sort, paginate
  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];
    let result = [...items];

    if (searchQuery) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateRange !== "all") {
      // Apply date filtering (see pattern above)
    }

    return sortData(result);
  }, [items, searchQuery, dateRange, sortData]);

  const totalItems = filteredAndSortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange]);

  const clearFilters = () => {
    setSearchQuery("");
    setDateRange("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(searchQuery || dateRange !== "all");

  return (
    <>
      <FilterSection
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Filters here */}
      </FilterSection>

      <Card>
        <CardHeader>
          <CardTitle>My Table</CardTitle>
          <CardDescription>{totalItems} items found</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader
                  label="Name"
                  sortKey="name"
                  currentSort={sort}
                  onSort={handleSort}
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        {totalPages > 1 && (
          <div className="px-5 pb-4 border-t border-border/20 pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={size => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </Card>
    </>
  );
}
```

---

## Troubleshooting

### Pagination not working after filter change

**Solution**: Add useEffect to reset currentPage to 1

### Sort not updating table

**Solution**: Ensure using `paginatedItems` (not `filteredItems`) in map

### Filters cleared but table not updating

**Solution**: Include filter states in useMemo dependencies

### Page numbers out of range

**Solution**: Verify using 1-based indexing (currentPage starts at 1, not 0)

---

## Standardized Pages

### Fully Standardized ✅

1. **Expenses** - Pagination, 4-column sorting, 5 filters (payment, billable, client, category, date range)
2. **Payments** - Pagination, 2-column sorting, 4 filters (search, method, status, date range)
3. **EmailHistory** - Pagination, 3-column sorting, 4 filters (search, type, status, date range)
4. **Products** - Pagination, 3-column sorting, 4 filters (search, category, date range, show archived)
5. **Clients** - Pagination, 2-column sorting, 5 filters (search, company, tax, date, tags)
6. **Invoices** - Pagination, 7+ column sorting, advanced filters (already had most features)
7. **Estimates** - Pagination, 5-column sorting, 3 filters (search, status, date range)

---

## Version History

**v1.0.0** (January 12, 2026)

- Initial documentation
- Standardized all 7 table pages
- Defined consistent patterns for pagination, sorting, filtering
- Established component library and best practices

---

**Maintained By**: SleekInvoices Development Team
**Last Review**: January 12, 2026
**Next Review**: As needed when adding new tables
