import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

interface PaymentProgressProps {
  totalPaid: number;
  total: number;
  currency?: string;
  showDetails?: boolean;
}

export function PaymentProgress({ 
  totalPaid, 
  total, 
  currency = "USD",
  showDetails = true 
}: PaymentProgressProps) {
  const percentage = total > 0 ? Math.round((totalPaid / total) * 100) : 0;
  const amountDue = Math.max(0, total - totalPaid);

  return (
    <div className="space-y-2">
      <Progress value={percentage} className="h-2" />
      {showDetails && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {formatCurrency(totalPaid)} of {formatCurrency(total)}
          </span>
          <span>{percentage}%</span>
        </div>
      )}
      {showDetails && amountDue > 0 && (
        <div className="text-sm text-muted-foreground">
          Amount due: {formatCurrency(amountDue)}
        </div>
      )}
    </div>
  );
}
