import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendIndicatorProps {
  percentage: number;
  isPositive?: boolean;
  showLabel?: boolean;
}

export function TrendIndicator({
  percentage,
  isPositive = percentage >= 0,
  showLabel = true,
}: TrendIndicatorProps) {
  const absPercentage = Math.abs(percentage);
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? "text-green-500" : "text-red-500";
  const bgColor = isPositive ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950";

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded ${bgColor}`}>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>
        {isPositive ? "+" : "-"}
        {absPercentage.toFixed(1)}%
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">vs last month</span>
      )}
    </div>
  );
}
