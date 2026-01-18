/**
 * Subscription Date Utilities
 *
 * Helper functions for calculating subscription end dates, remaining time,
 * and handling subscription extensions for both Stripe and crypto payments.
 */

interface UserSubscriptionData {
  currentPeriodEnd: Date | null;
  subscriptionEndDate: Date | null;
}

/**
 * Get the effective end date for a user's subscription
 * Takes the later of Stripe's currentPeriodEnd or crypto's subscriptionEndDate
 *
 * @param user - User object with subscription dates
 * @returns The effective end date or null if no subscription
 */
export function getEffectiveEndDate(user: UserSubscriptionData): Date | null {
  const stripeEnd = user.currentPeriodEnd;
  const cryptoEnd = user.subscriptionEndDate;

  if (!stripeEnd && !cryptoEnd) return null;
  if (!stripeEnd) return cryptoEnd;
  if (!cryptoEnd) return stripeEnd;

  // Return the later date
  return stripeEnd > cryptoEnd ? stripeEnd : cryptoEnd;
}

/**
 * Get the number of days remaining in the subscription
 *
 * @param user - User object with subscription dates
 * @returns Number of days remaining (0 if expired or no subscription)
 */
export function getDaysRemaining(user: UserSubscriptionData): number {
  const endDate = getEffectiveEndDate(user);
  if (!endDate) return 0;

  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Format the remaining time as a human-readable string
 *
 * @param user - User object with subscription dates
 * @returns Formatted string like "15 days remaining" or "2 months, 5 days remaining"
 */
export function formatTimeRemaining(user: UserSubscriptionData): string {
  const days = getDaysRemaining(user);

  if (days === 0) return "Expired";
  if (days === 1) return "1 day remaining";
  if (days < 30) return `${days} days remaining`;

  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (remainingDays === 0) {
    return months === 1 ? "1 month remaining" : `${months} months remaining`;
  }

  const monthStr = months === 1 ? "1 month" : `${months} months`;
  const dayStr = remainingDays === 1 ? "1 day" : `${remainingDays} days`;

  return `${monthStr}, ${dayStr} remaining`;
}

/**
 * Check if the subscription is expiring soon (within 7 days)
 *
 * @param user - User object with subscription dates
 * @returns true if subscription expires within 7 days
 */
export function isExpiringSoon(user: UserSubscriptionData): boolean {
  const days = getDaysRemaining(user);
  return days > 0 && days <= 7;
}

/**
 * Check if the subscription has expired
 *
 * @param user - User object with subscription dates
 * @returns true if subscription has expired
 */
export function isExpired(user: UserSubscriptionData): boolean {
  const endDate = getEffectiveEndDate(user);
  if (!endDate) return true;

  return endDate < new Date();
}

/**
 * Calculate the new end date when extending an existing subscription
 * If subscription is active, adds months to current end date
 * If subscription is expired, starts from now
 *
 * @param user - User object with subscription dates
 * @param months - Number of months to add
 * @returns New end date
 */
export function calculateExtendedEndDate(
  user: UserSubscriptionData,
  months: number
): Date {
  const currentEnd = getEffectiveEndDate(user);
  const now = new Date();

  // If no current subscription or expired, start from now
  const startDate = currentEnd && currentEnd > now ? currentEnd : now;

  const newEnd = new Date(startDate);
  newEnd.setMonth(newEnd.getMonth() + months);

  return newEnd;
}

/**
 * Calculate end date for a new subscription starting now
 *
 * @param months - Number of months
 * @returns End date
 */
export function calculateNewEndDate(months: number): Date {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
}

/**
 * Format a date for display
 *
 * @param date - Date to format
 * @returns Formatted date string or "N/A" if null
 */
export function formatEndDate(date: Date | null): string {
  if (!date) return "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
