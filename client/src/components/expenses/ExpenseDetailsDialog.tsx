import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { Currency } from "@/components/ui/typography";
import { DateDisplay } from "@/components/ui/typography";
import type { ExpenseWithDetails } from "@shared/types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  check: "Check",
  other: "Other",
};

interface ExpenseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExpense: ExpenseWithDetails | null;
}

export function ExpenseDetailsDialog({
  open,
  onOpenChange,
  selectedExpense,
}: ExpenseDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Expense Details</DialogTitle>
        </DialogHeader>
        {selectedExpense && (
          <div className="space-y-5 px-0">
            <div className="flex items-center gap-4">
              <div
                className="w-5 h-5 rounded-full shadow-sm"
                style={{
                  backgroundColor: selectedExpense.categoryColor || "#3B82F6",
                }}
              />
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedExpense.description}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedExpense.categoryName || "Uncategorized"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  <DateDisplay date={selectedExpense.date} />
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">
                  <Currency amount={parseFloat(selectedExpense.amount)} />
                </p>
              </div>
              {selectedExpense.vendor && (
                <div>
                  <p className="text-muted-foreground mb-1">Vendor</p>
                  <p className="font-medium">{selectedExpense.vendor}</p>
                </div>
              )}
              {selectedExpense.paymentMethod && (
                <div>
                  <p className="text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-medium">
                    {PAYMENT_METHOD_LABELS[selectedExpense.paymentMethod] ||
                      selectedExpense.paymentMethod}
                  </p>
                </div>
              )}
              {selectedExpense.taxAmount &&
                parseFloat(selectedExpense.taxAmount) > 0 && (
                  <>
                    <div>
                      <p className="text-muted-foreground mb-1">Tax Amount</p>
                      <p className="font-medium">
                        <Currency
                          amount={parseFloat(selectedExpense.taxAmount)}
                        />
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">
                        Total (incl. tax)
                      </p>
                      <p className="font-medium">
                        <Currency
                          amount={
                            parseFloat(selectedExpense.amount) +
                            parseFloat(selectedExpense.taxAmount)
                          }
                        />
                      </p>
                    </div>
                  </>
                )}
              <div>
                <p className="text-muted-foreground mb-1">Billable Status</p>
                <p className="font-medium">
                  {selectedExpense.isBillable ? (
                    <Badge
                      variant="default"
                      className="bg-green-500/10 text-green-500"
                    >
                      Billable
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Non-Billable</Badge>
                  )}
                </p>
              </div>
              {selectedExpense.isBillable && (
                <div>
                  <p className="text-muted-foreground mb-1">Billable To</p>
                  <p className="font-medium">
                    {selectedExpense.clientName || "Unassigned"}
                    {selectedExpense.invoiceId && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Linked to invoice)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {selectedExpense.receiptUrl && (
              <div className="pt-4 border-t">
                <a
                  href={selectedExpense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Receipt className="w-4 h-4" />
                  View Receipt
                </a>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
