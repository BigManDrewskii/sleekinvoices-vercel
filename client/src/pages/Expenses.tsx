import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, DollarSign, Tag, ChevronDown, ChevronUp, FileText, Receipt, Filter, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ReceiptUpload from "@/components/expenses/ReceiptUpload";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PageLayout } from "@/components/layout/PageLayout";
import { ExpensesPageSkeleton } from "@/components/skeletons/ExpensesPageSkeleton";

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
  const deleteExpenseMutation = trpc.expenses.delete.useMutation();
  const createCategoryMutation = trpc.expenses.categories.create.useMutation();
  const deleteCategoryMutation = trpc.expenses.categories.delete.useMutation();
  const utils = trpc.useUtils();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [expandedExpenses, setExpandedExpenses] = useState<Set<number>>(new Set());
  
  // Filter state
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null);
  const [billableFilter, setBillableFilter] = useState<'all' | 'billable' | 'non-billable'>('all');
  const [clientFilter, setClientFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  
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

  // Filter expenses based on active filters
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter((expense: any) => {
      // Payment method filter
      if (paymentMethodFilter && expense.paymentMethod !== paymentMethodFilter) {
        return false;
      }
      
      // Billable filter
      if (billableFilter === 'billable' && !expense.isBillable) {
        return false;
      }
      if (billableFilter === 'non-billable' && expense.isBillable) {
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
      
      return true;
    });
  }, [expenses, paymentMethodFilter, billableFilter, clientFilter, categoryFilter]);

  // Calculate stats based on filtered expenses
  const stats = useMemo(() => {
    const data = filteredExpenses;
    
    const totalAmount = data.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || "0"), 0);
    const totalTax = data.reduce((sum: number, exp: any) => sum + parseFloat(exp.taxAmount || "0"), 0);
    const totalWithTax = totalAmount + totalTax;
    
    const billableCount = data.filter((exp: any) => exp.isBillable).length;
    const nonBillableCount = data.length - billableCount;
    
    const billableAmount = data
      .filter((exp: any) => exp.isBillable)
      .reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || "0") + parseFloat(exp.taxAmount || "0"), 0);
    
    // Group by payment method
    const byPaymentMethod: Record<string, number> = {};
    data.forEach((exp: any) => {
      const method = exp.paymentMethod || 'unspecified';
      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + parseFloat(exp.amount || "0");
    });
    
    // Group by category
    const byCategory: Record<string, { name: string; color: string; amount: number }> = {};
    data.forEach((exp: any) => {
      const catId = exp.categoryId?.toString() || 'uncategorized';
      if (!byCategory[catId]) {
        byCategory[catId] = {
          name: exp.categoryName || 'Uncategorized',
          color: exp.categoryColor || '#6B7280',
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
  }, [filteredExpenses]);

  // Check if any filters are active
  const hasActiveFilters = paymentMethodFilter || billableFilter !== 'all' || clientFilter || categoryFilter;

  const clearAllFilters = () => {
    setPaymentMethodFilter(null);
    setBillableFilter('all');
    setClientFilter(null);
    setCategoryFilter(null);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
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
      await createExpenseMutation.mutateAsync({
        categoryId: expenseForm.categoryId,
        amount: parseFloat(expenseForm.amount),
        date: new Date(expenseForm.date),
        description: expenseForm.description,
        vendor: expenseForm.vendor || undefined,
        paymentMethod: (expenseForm.paymentMethod || undefined) as "cash" | "credit_card" | "debit_card" | "bank_transfer" | "check" | "other" | undefined,
        taxAmount: expenseForm.taxAmount ? parseFloat(expenseForm.taxAmount) : undefined,
        receiptUrl: expenseForm.receipt?.url,
        receiptKey: expenseForm.receipt?.key,
        isBillable: expenseForm.isBillable,
        clientId: expenseForm.clientId || undefined,
      });

      utils.expenses.list.invalidate();
      utils.expenses.stats.invalidate();
      toast.success("Expense added");
      setIsExpenseDialogOpen(false);
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
    } catch (error) {
      toast.error("Failed to add expense");
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

  const pendingExpenseDeleteRef = useRef<{ timeoutId: NodeJS.Timeout; expenseId: number } | null>(null);

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
    utils.expenses.list.setData(undefined, (old) => 
      old?.filter((expense: any) => expense.id !== id)
    );

    // Show undo toast
    toast(
      `Expense deleted`,
      {
        description: 'Click undo to restore',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
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
            
            toast.success('Expense restored');
          },
        },
      }
    );

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

  const toggleExpenseRow = (id: number) => {
    setExpandedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
      <PageLayout title="Expenses" subtitle="Track your business expenses and categorize spending">
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
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tag className="w-4 h-4 mr-2" />
                Manage Categories
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Expense Categories</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateCategory} className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Office Supplies"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="categoryColor">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="categoryColor"
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={createCategoryMutation.isPending}>
                  Add Category
                </Button>
              </form>

              <div className="space-y-2">
                {categories && categories.length > 0 ? (
                  categories.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No categories yet. Create one above.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={expenseForm.categoryId.toString()}
                    onValueChange={(v) => setExpenseForm({ ...expenseForm, categoryId: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="0" disabled>
                          No categories - create one first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="What was this expense for?"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor">Vendor/Supplier</Label>
                    <Input
                      id="vendor"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                      placeholder="e.g., Office Depot, Amazon"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={expenseForm.paymentMethod}
                      onValueChange={(v) => setExpenseForm({ ...expenseForm, paymentMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="taxAmount">Tax Amount</Label>
                  <Input
                    id="taxAmount"
                    type="number"
                    step="0.01"
                    value={expenseForm.taxAmount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, taxAmount: e.target.value })}
                    placeholder="0.00"
                  />
                  {expenseForm.taxAmount && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Total: {formatCurrency(parseFloat(expenseForm.amount || "0") + parseFloat(expenseForm.taxAmount || "0"))}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Receipt</Label>
                  <ReceiptUpload
                    value={expenseForm.receipt}
                    onChange={(receipt) => setExpenseForm({ ...expenseForm, receipt })}
                  />
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isBillable"
                      checked={expenseForm.isBillable}
                      onCheckedChange={(checked) => 
                        setExpenseForm({ ...expenseForm, isBillable: checked as boolean, clientId: checked ? expenseForm.clientId : null })
                      }
                    />
                    <Label htmlFor="isBillable" className="cursor-pointer">
                      This is a billable expense
                    </Label>
                  </div>

                  {expenseForm.isBillable && (
                    <div>
                      <Label htmlFor="clientId">Client</Label>
                      <Select
                        value={expenseForm.clientId?.toString() || ""}
                        onValueChange={(v) => setExpenseForm({ ...expenseForm, clientId: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients && clients.length > 0 ? (
                            clients.map((client: any) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="0" disabled>
                              No clients available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createExpenseMutation.isPending}>
                    Add Expense
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsExpenseDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
              <p className="text-2xl font-bold">{formatCurrency(stats.totalWithTax)}</p>
              {stats.totalTax > 0 && (
                <p className="text-xs text-muted-foreground">
                  (incl. {formatCurrency(stats.totalTax)} tax)
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
              <p className="text-2xl font-bold">{stats.count}</p>
              {hasActiveFilters && expenses && (
                <p className="text-xs text-muted-foreground">
                  of {expenses.length} total
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
              <p className="text-2xl font-bold">{formatCurrency(stats.billableAmount)}</p>
              <p className="text-xs text-muted-foreground">
                {stats.billableCount} expense{stats.billableCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Non-Billable</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalWithTax - stats.billableAmount)}</p>
              <p className="text-xs text-muted-foreground">
                {stats.nonBillableCount} expense{stats.nonBillableCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Payment Method Filter */}
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">Payment Method</Label>
            <Select
              value={paymentMethodFilter || "all"}
              onValueChange={(v) => setPaymentMethodFilter(v === "all" ? null : v)}
            >
              <SelectTrigger>
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
          </div>

          {/* Billable Status Filter */}
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">Billable Status</Label>
            <Select
              value={billableFilter}
              onValueChange={(v) => setBillableFilter(v as 'all' | 'billable' | 'non-billable')}
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
          </div>

          {/* Client Filter */}
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">Client</Label>
            <Select
              value={clientFilter?.toString() || "all"}
              onValueChange={(v) => setClientFilter(v === "all" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients && clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">Category</Label>
            <Select
              value={categoryFilter?.toString() || "all"}
              onValueChange={(v) => setCategoryFilter(v === "all" ? null : parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories && categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {paymentMethodFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
                  Payment: {PAYMENT_METHOD_LABELS[paymentMethodFilter] || paymentMethodFilter}
                  <button onClick={() => setPaymentMethodFilter(null)} className="hover:text-primary/70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {billableFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
                  {billableFilter === 'billable' ? 'Billable' : 'Non-Billable'}
                  <button onClick={() => setBillableFilter('all')} className="hover:text-primary/70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {clientFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
                  Client: {clients?.find((c: any) => c.id === clientFilter)?.name || 'Unknown'}
                  <button onClick={() => setClientFilter(null)} className="hover:text-primary/70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
                  Category: {categories?.find((c: any) => c.id === categoryFilter)?.name || 'Unknown'}
                  <button onClick={() => setCategoryFilter(null)} className="hover:text-primary/70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Expense List */}
      {!expenses || expenses.length === 0 ? (
        <Card className="p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
          <p className="text-muted-foreground mb-6">
            Start tracking your business expenses to monitor spending
          </p>
          <Button onClick={() => setIsExpenseDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Expense
          </Button>
        </Card>
      ) : filteredExpenses.length === 0 ? (
        <Card className="p-12 text-center">
          <Filter className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No matching expenses</h3>
          <p className="text-muted-foreground mb-6">
            No expenses match your current filters
          </p>
          <Button variant="outline" onClick={clearAllFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {filteredExpenses.map((expense: any) => {
              const isExpanded = expandedExpenses.has(expense.id);
              return (
                <div key={expense.id}>
                  {/* Main Row */}
                  <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpenseRow(expense.id)}
                        className="p-1 h-8 w-8"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: expense.categoryColor || "#3B82F6" }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.categoryName} • {new Date(expense.date).toLocaleDateString()}
                          {expense.isBillable && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Billable
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-lg font-semibold">{formatCurrency(parseFloat(expense.amount))}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-muted/30 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {expense.vendor && (
                          <div>
                            <p className="text-muted-foreground mb-1">Vendor</p>
                            <p className="font-medium">{expense.vendor}</p>
                          </div>
                        )}
                        {expense.paymentMethod && (
                          <div>
                            <p className="text-muted-foreground mb-1">Payment Method</p>
                            <p className="font-medium">{PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod}</p>
                          </div>
                        )}
                        {expense.taxAmount && parseFloat(expense.taxAmount) > 0 && (
                          <div>
                            <p className="text-muted-foreground mb-1">Tax Amount</p>
                            <p className="font-medium">{formatCurrency(parseFloat(expense.taxAmount))}</p>
                          </div>
                        )}
                        {(expense.taxAmount && parseFloat(expense.taxAmount) > 0) && (
                          <div>
                            <p className="text-muted-foreground mb-1">Total (incl. tax)</p>
                            <p className="font-medium">{formatCurrency(parseFloat(expense.amount) + parseFloat(expense.taxAmount))}</p>
                          </div>
                        )}
                        {expense.receiptUrl && (
                          <div>
                            <p className="text-muted-foreground mb-1">Receipt</p>
                            <a
                              href={expense.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:underline"
                            >
                              <Receipt className="w-4 h-4" />
                              View Receipt
                            </a>
                          </div>
                        )}
                        {expense.isBillable && (
                          <div>
                            <p className="text-muted-foreground mb-1">Billable To</p>
                            <p className="font-medium">
                              {expense.clientName || 'Unassigned'}
                              {expense.invoiceId && (
                                <span className="ml-2 text-xs text-muted-foreground">(Linked to invoice)</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </PageLayout>
  );
}
