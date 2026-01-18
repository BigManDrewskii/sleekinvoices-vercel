/**
 * NOWPayments API Client
 *
 * Handles all interactions with the NOWPayments crypto payment gateway.
 * Documentation: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 */

import crypto from "crypto";

const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

interface NOWPaymentsConfig {
  apiKey: string;
  publicKey: string;
  ipnSecret?: string;
}

function getConfig(): NOWPaymentsConfig {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  const publicKey = process.env.NOWPAYMENTS_PUBLIC_KEY;
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

  if (!apiKey || !publicKey) {
    throw new Error("NOWPayments API credentials not configured");
  }

  return { apiKey, publicKey, ipnSecret };
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();

  const response = await fetch(`${NOWPAYMENTS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "x-api-key": config.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Unknown error" }));
    throw new Error(
      `NOWPayments API error: ${error.message || response.statusText}`
    );
  }

  return response.json();
}

// ============================================
// API Status
// ============================================

interface StatusResponse {
  message: string;
}

export async function getApiStatus(): Promise<StatusResponse> {
  return makeRequest<StatusResponse>("/status");
}

// ============================================
// Currencies
// ============================================

interface CurrenciesResponse {
  currencies: string[];
}

export async function getAvailableCurrencies(): Promise<string[]> {
  const response = await makeRequest<CurrenciesResponse>("/currencies");
  return response.currencies;
}

interface MinAmountResponse {
  currency_from: string;
  currency_to: string;
  min_amount: number;
}

export async function getMinimumPaymentAmount(
  currencyFrom: string,
  currencyTo: string
): Promise<number> {
  const response = await makeRequest<MinAmountResponse>(
    `/min-amount?currency_from=${currencyFrom}&currency_to=${currencyTo}`
  );
  return response.min_amount;
}

// ============================================
// Price Estimation
// ============================================

interface EstimatedPriceResponse {
  currency_from: string;
  amount_from: number;
  currency_to: string;
  estimated_amount: string;
}

export async function getEstimatedPrice(
  amount: number,
  currencyFrom: string,
  currencyTo: string
): Promise<string> {
  const response = await makeRequest<EstimatedPriceResponse>(
    `/estimate?amount=${amount}&currency_from=${currencyFrom}&currency_to=${currencyTo}`
  );
  return response.estimated_amount;
}

// ============================================
// Payment Creation
// ============================================

interface CreatePaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  ipn_callback_url?: string;
  order_id?: string;
  order_description?: string;
  success_url?: string;
  cancel_url?: string;
}

interface PaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  smart_contract?: string;
  network?: string;
  network_precision?: number;
  time_limit?: string;
  burning_percent?: number;
  expiration_estimate_date?: string;
  invoice_url?: string;
}

export async function createPayment(params: {
  priceAmount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId?: string;
  orderDescription?: string;
  ipnCallbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<PaymentResponse> {
  const body: CreatePaymentRequest = {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency,
    pay_currency: params.payCurrency,
    order_id: params.orderId,
    order_description: params.orderDescription,
    ipn_callback_url: params.ipnCallbackUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };

  return makeRequest<PaymentResponse>("/payment", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ============================================
// Invoice Creation (Alternative to Payment)
// ============================================

interface CreateInvoiceRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  ipn_callback_url?: string;
  order_id?: string;
  order_description?: string;
  success_url?: string;
  cancel_url?: string;
  is_fixed_rate?: boolean;
  is_fee_paid_by_user?: boolean;
}

interface InvoiceResponse {
  id: string;
  token_id: string;
  order_id: string;
  order_description: string;
  price_amount: string;
  price_currency: string;
  pay_currency: string | null;
  ipn_callback_url: string;
  invoice_url: string;
  success_url: string;
  cancel_url: string;
  created_at: string;
  updated_at: string;
  is_fixed_rate: boolean;
  is_fee_paid_by_user: boolean;
}

export async function createInvoice(params: {
  priceAmount: number;
  priceCurrency: string;
  payCurrency?: string;
  orderId?: string;
  orderDescription?: string;
  ipnCallbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  isFixedRate?: boolean;
  isFeePaidByUser?: boolean;
}): Promise<InvoiceResponse> {
  const body: CreateInvoiceRequest = {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency,
    pay_currency: params.payCurrency,
    order_id: params.orderId,
    order_description: params.orderDescription,
    ipn_callback_url: params.ipnCallbackUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    is_fixed_rate: params.isFixedRate,
    is_fee_paid_by_user: params.isFeePaidByUser,
  };

  return makeRequest<InvoiceResponse>("/invoice", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ============================================
// Payment Status
// ============================================

export type PaymentStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "refunded"
  | "expired";

interface PaymentStatusResponse {
  payment_id: number;
  payment_status: PaymentStatus;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount: number;
  outcome_currency: string;
}

export async function getPaymentStatus(
  paymentId: string
): Promise<PaymentStatusResponse> {
  return makeRequest<PaymentStatusResponse>(`/payment/${paymentId}`);
}

// ============================================
// IPN (Instant Payment Notification) Verification
// ============================================

/**
 * Verify IPN callback signature
 * NOWPayments sends a signature in the x-nowpayments-sig header
 * that must be verified using the IPN secret key
 */
export function verifyIPNSignature(
  payload: Record<string, unknown>,
  signature: string
): boolean {
  const config = getConfig();

  // Use IPN secret if available, otherwise fall back to public key
  const secretKey = config.ipnSecret || config.publicKey;

  if (!secretKey) {
    // SECURITY: Fail hard in production if no secret configured
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[NOWPayments] CRITICAL: No IPN secret configured in production - rejecting webhook"
      );
      return false;
    }
    console.warn(
      "[NOWPayments] ⚠️  No IPN secret configured - accepting unsigned webhook (DEVELOPMENT ONLY)"
    );
    return true;
  }

  // Sort payload keys alphabetically and create string
  const sortedPayload = Object.keys(payload)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = payload[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  const payloadString = JSON.stringify(sortedPayload);

  // Create HMAC signature using the IPN secret
  const hmac = crypto.createHmac("sha512", secretKey);
  hmac.update(payloadString);
  const calculatedSignature = hmac.digest("hex");

  return calculatedSignature === signature;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get popular cryptocurrencies for display
 */
export function getPopularCurrencies(): string[] {
  return [
    "btc",
    "eth",
    "usdt",
    "usdc",
    "ltc",
    "doge",
    "sol",
    "xrp",
    "bnb",
    "matic",
  ];
}

/**
 * Format crypto currency display name
 */
export function formatCurrencyName(currency: string): string {
  const names: Record<string, string> = {
    btc: "Bitcoin (BTC)",
    eth: "Ethereum (ETH)",
    usdt: "Tether (USDT)",
    usdc: "USD Coin (USDC)",
    ltc: "Litecoin (LTC)",
    doge: "Dogecoin (DOGE)",
    sol: "Solana (SOL)",
    xrp: "Ripple (XRP)",
    bnb: "BNB",
    matic: "Polygon (MATIC)",
    dai: "DAI",
    trx: "TRON (TRX)",
  };

  return names[currency.toLowerCase()] || currency.toUpperCase();
}

/**
 * Check if a payment status indicates the payment is complete
 */
export function isPaymentComplete(status: PaymentStatus): boolean {
  return status === "finished" || status === "confirmed";
}

/**
 * Check if a payment status indicates the payment is pending
 */
export function isPaymentPending(status: PaymentStatus): boolean {
  return (
    status === "waiting" || status === "confirming" || status === "sending"
  );
}

/**
 * Check if a payment status indicates the payment failed
 */
export function isPaymentFailed(status: PaymentStatus): boolean {
  return status === "failed" || status === "expired" || status === "refunded";
}
