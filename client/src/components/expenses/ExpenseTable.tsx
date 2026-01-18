import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Eye,
  MoreHorizontal,
  Trash2,
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
import { Button } from "@/components/ui/button";
import { Currency } from "@/components/ui/typography";
import { DateDisplay } from "@/components/ui/typography";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import {
  DataTableEmpty,
  DataTableLoading,
} from "@/components/ui/data-table-empty";
import type { ExpenseWithDetails } from "@shared/types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  check: "Check",
  other: "Other",
};

interface ExpenseTableProps {
  isLoading: boolean;
  expenses: ExpenseWithDetails[] | undefined;
  filteredAndSortedExpenses: ExpenseWithDetails[];
  paginatedExpenses: ExpenseWithDetails[];
  totalItems: number;
  totalPages: number;
  pageSize: number;
  currentPage: number;
  sort: { key: string; direction: "asc" | "desc" };
  handleSort: (key: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  openExpenseDetails: (expense: ExpenseWithDetails) => void;
  handleEdit: (expense: ExpenseWithDetails) => void;
  deleteExpenseMutation: any;
  hasActiveFilters: boolean;
  setIsExpenseDialogOpen: (open: boolean) => void;
  clearAllFilters: () => void;
}

export function ExpenseTable({
  isLoading,
  expenses,
  filteredAndSortedExpenses,
  paginatedExpenses,
  totalItems,
  totalPages,
  pageSize,
  currentPage,
  sort,
  handleSort,
  setCurrentPage,
  setPageSize,
  openExpenseDetails,
  handleEdit,
  deleteExpenseMutation,
  hasActiveFilters,
  setIsExpenseDialogOpen,
  clearAllFilters,
}: ExpenseTableProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            {filteredAndSortedExpenses.length} expense
            {filteredAndSortedExpenses.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader
                  label="Description"
                  sortKey="description"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Category"
                  sortKey="categoryName"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <SortableTableHeader
                  label="Date"
                  sortKey="date"
                  currentSort={sort}
                  onSort={handleSort}
                />
                <TableHead>Payment</TableHead>
                <SortableTableHeader
                  label="Amount"
                  sortKey="amount"
                  currentSort={sort}
                  onSort={handleSort}
                  align="right"
                />
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <DataTableLoading colSpan={7} rows={5} />
              ) : !expenses || expenses.length === 0 ? (
                <DataTableEmpty
                  colSpan={7}
                  preset="expenses"
                  action={{
                    label: "Add Your First Expense",
                    onClick: () => setIsExpenseDialogOpen(true),
                  }}
                />
              ) : filteredAndSortedExpenses.length === 0 ? (
                <DataTableEmpty
                  colSpan={7}
                  title="No matching expenses"
                  description="No expenses match your current filters"
                  illustration="/sleeky/empty-states/search-results.png"
                  action={{
                    label: "Clear Filters",
                    onClick: clearAllFilters,
                  }}
                />
              ) : (
                paginatedExpenses.map((expense: ExpenseWithDetails) => (
                  <TableRow
                    key={expense.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openExpenseDetails(expense)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: expense.categoryColor || "#3B82F6",
                          }}
                        />
                        <div>
                          <div className="font-medium">
                            {expense.description}
                          </div>
                          {expense.vendor && (
                            <div className="text-sm text-muted-foreground">
                              {expense.vendor}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.categoryName}</Badge>
                    </TableCell>
                    <TableCell>
                      <DateDisplay date={expense.date} />
                    </TableCell>
                    <TableCell>
                      {expense.paymentMethod ? (
                        <span className="text-sm">
                          {PAYMENT_METHOD_LABELS[expense.paymentMethod] ||
                            expense.paymentMethod}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <Currency amount={parseFloat(expense.amount)} bold />
                        {expense.taxAmount &&
                          parseFloat(expense.taxAmount) > 0 && (
                            <div className="text-xs text-muted-foreground">
                              +
                              <Currency
                                amount={parseFloat(expense.taxAmount)}
                              />{" "}
                              tax
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expense.isBillable ? (
                          <Badge
                            variant="default"
                            className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          >
                            Billable
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Non-Billable</Badge>
                        )}
                        {expense.receiptUrl && (
                          <Receipt className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={e => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              openExpenseDetails(expense);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {expense.receiptUrl && (
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation();
                                window.open(expense.receiptUrl!, "_blank");
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Receipt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              handleEdit(expense);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={e => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this expense?"
                                )
                              ) {
                                deleteExpenseMutation.mutate(expense.id);
                              }
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
          {/* Pagination */}
          {!isLoading &&
            expenses &&
            expenses.length > 0 &&
            filteredAndSortedExpenses.length > 0 &&
            totalPages > 1 && (
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
        </CardContent>
      </Card>
    </>
  );
}
