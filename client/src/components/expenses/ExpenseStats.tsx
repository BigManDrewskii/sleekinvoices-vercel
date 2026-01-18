import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { DollarSign, FileText, Receipt, Tag } from "lucide-react";
import { Currency } from "@/components/ui/typography";

interface ExpenseStatsProps {
  stats: {
    totalAmount: number;
    totalTax: number;
    totalWithTax: number;
    count: number;
    billableCount: number;
    nonBillableCount: number;
    billableAmount: number;
  };
  hasActiveFilters: boolean;
  expenses: Array<{ amount: string }> | undefined;
}

export function ExpenseStats({
  stats,
  hasActiveFilters,
  expenses,
}: ExpenseStatsProps) {
  return (
    <>
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
    </>
  );
}
