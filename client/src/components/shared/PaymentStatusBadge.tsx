import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentStatusBadgeProps {
  status: 'unpaid' | 'partial' | 'paid';
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = {
    unpaid: {
      label: "Unpaid",
      bgClass: "bg-destructive/10",
      textClass: "text-destructive",
      icon: Circle,
    },
    partial: {
      label: "Partial",
      bgClass: "bg-yellow-500/10",
      textClass: "text-yellow-400",
      icon: Clock,
    },
    paid: {
      label: "Paid",
      bgClass: "bg-green-500/10",
      textClass: "text-green-400",
      icon: CheckCircle2,
    },
  };

  const { label, bgClass, textClass, icon: Icon } = config[status];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      bgClass,
      textClass,
      className
    )}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
