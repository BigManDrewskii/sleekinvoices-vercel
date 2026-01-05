/**
 * Decimal Precision Utilities
 * 
 * Provides precise decimal arithmetic for financial calculations,
 * especially important for cryptocurrency amounts with up to 18 decimal places.
 * 
 * Uses decimal.js to avoid JavaScript floating-point precision issues.
 */

import Decimal from 'decimal.js';

// Configure Decimal.js for high precision
Decimal.set({
  precision: 30,      // 30 significant digits
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,      // Don't use exponential notation for small numbers
  toExpPos: 30,       // Don't use exponential notation for large numbers
});

/**
 * Create a Decimal from various input types
 */
export function toDecimal(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) return value;
  if (typeof value === 'string' && value.trim() === '') return new Decimal(0);
  return new Decimal(value);
}

/**
 * Add two decimal values
 */
export function add(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

/**
 * Subtract b from a
 */
export function subtract(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Multiply two decimal values
 */
export function multiply(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Divide a by b
 */
export function divide(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    throw new Error('Division by zero');
  }
  return toDecimal(a).dividedBy(divisor);
}

/**
 * Calculate percentage of a value
 * @param value - The base value
 * @param percentage - The percentage (e.g., 10 for 10%)
 */
export function percentage(value: string | number | Decimal, pct: string | number | Decimal): Decimal {
  return multiply(value, divide(pct, 100));
}

/**
 * Sum an array of values
 */
export function sum(values: (string | number | Decimal)[]): Decimal {
  return values.reduce((acc, val) => add(acc, val), new Decimal(0));
}

/**
 * Format a decimal for display with specified decimal places
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2 for fiat, 8 for crypto)
 * @param trimTrailingZeros - Whether to remove trailing zeros
 */
export function formatDecimal(
  value: string | number | Decimal,
  decimals: number = 2,
  trimTrailingZeros: boolean = false
): string {
  const decimal = toDecimal(value);
  const formatted = decimal.toFixed(decimals);
  
  if (trimTrailingZeros) {
    // Remove trailing zeros but keep at least 2 decimal places for fiat
    const minDecimals = decimals >= 2 ? 2 : decimals;
    const parts = formatted.split('.');
    if (parts.length === 2) {
      let decimalPart = parts[1].replace(/0+$/, '');
      if (decimalPart.length < minDecimals) {
        decimalPart = decimalPart.padEnd(minDecimals, '0');
      }
      return decimalPart.length > 0 ? `${parts[0]}.${decimalPart}` : parts[0];
    }
  }
  
  return formatted;
}

/**
 * Format a decimal as currency
 * @param value - The value to format
 * @param currency - Currency code (e.g., 'USD', 'EUR', 'BTC')
 * @param locale - Locale for formatting (default: 'en-US')
 */
export function formatCurrency(
  value: string | number | Decimal,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const decimal = toDecimal(value);
  
  // Crypto currencies need more decimal places
  const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'XRP', 'ADA', 'DOT', 'MATIC', 'AVAX'];
  const isCrypto = cryptoCurrencies.includes(currency.toUpperCase());
  
  if (isCrypto) {
    // For crypto, show up to 8 decimal places, trimming trailing zeros
    const formatted = formatDecimal(decimal, 8, true);
    return `${formatted} ${currency.toUpperCase()}`;
  }
  
  // For fiat currencies, use Intl.NumberFormat
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(decimal.toNumber());
  } catch {
    // Fallback for unknown currencies
    return `${currency} ${formatDecimal(decimal, 2)}`;
  }
}

/**
 * Compare two decimal values
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: string | number | Decimal, b: string | number | Decimal): -1 | 0 | 1 {
  const result = toDecimal(a).comparedTo(toDecimal(b));
  return result as -1 | 0 | 1;
}

/**
 * Check if a value is zero
 */
export function isZero(value: string | number | Decimal): boolean {
  return toDecimal(value).isZero();
}

/**
 * Check if a value is positive
 */
export function isPositive(value: string | number | Decimal): boolean {
  return toDecimal(value).isPositive() && !toDecimal(value).isZero();
}

/**
 * Check if a value is negative
 */
export function isNegative(value: string | number | Decimal): boolean {
  return toDecimal(value).isNegative();
}

/**
 * Get the minimum of two values
 */
export function min(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return Decimal.min(toDecimal(a), toDecimal(b));
}

/**
 * Get the maximum of two values
 */
export function max(a: string | number | Decimal, b: string | number | Decimal): Decimal {
  return Decimal.max(toDecimal(a), toDecimal(b));
}

/**
 * Round a value to specified decimal places
 */
export function round(value: string | number | Decimal, decimals: number = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}

/**
 * Calculate line item amount (quantity * rate)
 */
export function calculateLineItemAmount(
  quantity: string | number | Decimal,
  rate: string | number | Decimal
): Decimal {
  return multiply(quantity, rate);
}

/**
 * Calculate invoice subtotal from line items
 */
export function calculateSubtotal(
  lineItems: Array<{ quantity: string | number; rate: string | number }>
): Decimal {
  return sum(lineItems.map(item => calculateLineItemAmount(item.quantity, item.rate)));
}

/**
 * Calculate tax amount
 */
export function calculateTax(
  subtotal: string | number | Decimal,
  taxRate: string | number | Decimal
): Decimal {
  return percentage(subtotal, taxRate);
}

/**
 * Calculate discount amount
 * @param subtotal - The subtotal before discount
 * @param discountValue - The discount value
 * @param discountType - 'percentage' or 'fixed'
 */
export function calculateDiscount(
  subtotal: string | number | Decimal,
  discountValue: string | number | Decimal,
  discountType: 'percentage' | 'fixed'
): Decimal {
  if (discountType === 'percentage') {
    return percentage(subtotal, discountValue);
  }
  return toDecimal(discountValue);
}

/**
 * Calculate invoice total
 */
export function calculateTotal(
  subtotal: string | number | Decimal,
  taxAmount: string | number | Decimal,
  discountAmount: string | number | Decimal
): Decimal {
  return subtract(add(subtotal, taxAmount), discountAmount);
}

/**
 * Calculate remaining balance
 */
export function calculateBalance(
  total: string | number | Decimal,
  amountPaid: string | number | Decimal
): Decimal {
  return subtract(total, amountPaid);
}

/**
 * Calculate payment progress percentage
 */
export function calculatePaymentProgress(
  total: string | number | Decimal,
  amountPaid: string | number | Decimal
): number {
  const totalDecimal = toDecimal(total);
  if (totalDecimal.isZero()) return 100;
  
  const progress = divide(amountPaid, total).times(100);
  return Math.min(100, Math.max(0, progress.toNumber()));
}

// Export Decimal class for advanced usage
export { Decimal };
