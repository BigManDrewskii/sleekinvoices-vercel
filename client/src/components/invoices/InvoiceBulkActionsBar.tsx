import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckSquare,
  XSquare,
  Mail,
  Link as LinkIcon,
  Check,
  FileText,
  Trash2,
  ChevronDown,
} from "lucide-react";

interface InvoiceBulkActionsBarProps {
  selectedIds: Set<number>;
  clearSelection: () => void;
  handleBulkSendEmail: () => void;
  handleBulkCreatePaymentLinks: () => void;
  handleBulkUpdateStatus: (
    status: "draft" | "sent" | "paid" | "overdue" | "canceled"
  ) => void;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  bulkSendEmail: { isPending: boolean };
  bulkCreatePaymentLinks: { isPending: boolean };
  bulkUpdateStatus: { isPending: boolean };
}

export function InvoiceBulkActionsBar({
  selectedIds,
  clearSelection,
  handleBulkSendEmail,
  handleBulkCreatePaymentLinks,
  handleBulkUpdateStatus,
  setBulkDeleteDialogOpen,
  bulkSendEmail,
  bulkCreatePaymentLinks,
  bulkUpdateStatus,
}: InvoiceBulkActionsBarProps) {
  return (
    <>
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedIds.size} invoice{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSelection}>
              <XSquare className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => handleBulkSendEmail()}
                  disabled={bulkSendEmail.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Emails
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkCreatePaymentLinks()}
                  disabled={bulkCreatePaymentLinks.isPending}
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Create Payment Links
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleBulkUpdateStatus("sent")}
                  disabled={bulkUpdateStatus.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Mark as Sent
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkUpdateStatus("paid")}
                  disabled={bulkUpdateStatus.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Paid
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkUpdateStatus("draft")}
                  disabled={bulkUpdateStatus.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Mark as Draft
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </>
  );
}
