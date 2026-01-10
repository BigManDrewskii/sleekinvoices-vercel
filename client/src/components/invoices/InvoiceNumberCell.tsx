import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface InvoiceNumberCellProps {
  invoiceNumber: string;
  maxLength?: number;
}

export function InvoiceNumberCell({
  invoiceNumber,
  maxLength = 20,
}: InvoiceNumberCellProps) {
  const isLong = invoiceNumber.length > maxLength;
  const displayText = isLong ? `${invoiceNumber.substring(0, maxLength)}...` : invoiceNumber;

  const handleCopy = () => {
    navigator.clipboard.writeText(invoiceNumber);
    toast.success("Invoice number copied to clipboard");
  };

  if (!isLong) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-numeric-bold">{invoiceNumber}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          aria-label="Copy invoice number"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <span className="font-numeric-bold text-muted-foreground">{displayText}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
              aria-label="Copy invoice number"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-numeric text-sm">{invoiceNumber}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
