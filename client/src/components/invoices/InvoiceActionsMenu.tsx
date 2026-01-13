import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Download,
  Mail,
  Link as LinkIcon,
  Trash2,
  MoreVertical,
  RefreshCw,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceActionsMenuProps {
  invoiceId: number;
  invoiceNumber: string;
  hasPaymentLink: boolean;
  onView: () => void;
  onEdit: () => void;
  onDownloadPDF: () => void;
  onSendEmail: () => void;
  onCreatePaymentLink: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSyncToQuickBooks?: () => void;
  quickBooksConnected?: boolean;
  quickBooksSynced?: boolean;
  isLoading?: {
    pdf?: boolean;
    email?: boolean;
    paymentLink?: boolean;
    delete?: boolean;
    duplicate?: boolean;
    quickBooksSync?: boolean;
  };
}

export function InvoiceActionsMenu({
  invoiceId,
  invoiceNumber,
  hasPaymentLink,
  onView,
  onEdit,
  onDownloadPDF,
  onSendEmail,
  onCreatePaymentLink,
  onDelete,
  onDuplicate,
  onSyncToQuickBooks,
  quickBooksConnected = false,
  quickBooksSynced = false,
  isLoading = {},
}: InvoiceActionsMenuProps) {
  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoiceNumber);
    toast.success("Invoice number copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label={`Actions for invoice ${invoiceNumber}`}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onView} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          <span>View Invoice</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Invoice</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyInvoiceNumber} className="cursor-pointer">
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Copy Invoice #</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDuplicate}
          disabled={isLoading.duplicate}
          className="cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicate Invoice</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onDownloadPDF}
          disabled={isLoading.pdf}
          className="cursor-pointer"
        >
          <Download className="mr-2 h-4 w-4" />
          <span>Download PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onSendEmail}
          disabled={isLoading.email}
          className="cursor-pointer"
        >
          <Mail className="mr-2 h-4 w-4" />
          <span>Send Email</span>
        </DropdownMenuItem>
        {!hasPaymentLink && (
          <DropdownMenuItem
            onClick={onCreatePaymentLink}
            disabled={isLoading.paymentLink}
            className="cursor-pointer"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            <span>Create Payment Link</span>
          </DropdownMenuItem>
        )}
        {quickBooksConnected && onSyncToQuickBooks && (
          <DropdownMenuItem
            onClick={onSyncToQuickBooks}
            disabled={isLoading.quickBooksSync}
            className="cursor-pointer"
          >
            {isLoading.quickBooksSync ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : quickBooksSynced ? (
              <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            <span>{quickBooksSynced ? 'Re-sync to QuickBooks' : 'Sync to QuickBooks'}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onDelete}
          disabled={isLoading.delete}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Invoice</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
