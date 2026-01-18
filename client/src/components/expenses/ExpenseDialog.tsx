import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { Currency } from "@/components/ui/typography";
import ReceiptUpload from "./ReceiptUpload";
import type { Client, ExpenseWithDetails } from "@shared/types";

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense: ExpenseWithDetails | null;
  expenseForm: {
    categoryId: number;
    amount: string;
    date: string;
    description: string;
    vendor: string;
    paymentMethod: string;
    taxAmount: string;
    isBillable: boolean;
    clientId: number | null;
    receipt: { url: string; key: string } | null;
  };
  setExpenseForm: (form: any) => void;
  categories: { id: number; name: string; color: string }[] | undefined;
  clients: Client[] | undefined;
  ids: {
    categoryColor: string;
    categoryName: string;
    amount: string;
    date: string;
    description: string;
    vendor: string;
    taxAmount: string;
    isBillable: string;
    clientId: string;
  };
  handleSaveExpense: (e: React.FormEvent) => void;
  createExpenseMutation: any;
  updateExpenseMutation: any;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  editingExpense,
  expenseForm,
  setExpenseForm,
  categories,
  clients,
  ids,
  handleSaveExpense,
  createExpenseMutation,
  updateExpenseMutation,
}: ExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSaveExpense} className="space-y-5">
          <div>
            <Label htmlFor={ids.categoryName}>Category</Label>
            <Select
              value={expenseForm.categoryId.toString()}
              onValueChange={v =>
                setExpenseForm({
                  ...expenseForm,
                  categoryId: parseInt(v),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories && categories.length > 0 ? (
                  categories.map(
                    (cat: { id: number; name: string; color: string }) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    )
                  )
                ) : (
                  <SelectItem value="0" disabled>
                    No categories - create one first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={ids.amount}>Amount</Label>
            <Input
              id={ids.amount}
              type="number"
              step="0.01"
              value={expenseForm.amount}
              onChange={e =>
                setExpenseForm({ ...expenseForm, amount: e.target.value })
              }
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor={ids.date}>Date</Label>
            <Input
              id={ids.date}
              type="date"
              value={expenseForm.date}
              onChange={e =>
                setExpenseForm({ ...expenseForm, date: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor={ids.description}>Description</Label>
            <Textarea
              id={ids.description}
              value={expenseForm.description}
              onChange={e =>
                setExpenseForm({
                  ...expenseForm,
                  description: e.target.value,
                })
              }
              placeholder="What was this expense for?"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={ids.vendor}>Vendor/Supplier</Label>
              <Input
                id={ids.vendor}
                value={expenseForm.vendor}
                onChange={e =>
                  setExpenseForm({
                    ...expenseForm,
                    vendor: e.target.value,
                  })
                }
                placeholder="e.g., Office Depot, Amazon"
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={expenseForm.paymentMethod}
                onValueChange={v =>
                  setExpenseForm({ ...expenseForm, paymentMethod: v })
                }
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
            <Label htmlFor={ids.taxAmount}>Tax Amount</Label>
            <Input
              id={ids.taxAmount}
              type="number"
              step="0.01"
              value={expenseForm.taxAmount}
              onChange={e =>
                setExpenseForm({
                  ...expenseForm,
                  taxAmount: e.target.value,
                })
              }
              placeholder="0.00"
            />
            {expenseForm.taxAmount && (
              <p className="text-sm text-muted-foreground mt-1">
                Total:{" "}
                <Currency
                  amount={
                    parseFloat(expenseForm.amount || "0") +
                    parseFloat(expenseForm.taxAmount || "0")
                  }
                />
              </p>
            )}
          </div>

          <div>
            <Label>Receipt Upload</Label>
            <ReceiptUpload
              value={expenseForm.receipt}
              onChange={receipt => setExpenseForm({ ...expenseForm, receipt })}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={ids.isBillable}
                checked={expenseForm.isBillable}
                onCheckedChange={checked =>
                  setExpenseForm({
                    ...expenseForm,
                    isBillable: checked as boolean,
                    clientId: checked ? expenseForm.clientId : null,
                  })
                }
              />
              <Label htmlFor={ids.isBillable} className="cursor-pointer">
                This is a billable expense
              </Label>
            </div>

            {expenseForm.isBillable && (
              <div>
                <Label htmlFor={ids.clientId}>Client</Label>
                <Select
                  value={expenseForm.clientId?.toString() || ""}
                  onValueChange={v =>
                    setExpenseForm({
                      ...expenseForm,
                      clientId: parseInt(v),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients && clients.length > 0 ? (
                      clients.map((client: Client) => (
                        <SelectItem
                          key={client.id}
                          value={client.id.toString()}
                        >
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
            <Button
              type="submit"
              disabled={
                createExpenseMutation.isPending ||
                updateExpenseMutation.isPending
              }
            >
              {editingExpense ? "Update Expense" : "Add Expense"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
