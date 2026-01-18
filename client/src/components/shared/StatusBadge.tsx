import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  // Capitalize first letter only (not all uppercase)
  const displayStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        `status-${status.toLowerCase()}`,
        className
      )}
      role="status"
      aria-label={`Status: ${displayStatus}`}
    >
      <span aria-hidden="true">{displayStatus}</span>
      <span className="sr-only">{displayStatus} status</span>
    </span>
  );
}
