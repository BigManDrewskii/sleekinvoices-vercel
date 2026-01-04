import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface PaymentStatusBadgeProps {
  status: 'unpaid' | 'partial' | 'paid';
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = {
    unpaid: {
      label: "Unpaid",
      variant: "destructive" as const,
      icon: Circle,
    },
    partial: {
      label: "Partially Paid",
      variant: "secondary" as const,
      icon: Clock,
    },
    paid: {
      label: "Paid",
      variant: "default" as const,
      icon: CheckCircle2,
    },
  };

  const { label, variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
