import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

interface BillableExpense {
  id: number;
  description: string;
  amount: string;
  taxAmount: string | null;
  date: Date;
  vendor: string | null;
  clientId: number | null;
  clientName: string | null;
}

interface BillableExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number | null;
  onAddExpenses: (expenses: BillableExpense[]) => void;
}

export function BillableExpenseDialog({
  open,
  onOpenChange,
  clientId,
  onAddExpenses,
}: BillableExpenseDialogProps) {
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<number>>(new Set());

  // Fetch billable expenses for this client
  const { data: expenses, isLoading } = trpc.expenses.getBillableUnlinked.useQuery(
    { clientId: clientId || undefined },
    { enabled: open && !!clientId }
  );

  const toggleExpense = (expenseId: number) => {
    const newSelected = new Set(selectedExpenseIds);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenseIds(newSelected);
  };

  const handleAdd = () => {
    if (!expenses) return;
    
    const selectedExpenses = expenses.filter(exp => selectedExpenseIds.has(exp.id));
    if (selectedExpenses.length === 0) {
      toast.error("Please select at least one expense");
      return;
    }
    
    onAddExpenses(selectedExpenses);
    setSelectedExpenseIds(new Set());
  };

  const handleCancel = () => {
    setSelectedExpenseIds(new Set());
    onOpenChange(false);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Billable Expenses</DialogTitle>
          <DialogDescription>
            Select expenses to add as line items to this invoice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {!isLoading && (!expenses || expenses.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No unbilled expenses found for this client.</p>
              <p className="text-sm mt-2">
                Create billable expenses and assign them to this client to see them here.
              </p>
            </div>
          )}

          {!isLoading && expenses && expenses.length > 0 && (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                {selectedExpenseIds.size} of {expenses.length} expense(s) selected
              </div>
              
              <div className="space-y-2">
                {expenses.map((expense) => {
                  const totalAmount = Number(expense.amount) + (Number(expense.taxAmount) || 0);
                  
                  return (
                    <div
                      key={expense.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => toggleExpense(expense.id)}
                    >
                      <Checkbox
                        checked={selectedExpenseIds.has(expense.id)}
                        onCheckedChange={() => toggleExpense(expense.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">
                              {expense.description}
                            </p>
                            {expense.vendor && (
                              <p className="text-sm text-muted-foreground">
                                Vendor: {expense.vendor}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(expense.date)}
                            </p>
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-foreground">
                              {formatCurrency(totalAmount)}
                            </p>
                            {expense.taxAmount && Number(expense.taxAmount) > 0 && (
                              <p className="text-xs text-muted-foreground">
                                (incl. {formatCurrency(expense.taxAmount)} tax)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd}
            disabled={selectedExpenseIds.size === 0}
          >
            Add {selectedExpenseIds.size > 0 ? `${selectedExpenseIds.size} ` : ''}Expense(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
