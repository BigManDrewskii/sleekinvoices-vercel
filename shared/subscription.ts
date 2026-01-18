/**
 * Subscription Plans & Feature Configuration
 *
 * This file defines the subscription tiers, pricing, and feature flags for the application.
 * Import these constants throughout the codebase to ensure consistent subscription logic.
 *
 * @example
 * ```typescript
 * import { SUBSCRIPTION_PLANS, isPro, canCreateInvoice } from '@/shared/subscription';
 *
 * // Check if user is on Pro plan
 * if (isPro(user.subscriptionStatus)) {
 *   // Allow unlimited invoices
 * }
 *
 * // Check if user can create another invoice
 * const usage = await getCurrentMonthUsage(userId);
 * if (!canCreateInvoice(user.subscriptionStatus, usage.invoicesCreated)) {
 *   throw new Error('Invoice limit reached');
 * }
 * ```
 */

/**
 * Subscription status from Stripe
 * - free: Free tier (never subscribed or subscription ended)
 * - active: Currently subscribed and paid
 * - trialing: In trial period (treated as Pro)
 * - canceled: Subscription canceled (reverts to free at period end)
 * - past_due: Payment failed (temporarily blocked)
 * - null: Legacy/fallback (treated as free)
 */
export type SubscriptionStatus =
  | "free"
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | null;

/**
 * Subscription plan identifiers
 */
export type SubscriptionPlan = "free" | "pro";

/**
 * Feature flags for subscription plans
 */
export interface PlanFeatures {
  /** Number of invoices allowed per month (null = unlimited) */
  invoices: number | "unlimited";
  /** Number of clients allowed (null = unlimited) */
  clients: "unlimited";
  /** Can generate PDF invoices */
  pdfGeneration: boolean;
  /** Access to basic invoice templates */
  basicTemplates: boolean;
  /** Can create Stripe payment links */
  stripePayments: boolean;
  /** Can send invoices via email */
  emailSending: boolean;
  /** Access to analytics dashboard */
  analytics: boolean;
  /** Can customize branding (logo, colors) */
  customBranding: boolean;
  /** Priority customer support */
  prioritySupport: boolean;
}

/**
 * Subscription plan configuration
 */
export interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  /** Invoice limit per month (null = unlimited) */
  invoiceLimit: number | null;
  features: PlanFeatures;
}

/**
 * Subscription plan definitions
 *
 * FREE PLAN:
 * - 3 invoices per month
 * - Basic features only
 * - No online payments or email sending
 *
 * PRO PLAN:
 * - Unlimited invoices
 * - All premium features
 * - Stripe payments, email sending, analytics
 * - $12/month
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free" as const,
    name: "Free",
    price: 0,
    invoiceLimit: 3,
    features: {
      invoices: 3,
      clients: "unlimited" as const,
      pdfGeneration: true,
      basicTemplates: true,
      stripePayments: false,
      emailSending: false,
      analytics: false,
      customBranding: false,
      prioritySupport: false,
    },
  },
  PRO: {
    id: "pro" as const,
    name: "Pro",
    price: 12,
    invoiceLimit: null, // unlimited
    features: {
      invoices: "unlimited" as const,
      clients: "unlimited" as const,
      pdfGeneration: true,
      basicTemplates: true,
      stripePayments: true,
      emailSending: true,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
    },
  },
} as const;

/**
 * Check if user has an active Pro subscription
 *
 * @param status - User's subscription status from database
 * @returns true if user has Pro access (active or trialing)
 *
 * @example
 * ```typescript
 * if (isPro(user.subscriptionStatus)) {
 *   // User has Pro features
 * } else {
 *   // User is on free tier
 * }
 * ```
 */
