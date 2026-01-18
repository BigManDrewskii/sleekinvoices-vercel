import { FilterSection, FilterSelect } from "@/components/ui/filter-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@shared/types";

interface ExpenseFiltersProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  activeFilters: Array<{
    key: string;
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  onClearAll: () => void;
  paymentMethodFilter: string | null;
  setPaymentMethodFilter: (value: string | null) => void;
  billableFilter: "all" | "billable" | "non-billable";
  setBillableFilter: (value: "all" | "billable" | "non-billable") => void;
  clientFilter: number | null;
  setClientFilter: (value: number | null) => void;
  categoryFilter: number | null;
  setCategoryFilter: (value: number | null) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  clients: Client[] | undefined;
  categories: { id: number; name: string; color: string }[] | undefined;
}

export function ExpenseFilters({
  hasActiveFilters,
  onClearFilters,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  activeFilters,
  onClearAll,
  paymentMethodFilter,
  setPaymentMethodFilter,
  billableFilter,
  setBillableFilter,
  clientFilter,
  setClientFilter,
  categoryFilter,
  setCategoryFilter,
  dateRange,
  setDateRange,
  clients,
  categories,
}: ExpenseFiltersProps) {
  return (
    <FilterSection
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      activeFilters={activeFilters}
      onClearAll={onClearAll}
    >
      <div className="flex flex-wrap items-end gap-3 md:gap-4 w-full">
        <FilterSelect label="Payment Method">
          <Select
            value={paymentMethodFilter || "all"}
            onValueChange={v => setPaymentMethodFilter(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[160px] md:w-[180px]">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="debit_card">Debit Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FilterSelect>

        <FilterSelect label="Billable Status">
          <Select
            value={billableFilter}
            onValueChange={v =>
              setBillableFilter(v as "all" | "billable" | "non-billable")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="billable">Billable Only</SelectItem>
              <SelectItem value="non-billable">Non-Billable Only</SelectItem>
            </SelectContent>
          </Select>
        </FilterSelect>

        <FilterSelect label="Client">
          <Select
            value={clientFilter?.toString() || "all"}
            onValueChange={v =>
              setClientFilter(v === "all" ? null : parseInt(v))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients &&
                clients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </FilterSelect>

        <FilterSelect label="Category">
          <Select
            value={categoryFilter?.toString() || "all"}
            onValueChange={v =>
              setCategoryFilter(v === "all" ? null : parseInt(v))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories &&
                categories.map(
                  (cat: { id: number; name: string; color: string }) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
        </FilterSelect>

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
      </div>
    </FilterSection>
  );
}
