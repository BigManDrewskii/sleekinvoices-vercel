import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, DollarSign, Tag } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function Expenses() {
  const { data: expenses, isLoading } = trpc.expenses.list.useQuery();
  const { data: categories } = trpc.expenses.categories.list.useQuery();
  const createExpenseMutation = trpc.expenses.create.useMutation();
  const deleteExpenseMutation = trpc.expenses.delete.useMutation();
  const createCategoryMutation = trpc.expenses.categories.create.useMutation();
  const deleteCategoryMutation = trpc.expenses.categories.delete.useMutation();
  const utils = trpc.useUtils();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState({
    categoryId: 0,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: "#3B82F6",
  });

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!expenseForm.categoryId) {
      toast.error("Please select a category");
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        categoryId: expenseForm.categoryId,
        amount: parseFloat(expenseForm.amount),
        date: new Date(expenseForm.date),
        description: expenseForm.description,
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

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteExpenseMutation.mutateAsync({ id });
      utils.expenses.list.invalidate();
      utils.expenses.stats.invalidate();
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
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

  const totalExpenses = expenses?.reduce((sum, exp: any) => sum + parseFloat(exp.amount || "0"), 0) || 0;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-2">
            Track your business expenses and categorize spending
          </p>
        </div>

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
            <DialogContent>
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
                          No categories available
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
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </Card>

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
      ) : (
        <Card>
          <div className="divide-y">
            {expenses.map((expense: any) => (
              <div key={expense.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: expense.categoryColor || "#3B82F6" }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.categoryName} • {new Date(expense.date).toLocaleDateString()}
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
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
