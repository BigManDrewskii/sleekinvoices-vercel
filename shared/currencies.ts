/**
 * Currency definitions for multi-currency invoicing
 * Supports both fiat currencies and cryptocurrencies
 */

export type CurrencyType = "fiat" | "crypto";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  type: CurrencyType;
  decimals: number; // Number of decimal places for display/input
  minAmount: number; // Minimum amount for this currency
}

// Fiat currencies
export const FIAT_CURRENCIES: Currency[] = [
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    type: "fiat",
    decimals: 0,
    minAmount: 1,
  },
  {
    code: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "CNY",
    name: "Chinese Yuan",
    symbol: "¥",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "MXN",
    name: "Mexican Peso",
    symbol: "MX$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "BRL",
    name: "Brazilian Real",
    symbol: "R$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "KRW",
    name: "South Korean Won",
    symbol: "₩",
    type: "fiat",
    decimals: 0,
    minAmount: 1,
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "HKD",
    name: "Hong Kong Dollar",
    symbol: "HK$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "SEK",
    name: "Swedish Krona",
    symbol: "kr",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "NOK",
    name: "Norwegian Krone",
    symbol: "kr",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "DKK",
    name: "Danish Krone",
    symbol: "kr",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "PLN",
    name: "Polish Zloty",
    symbol: "zł",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
  {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    type: "fiat",
    decimals: 2,
    minAmount: 0.01,
  },
];

// Cryptocurrencies - aligned with NOWPayments supported currencies
export const CRYPTO_CURRENCIES: Currency[] = [
  {
    code: "BTC",
    name: "Bitcoin",
    symbol: "₿",
    type: "crypto",
    decimals: 8,
    minAmount: 0.00001,
  },
  {
    code: "ETH",
    name: "Ethereum",
    symbol: "Ξ",
    type: "crypto",
    decimals: 8,
    minAmount: 0.0001,
  },
  {
    code: "USDT",
    name: "Tether",
    symbol: "₮",
    type: "crypto",
    decimals: 6,
    minAmount: 1,
  },
  {
    code: "USDC",
    name: "USD Coin",
    symbol: "$",
    type: "crypto",
    decimals: 6,
    minAmount: 1,
  },
  {
    code: "LTC",
    name: "Litecoin",
    symbol: "Ł",
    type: "crypto",
    decimals: 8,
    minAmount: 0.001,
  },
  {
    code: "DOGE",
    name: "Dogecoin",
    symbol: "Ð",
    type: "crypto",
    decimals: 8,
    minAmount: 1,
  },
  {
    code: "SOL",
    name: "Solana",
    symbol: "◎",
    type: "crypto",
    decimals: 9,
    minAmount: 0.01,
  },
  {
    code: "XRP",
    name: "Ripple",
    symbol: "✕",
    type: "crypto",
    decimals: 6,
    minAmount: 1,
  },
  {
    code: "MATIC",
    name: "Polygon",
    symbol: "M",
    type: "crypto",
    decimals: 8,
    minAmount: 1,
  },
  {
    code: "BNB",
    name: "BNB",
    symbol: "B",
    type: "crypto",
    decimals: 8,
    minAmount: 0.001,
  },
  {
    code: "ADA",
    name: "Cardano",
    symbol: "₳",
    type: "crypto",
    decimals: 6,
    minAmount: 1,
  },
  {
    code: "AVAX",
    name: "Avalanche",
    symbol: "A",
    type: "crypto",
    decimals: 8,
    minAmount: 0.01,
  },
  {
    code: "DOT",
    name: "Polkadot",
    symbol: "●",
    type: "crypto",
    decimals: 10,
    minAmount: 0.1,
  },
  {
    code: "TRX",
    name: "Tron",
    symbol: "T",
    type: "crypto",
    decimals: 6,
    minAmount: 10,
  },
  {
    code: "SHIB",
    name: "Shiba Inu",
    symbol: "S",
    type: "crypto",
    decimals: 8,
    minAmount: 100000,
  },
];

// All currencies combined
export const ALL_CURRENCIES: Currency[] = [
  ...FIAT_CURRENCIES,
  ...CRYPTO_CURRENCIES,
];

// Currency lookup by code
export const CURRENCY_MAP: Record<string, Currency> = ALL_CURRENCIES.reduce(
  (acc, currency) => {
    acc[currency.code] = currency;
    return acc;
  },
  {} as Record<string, Currency>
);

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCY_MAP[code];
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(code: string): string {
  const currency = CURRENCY_MAP[code];
  return currency?.symbol || code;
}

/**
 * Get number of decimal places for a currency
 */
export function getCurrencyDecimals(code: string): number {
  const currency = CURRENCY_MAP[code];
  return currency?.decimals ?? 2;
}

/**
 * Format amount with correct currency symbol and decimals
 */
export function formatCurrencyAmount(
  amount: number | string,
  currencyCode: string
): string {
  const currency = CURRENCY_MAP[currencyCode];
  if (!currency) {
    return `${amount} ${currencyCode}`;
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = numAmount.toFixed(currency.decimals);

  // For crypto, put symbol after amount; for fiat, put before
  if (currency.type === "crypto") {
    return `${formatted} ${currency.symbol}`;
  } else {
    return `${currency.symbol}${formatted}`;
  }
}

/**
 * Check if currency is a cryptocurrency
 */
export function isCryptoCurrency(code: string): boolean {
  const currency = CURRENCY_MAP[code];
  return currency?.type === "crypto";
}

/**
 * Get minimum amount for a currency
 */
export function getMinAmount(code: string): number {
  const currency = CURRENCY_MAP[code];
  return currency?.minAmount ?? 0.01;
}

/**
 * Validate amount for a specific currency
 */
export function validateAmount(
  amount: number,
  currencyCode: string
): { valid: boolean; error?: string } {
  const currency = CURRENCY_MAP[currencyCode];
  if (!currency) {
    return { valid: false, error: `Unknown currency: ${currencyCode}` };
  }

  if (amount < currency.minAmount) {
    return {
      valid: false,
      error: `Minimum amount is ${formatCurrencyAmount(currency.minAmount, currencyCode)}`,
    };
  }

  // Check decimal precision
  const decimalPlaces = (amount.toString().split(".")[1] || "").length;
  if (decimalPlaces > currency.decimals) {
    return {
      valid: false,
      error: `Maximum ${currency.decimals} decimal places allowed for ${currency.name}`,
    };
  }

  return { valid: true };
}

/**
 * Popular currencies for quick selection
 */
export const POPULAR_FIAT = ["USD", "EUR", "GBP", "CAD", "AUD"];
export const POPULAR_CRYPTO = ["BTC", "ETH", "USDT", "USDC", "SOL"];

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = "USD";
