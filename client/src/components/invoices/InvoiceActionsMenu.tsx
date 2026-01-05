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
  isLoading?: {
    pdf?: boolean;
    email?: boolean;
    paymentLink?: boolean;
    delete?: boolean;
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

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onDelete}
          disabled={isLoading.delete}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Invoice</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
