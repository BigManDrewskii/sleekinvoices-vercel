import { cn } from "@/lib/utils";

interface NumericDisplayProps {
  children: React.ReactNode;
  className?: string;
  bold?: boolean;
  variant?: "normal" | "bold";
}

/**
 * NumericDisplay - Wraps numerical content with SUSE Mono font
 *
 * Usage:
 * <NumericDisplay>$1,234.56</NumericDisplay>
 * <NumericDisplay bold>$1,234.56</NumericDisplay>
 * <NumericDisplay variant="bold">$1,234.56</NumericDisplay>
 */
export function NumericDisplay({
  children,
  className,
  bold,
  variant,
}: NumericDisplayProps) {
  const isBold = bold || variant === "bold";

  return (
    <span
      className={cn(isBold ? "font-numeric-bold" : "font-numeric", className)}
    >
      {children}
    </span>
  );
}

/**
 * CurrencyDisplay - Specialized for currency amounts
 * Always uses the SUSE Mono font for consistent numerical display
 */
export function CurrencyDisplay({
  children,
  className,
  bold,
}: Omit<NumericDisplayProps, "variant">) {
  return (
    <NumericDisplay className={cn("currency", className)} bold={bold}>
      {children}
    </NumericDisplay>
  );
}

/**
 * InvoiceNumber - Specialized for invoice/document numbers
 * Uses bold weight by default for emphasis
 */
export function InvoiceNumber({
  children,
  className,
}: Omit<NumericDisplayProps, "bold" | "variant">) {
  return (
    <span className={cn("font-numeric-bold invoice-number", className)}>
      {children}
    </span>
  );
}

/**
 * MetricValue - For dashboard metrics and statistics
 * Uses bold weight for prominence
 */
export function MetricValue({
  children,
  className,
}: Omit<NumericDisplayProps, "bold" | "variant">) {
  return (
    <span className={cn("font-numeric-bold metric-value", className)}>
      {children}
    </span>
  );
}
