import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Currency component - renders monetary values with monospace font
 * Automatically applies font-numeric class for consistent number display
 */
export function Currency({
  amount,
  currency = 'USD',
  className,
}: {
  amount: number | string;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={cn("font-numeric", className)}>
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
 * Invoice number component - renders invoice numbers with monospace font
 * Use for invoice numbers, estimate numbers, receipt numbers, etc.
 */
export function InvoiceNumber({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return <span className={cn("font-numeric", className)}>{value}</span>;
}

/**
 * Generic numeric component - renders any number with monospace font
 * Supports optional decimal places
 */
export function Numeric({
  value,
  decimals,
  className,
}: {
  value: number | string;
  decimals?: number;
  className?: string;
}) {
  const formatted =
    typeof value === 'number' && decimals !== undefined
      ? value.toFixed(decimals)
      : String(value);
  return <span className={cn("font-numeric", className)}>{formatted}</span>;
}