export function isPro(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Check if user can create another invoice based on their plan and usage
 *
 * @param status - User's subscription status
 * @param currentMonthCount - Number of invoices created this month
 * @returns true if user can create another invoice
 *
 * @example
 * ```typescript
 * const usage = await getCurrentMonthUsage(userId);
 * if (!canCreateInvoice(user.subscriptionStatus, usage.invoicesCreated)) {
 *   throw new Error('Monthly invoice limit reached. Upgrade to Pro for unlimited invoices.');
 * }
 * ```
 */
export function canCreateInvoice(
  status: SubscriptionStatus,
  currentMonthCount: number
): boolean {
  // Pro users have unlimited invoices
  if (isPro(status)) {
    return true;
  }

  // Free users limited to 3 invoices per month
  return currentMonthCount < SUBSCRIPTION_PLANS.FREE.invoiceLimit;
}

/**
 * Check if user can access a specific feature based on their subscription
 *
 * @param status - User's subscription status
 * @param feature - Feature key to check
 * @returns true if user has access to the feature
 *
 * @example
 * ```typescript
 * if (!canUseFeature(user.subscriptionStatus, 'stripePayments')) {
 *   throw new Error('Stripe payments are a Pro feature');
 * }
 * ```
 */
export function canUseFeature(
  status: SubscriptionStatus,
  feature: keyof PlanFeatures
): boolean {
  // Pro users have access to all features
  if (isPro(status)) {
    return true;
  }

  // Free users only have access to features marked true in FREE plan
  const freeFeature = SUBSCRIPTION_PLANS.FREE.features[feature];
  return freeFeature === true;
}

/**
 * Get the plan object for a given subscription status
 *
 * @param status - User's subscription status
 * @returns Plan configuration object
 *
 * @example
 * ```typescript
 * const plan = getPlan(user.subscriptionStatus);
 * console.log(`User is on ${plan.name} plan ($${plan.price}/month)`);
 * ```
 */
export function getPlan(status: SubscriptionStatus): Plan {
  return isPro(status) ? SUBSCRIPTION_PLANS.PRO : SUBSCRIPTION_PLANS.FREE;
}

/**
 * Get remaining invoices for free tier users
 *
 * @param currentMonthCount - Number of invoices created this month
 * @returns Number of invoices remaining (0 if limit reached)
 *
 * @example
 * ```typescript
 * const remaining = getRemainingInvoices(usage.invoicesCreated);
 * console.log(`You have ${remaining} invoices remaining this month`);
 * ```
 */
export function getRemainingInvoices(currentMonthCount: number): number {
  const limit = SUBSCRIPTION_PLANS.FREE.invoiceLimit;
  const remaining = limit - currentMonthCount;
  return Math.max(0, remaining);
}

/**
 * ============================================================================
 * CRYPTO SUBSCRIPTION TIERS
 * ============================================================================
 *
 * Mullvad-style duration-based pricing for crypto payments.
 * Crypto payments offer discounted rates compared to card payments.
 *
 * Card Price: $12/month
 * Crypto Prices: $10/month (1mo) down to $8.50/month (12mo)
 */

/**
 * Card price per month (baseline for savings calculation)
 */
export const CARD_PRICE_PER_MONTH = SUBSCRIPTION_PLANS.PRO.price; // $12

/**
 * Crypto subscription tier configuration
 */
export interface CryptoSubscriptionTier {
  /** Duration in months */
  months: number;
  /** Display label */
  label: string;
  /** Price per month in USD */
  pricePerMonth: number;
  /** Total price in USD */
  totalPrice: number;
  /** Savings percentage compared to card price */
  savingsPercent: number;
  /** Whether this tier is recommended/popular */
  recommended?: boolean;
}

/**
 * Crypto subscription pricing tiers
 *
 * Pricing Strategy:
 * - 1 month:  $10.00/mo = $10.00 total  (17% savings vs $12 card)
 * - 3 months: $9.50/mo  = $28.50 total  (21% savings vs $36 card)
 * - 6 months: $9.00/mo  = $54.00 total  (25% savings vs $72 card)
 * - 12 months: $8.50/mo = $102.00 total (29% savings vs $144 card)
 */
export const CRYPTO_SUBSCRIPTION_TIERS = {
  MONTHLY: {
    months: 1,
    label: "1 Month",
    pricePerMonth: 10.0,
    totalPrice: 10.0,
    savingsPercent: 17,
  },
  QUARTERLY: {
    months: 3,
    label: "3 Months",
    pricePerMonth: 9.5,
    totalPrice: 28.5,
    savingsPercent: 21,
    recommended: true,
  },
  BIANNUAL: {
    months: 6,
    label: "6 Months",
    pricePerMonth: 9.0,
    totalPrice: 54.0,
    savingsPercent: 25,
  },
  ANNUAL: {
    months: 12,
    label: "12 Months",
    pricePerMonth: 8.5,
    totalPrice: 102.0,
    savingsPercent: 29,
  },
} as const;

/**
 * Get crypto tier by duration in months
 *
 * @param months - Duration in months (1, 3, 6, or 12)
 * @returns Tier configuration or null if invalid
 */
export function getCryptoTierByMonths(
  months: number
): CryptoSubscriptionTier | null {
  const tiers = Object.values(CRYPTO_SUBSCRIPTION_TIERS);
  return tiers.find(tier => tier.months === months) || null;
}

/**
 * Get all crypto tiers sorted by duration
 *
 * @returns Array of all tiers sorted by months ascending
 */
export function getAllCryptoTiers(): CryptoSubscriptionTier[] {
  return Object.values(CRYPTO_SUBSCRIPTION_TIERS).sort(
    (a, b) => a.months - b.months
  );
}

/**
 * Get crypto price for a given duration
 *
 * @param months - Duration in months
 * @returns Total price in USD or 0 if invalid
 */
export function getCryptoPrice(months: number): number {
  const tier = getCryptoTierByMonths(months);
  return tier?.totalPrice || 0;
}

/**
 * Get savings amount compared to card price
 *
 * @param months - Duration in months
 * @returns Savings in USD or 0 if invalid
 */
export function getCryptoSavings(months: number): number {
  const tier = getCryptoTierByMonths(months);
  if (!tier) return 0;

  const cardTotal = CARD_PRICE_PER_MONTH * months;
  return cardTotal - tier.totalPrice;
}

/**
 * Get savings percentage for a given duration
 *
 * @param months - Duration in months
 * @returns Savings percentage or 0 if invalid
 */
export function getCryptoSavingsPercent(months: number): number {
  const tier = getCryptoTierByMonths(months);
  return tier?.savingsPercent || 0;
}

/**
 * Check if a duration is valid for crypto subscription
 *
 * @param months - Duration to validate
 * @returns true if valid (1, 3, 6, or 12)
 */
export function isValidCryptoDuration(months: number): boolean {
  return [1, 3, 6, 12].includes(months);
}
