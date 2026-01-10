import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Currency component - renders monetary values with SUSE Mono font
 * Automatically applies font-numeric class for consistent number display
 * @param bold - Use bold weight (700) for emphasis
 */
export function Currency({
  amount,
  currency = 'USD',
  className,
  bold = false,
}: {
  amount: number | string;
  currency?: string;
  className?: string;
  bold?: boolean;
}) {
  return (
    <span className={cn(bold ? "font-numeric-bold" : "font-numeric", className)}>
      {formatCurrency(amount, currency)}
    </span>
  );
}

/**
 * Date display component - renders dates with monospace font
 * Supports both short and long formats
 */
export function DateDisplay({
  date,
  format = 'short',
  className,
}: {
  date: Date | string;
  format?: 'short' | 'long';
  className?: string;
}) {
  const formatted = format === 'short' ? formatDateShort(date) : formatDate(date);
  return <span className={cn("font-numeric", className)}>{formatted}</span>;
}

/**
 * Invoice number component - renders invoice numbers with SUSE Mono font
 * Use for invoice numbers, estimate numbers, receipt numbers, etc.
 * Uses bold weight by default for prominence
 * @param bold - Use bold weight (default: true)
 */
export function InvoiceNumber({
  value,
  className,
  bold = true,
}: {
  value: string;
  className?: string;
  bold?: boolean;
}) {
  return <span className={cn(bold ? "font-numeric-bold" : "font-numeric", className)}>{value}</span>;
}

/**
 * Generic numeric component - renders any number with SUSE Mono font
 * Supports optional decimal places and bold weight
 * @param bold - Use bold weight (700) for emphasis
 */
export function Numeric({
  value,
  decimals,
  className,
  bold = false,
}: {
  value: number | string;
  decimals?: number;
  className?: string;
  bold?: boolean;
}) {
  const formatted =
    typeof value === 'number' && decimals !== undefined
      ? value.toFixed(decimals)
      : String(value);
  return <span className={cn(bold ? "font-numeric-bold" : "font-numeric", className)}>{formatted}</span>;
}
