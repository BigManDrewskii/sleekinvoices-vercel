import { useState, useMemo, useRef, useEffect, useId } from "react";
import { trpc } from "@/lib/trpc";
import type { Client, ExpenseWithDetails } from "@shared/types";

type ExpensePaymentMethodType =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "check"
  | "other";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  DollarSign,
  Tag,
  FileText,
  Receipt,
  Eye,
  MoreHorizontal,
  Edit,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import ReceiptUpload from "@/components/expenses/ReceiptUpload";
import { CategoryDialog } from "@/components/expenses/CategoryDialog";
import { ExpenseStats } from "@/components/expenses/ExpenseStats";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseDetailsDialog } from "@/components/expenses/ExpenseDetailsDialog";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/components/ui/typography";
import { PageLayout } from "@/components/layout/PageLayout";
import { ExpensesPageSkeleton } from "@/components/skeletons/ExpensesPageSkeleton";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";
import { FilterSection, FilterSelect } from "@/components/ui/filter-section";
import {
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui/data-table-empty";
import { DateDisplay } from "@/components/ui/typography";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";

// Payment method display names
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  check: "Check",
  other: "Other",
};

export default function Expenses() {
  const { data: expenses, isLoading } = trpc.expenses.list.useQuery();
  const { data: categories } = trpc.expenses.categories.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createExpenseMutation = trpc.expenses.create.useMutation();
  const updateExpenseMutation = trpc.expenses.update.useMutation();
  const deleteExpenseMutation = trpc.expenses.delete.useMutation();
  const createCategoryMutation = trpc.expenses.categories.create.useMutation();
  const deleteCategoryMutation = trpc.expenses.categories.delete.useMutation();
  const utils = trpc.useUtils();
  const { pushUndoAction } = useKeyboardShortcuts();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // Form field IDs
  const ids = {
    categoryColor: useId(),
    categoryName: useId(),
    amount: useId(),
    date: useId(),
    description: useId(),
    vendor: useId(),
    taxAmount: useId(),
    isBillable: useId(),
    clientId: useId(),
  };

  // Listen for keyboard shortcut to open new expense dialog
  useEffect(() => {
    const handleOpenDialog = () => {
      setIsExpenseDialogOpen(true);
    };
    window.addEventListener("open-new-expense-dialog", handleOpenDialog);
    return () =>
      window.removeEventListener("open-new-expense-dialog", handleOpenDialog);
  }, []);
  // State for expense details dialog
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithDetails | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Filter state
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(
    null
  );
  const [billableFilter, setBillableFilter] = useState<
    "all" | "billable" | "non-billable"
  >("all");
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting state
  const { sort, handleSort, sortData } = useTableSort({
    defaultKey: "date",
    defaultDirection: "desc",
  });

  // Edit state
  const [editingExpense, setEditingExpense] =
    useState<ExpenseWithDetails | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    categoryId: 0,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    vendor: "",
    paymentMethod: "",
    taxAmount: "",
    receipt: null as { url: string; key: string } | null,
    isBillable: false,
    clientId: null as number | null,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: "#3B82F6",
  });

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    if (!expenses) return [];

    const filtered = expenses.filter((expense: ExpenseWithDetails) => {
      // Payment method filter
      if (
        paymentMethodFilter &&
        expense.paymentMethod !== paymentMethodFilter
      ) {
        return false;
      }

      // Billable filter
      if (billableFilter === "billable" && !expense.isBillable) {
        return false;
      }
      if (billableFilter === "non-billable" && expense.isBillable) {
        return false;
      }

      // Client filter
      if (clientFilter && expense.clientId !== clientFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter && expense.categoryId !== categoryFilter) {
        return false;
      }

      // Date range filter
      if (dateRange !== "all") {
        const expenseDate = new Date(expense.date);
        const now = new Date();

        switch (dateRange) {
          case "today":
            if (expenseDate.toDateString() !== now.toDateString()) return false;
            break;
          case "7days":
            if (expenseDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
              return false;
            break;
          case "30days":
            if (
              expenseDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            )
              return false;
            break;
          case "90days":
            if (
              expenseDate < new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            )
              return false;
            break;
          case "year":
            if (
              expenseDate < new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            )
              return false;
            break;
        }
      }

      return true;
    });

    // Apply sorting
    return sortData(filtered);
  }, [
    expenses,
    paymentMethodFilter,
    billableFilter,
    clientFilter,
    categoryFilter,
    dateRange,
    sortData,
  ]);

  // Pagination
  const totalItems = filteredAndSortedExpenses.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedExpenses = filteredAndSortedExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    paymentMethodFilter,
    billableFilter,
    clientFilter,
    categoryFilter,
    dateRange,
  ]);

  // Calculate stats based on filtered expenses
  const stats = useMemo(() => {
    const data = filteredAndSortedExpenses;

    const totalAmount = data.reduce(
      (sum: number, exp: ExpenseWithDetails) =>
        sum + parseFloat(exp.amount || "0"),
      0
    );
    const totalTax = data.reduce(
      (sum: number, exp: ExpenseWithDetails) =>
        sum + parseFloat(exp.taxAmount || "0"),
      0
    );
    const totalWithTax = totalAmount + totalTax;

    const billableCount = data.filter(
      (exp: ExpenseWithDetails) => exp.isBillable
    ).length;
    const nonBillableCount = data.length - billableCount;

    const billableAmount = data
      .filter((exp: ExpenseWithDetails) => exp.isBillable)
      .reduce(
        (sum: number, exp: ExpenseWithDetails) =>
          sum +
          parseFloat(exp.amount || "0") +
          parseFloat(exp.taxAmount || "0"),
        0
      );

    // Group by payment method
    const byPaymentMethod: Record<string, number> = {};
    data.forEach((exp: ExpenseWithDetails) => {
      const method = exp.paymentMethod || "unspecified";
      byPaymentMethod[method] =
        (byPaymentMethod[method] || 0) + parseFloat(exp.amount || "0");
    });

    // Group by category
    const byCategory: Record<
      string,
      { name: string; color: string; amount: number }
    > = {};
    data.forEach((exp: ExpenseWithDetails) => {
      const catId = exp.categoryId?.toString() || "uncategorized";
      if (!byCategory[catId]) {
        byCategory[catId] = {
          name: exp.categoryName || "Uncategorized",
          color: exp.categoryColor || "#6B7280",
          amount: 0,
        };
      }
      byCategory[catId].amount += parseFloat(exp.amount || "0");
    });

    return {
      totalAmount,
      totalTax,
      totalWithTax,
      count: data.length,
      billableCount,
      nonBillableCount,
      billableAmount,
      byPaymentMethod,
      byCategory,
    };
  }, [filteredAndSortedExpenses]);

  // Check if any filters are active
  const hasActiveFilters = !!(
    paymentMethodFilter ||
    billableFilter !== "all" ||
    clientFilter ||
    categoryFilter ||
    dateRange !== "all"
  );

  const activeFilters = useMemo(() => {
    const filters = [];
    if (paymentMethodFilter) {
      filters.push({
        key: "method",
        label: "Method",
        value:
          paymentMethodFilter.charAt(0).toUpperCase() +
          paymentMethodFilter.slice(1).replace("_", " "),
        onRemove: () => setPaymentMethodFilter(null),
      });
    }
    if (billableFilter !== "all") {
      filters.push({
        key: "billable",
        label: "Billable",
        value: billableFilter === "billable" ? "Billable Only" : "Non-Billable",
        onRemove: () => setBillableFilter("all"),
      });
    }
    if (clientFilter) {
      const client = clients?.find((c: Client) => c.id === clientFilter);
      filters.push({
        key: "client",
        label: "Client",
        value: client?.name || "Unknown",
        onRemove: () => setClientFilter(null),
      });
    }
    if (categoryFilter) {
      const category = categories?.find(
        (c: { id: number; name: string }) => c.id === categoryFilter
      );
      filters.push({
        key: "category",
        label: "Category",
        value: category?.name || "Unknown",
        onRemove: () => setCategoryFilter(null),
      });
    }
    if (dateRange !== "all") {
      const dateLabels: Record<string, string> = {
        today: "Today",
        "7days": "Last 7 Days",
        "30days": "Last 30 Days",
        "90days": "Last 90 Days",
        year: "Last Year",
      };
      filters.push({
        key: "dateRange",
        label: "Date",
        value: dateLabels[dateRange] || dateRange,
        onRemove: () => setDateRange("all"),
      });
    }
    return filters;
  }, [
    paymentMethodFilter,
    billableFilter,
    clientFilter,
    categoryFilter,
    dateRange,
    clients,
    categories,
  ]);

  const clearAllFilters = () => {
    setPaymentMethodFilter(null);
    setBillableFilter("all");
    setClientFilter(null);
    setCategoryFilter(null);
    setDateRange("all");
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseForm.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (expenseForm.isBillable && !expenseForm.clientId) {
      toast.error("Please select a client for billable expenses");
      return;
    }

    try {
      const expenseData = {
        categoryId: expenseForm.categoryId,
        amount: parseFloat(expenseForm.amount),
        date: new Date(expenseForm.date),
        description: expenseForm.description,
        vendor: expenseForm.vendor || undefined,
        paymentMethod: (expenseForm.paymentMethod || undefined) as
          | "cash"
          | "credit_card"
          | "debit_card"
          | "bank_transfer"
          | "check"
          | "other"
          | undefined,
        taxAmount: expenseForm.taxAmount
          ? parseFloat(expenseForm.taxAmount)
          : undefined,
        receiptUrl: expenseForm.receipt?.url,
        receiptKey: expenseForm.receipt?.key,
        isBillable: expenseForm.isBillable,
        clientId: expenseForm.clientId || undefined,
      };

      if (editingExpense) {
        // Update existing expense
        await updateExpenseMutation.mutateAsync({
          id: editingExpense.id,
          ...expenseData,
        });
        toast.success("Expense updated");
      } else {
        // Create new expense
        await createExpenseMutation.mutateAsync(expenseData);
        toast.success("Expense added");
      }

      utils.expenses.list.invalidate();
      utils.expenses.stats.invalidate();
      setIsExpenseDialogOpen(false);
    } catch (error) {
      toast.error(
        editingExpense ? "Failed to update expense" : "Failed to add expense"
      );
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCategoryMutation.mutateAsync(categoryForm);
      utils.expenses.categories.list.invalidate();
      toast.success("Category created");
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: "", color: "#3B82F6" });
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const pendingExpenseDeleteRef = useRef<{
    timeoutId: NodeJS.Timeout;
    expenseId: number;
  } | null>(null);

  const handleDeleteExpense = async (id: number, description?: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    // Cancel any existing pending delete
    if (pendingExpenseDeleteRef.current) {
      clearTimeout(pendingExpenseDeleteRef.current.timeoutId);
      pendingExpenseDeleteRef.current = null;
    }

    // Snapshot the previous value for potential restore
    const previousExpenses = utils.expenses.list.getData();

    // Optimistically remove from UI immediately
    utils.expenses.list.setData(undefined, old =>
      old?.filter((expense: ExpenseWithDetails) => expense.id !== id)
    );

    // Create undo function
    const undoDelete = () => {
      // Cancel the pending delete
      if (pendingExpenseDeleteRef.current) {
        clearTimeout(pendingExpenseDeleteRef.current.timeoutId);
        pendingExpenseDeleteRef.current = null;
      }

      // Restore the expense to UI
      if (previousExpenses) {
        utils.expenses.list.setData(undefined, previousExpenses);
      } else {
        utils.expenses.list.invalidate();
      }
    };

    // Register with keyboard shortcuts context for Cmd+Z
    pushUndoAction({
      type: "delete",
      entityType: "expense",
      description: `Delete expense`,
      undo: undoDelete,
    });

    // Show undo toast
    toast(`Expense deleted`, {
      description: "Click undo to restore or press ⌘Z",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          undoDelete();
          toast.success("Expense restored");
        },
      },
    });

    // Set timeout to permanently delete after 5 seconds
    const timeoutId = setTimeout(async () => {
      pendingExpenseDeleteRef.current = null;

      try {
        await deleteExpenseMutation.mutateAsync({ id });
      } catch (error) {
        // Restore the expense on error
        if (previousExpenses) {
          utils.expenses.list.setData(undefined, previousExpenses);
        } else {
          utils.expenses.list.invalidate();
        }
        toast.error("Failed to delete expense. Item has been restored.");
      } finally {
        utils.expenses.list.invalidate();
        utils.expenses.stats.invalidate();
      }
    }, 5000);

    pendingExpenseDeleteRef.current = { timeoutId, expenseId: id };
  };

  const openExpenseDetails = (expense: ExpenseWithDetails) => {
    setSelectedExpense(expense);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (expense: ExpenseWithDetails) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  // Populate form when editing an expense
  useEffect(() => {
    if (editingExpense && isExpenseDialogOpen) {
      setExpenseForm({
        categoryId: editingExpense.categoryId || 0,
        amount: editingExpense.amount?.toString() || "",
        date: new Date(editingExpense.date).toISOString().split("T")[0],
        description: editingExpense.description || "",
        vendor: editingExpense.vendor || "",
        paymentMethod: editingExpense.paymentMethod || "",
        taxAmount: editingExpense.taxAmount?.toString() || "",
        receipt: editingExpense.receiptUrl
          ? {
              url: editingExpense.receiptUrl,
              key: editingExpense.receiptKey || "",
            }
          : null,
        isBillable: editingExpense.isBillable || false,
        clientId: editingExpense.clientId || null,
      });
    } else if (!isExpenseDialogOpen) {
      // Reset when dialog closes
      setEditingExpense(null);
      setExpenseForm({
        categoryId: 0,
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        vendor: "",
        paymentMethod: "",
        taxAmount: "",
        receipt: null,
        isBillable: false,
        clientId: null,
      });
    }
  }, [editingExpense, isExpenseDialogOpen]);

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteCategoryMutation.mutateAsync({ id });
      utils.expenses.categories.list.invalidate();
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  if (isLoading) {
    return (
      <PageLayout
        title="Expenses"
        subtitle="Track your business expenses and categorize spending"
      >
        <ExpensesPageSkeleton />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Expenses"
      subtitle="Track your business expenses and categorize spending"
      headerActions={
        <div className="flex gap-2">
          <CategoryDialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
            categories={categories}
            categoryForm={categoryForm}
            setCategoryForm={setCategoryForm}
            createCategoryMutation={createCategoryMutation}
            handleCreateCategory={handleCreateCategory}
            handleDeleteCategory={handleDeleteCategory}
            ids={ids}
          />

          <ExpenseDialog
            open={isExpenseDialogOpen}
            onOpenChange={setIsExpenseDialogOpen}
            editingExpense={editingExpense}
            expenseForm={expenseForm}
            setExpenseForm={setExpenseForm}
            categories={categories}
            clients={clients}
            ids={ids}
            handleSaveExpense={handleSaveExpense}
            createExpenseMutation={createExpenseMutation}
            updateExpenseMutation={updateExpenseMutation}
          />
        </div>
      }
    >
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl">
                <Currency amount={stats.totalWithTax} bold />
              </p>
              {stats.totalTax > 0 && (
                <p className="text-xs text-muted-foreground">
                  (incl. <Currency amount={stats.totalTax} /> tax)
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Expense Count</p>
              <p className="text-2xl font-numeric-bold">{stats.count}</p>
              {hasActiveFilters && expenses && (
                <p className="text-xs text-muted-foreground">
                  of <span className="font-numeric">{expenses.length}</span>{" "}
                  total
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Billable</p>
              <p className="text-2xl">
                <Currency amount={stats.billableAmount} bold />
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-numeric">{stats.billableCount}</span>{" "}
                expense{stats.billableCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Non-Billable</p>
              <p className="text-2xl">
                <Currency
                  amount={stats.totalWithTax - stats.billableAmount}
                  bold
                />
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-numeric">{stats.nonBillableCount}</span>{" "}
                expense{stats.nonBillableCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ExpenseFilters
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search expenses..."
        activeFilters={activeFilters}
        onClearAll={clearAllFilters}
        paymentMethodFilter={paymentMethodFilter}
        setPaymentMethodFilter={setPaymentMethodFilter}
        billableFilter={billableFilter}
        setBillableFilter={setBillableFilter}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        clients={clients}
        categories={categories}
      />

      <ExpenseTable
        isLoading={isLoading}
        expenses={expenses}
        filteredAndSortedExpenses={filteredAndSortedExpenses}
        paginatedExpenses={paginatedExpenses}
        totalItems={totalItems}
        totalPages={totalPages}
        pageSize={pageSize}
        currentPage={currentPage}
        sort={sort}
        handleSort={handleSort}
        setCurrentPage={setCurrentPage}
        setPageSize={setPageSize}
        openExpenseDetails={openExpenseDetails}
        handleEdit={handleEdit}
        deleteExpenseMutation={deleteExpenseMutation}
        hasActiveFilters={hasActiveFilters}
        setIsExpenseDialogOpen={setIsExpenseDialogOpen}
        clearAllFilters={clearAllFilters}
      />

      <ExpenseDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        selectedExpense={selectedExpense}
      />
    </PageLayout>
  );
}
