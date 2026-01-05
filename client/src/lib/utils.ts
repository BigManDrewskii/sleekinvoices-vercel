import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currencyCode: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Crypto currencies need special handling
  const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'DOGE', 'SOL', 'XRP', 'MATIC', 'BNB', 'ADA', 'AVAX', 'DOT', 'TRX', 'SHIB'];
  
  if (cryptoCurrencies.includes(currencyCode)) {
    // For crypto, use more decimal places and symbol suffix
    const symbols: Record<string, string> = {
      BTC: '₿', ETH: 'Ξ', USDT: '₮', USDC: '$', LTC: 'Ł', DOGE: 'Ð',
      SOL: '◎', XRP: '✕', MATIC: 'M', BNB: 'B', ADA: '₳', AVAX: 'A',
      DOT: '●', TRX: 'T', SHIB: 'S'
    };
    const decimals = ['BTC', 'ETH', 'LTC', 'DOGE', 'MATIC', 'BNB', 'AVAX'].includes(currencyCode) ? 8 : 6;
    return `${num.toFixed(decimals)} ${symbols[currencyCode] || currencyCode}`;
  }
  
  // For fiat currencies, use Intl.NumberFormat
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(num);
  } catch {
    // Fallback for unknown currencies
    return `${currencyCode} ${num.toFixed(2)}`;
  }
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}
