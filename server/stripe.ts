import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(email: string, name?: string): Promise<string> {
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
  });
  
  return customer.id;
}

/**
 * Create a payment link for an invoice
 */
export async function createPaymentLink(params: {
  amount: number; // in dollars
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
}): Promise<{ paymentLinkId: string; url: string }> {
  const { amount, currency = 'usd', description, metadata } = params;
  
  const stripe = getStripe();
  
  // Create a price
  const price = await stripe.prices.create({
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency,
    product_data: {
      name: description,
    },
  });
  
  // Create payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: metadata || {},
    after_completion: {
      type: 'hosted_confirmation',
      hosted_confirmation: {
        custom_message: 'Thank you for your payment! Your invoice has been marked as paid.',
      },
    },
  });
  
  return {
    paymentLinkId: paymentLink.id,
    url: paymentLink.url,
  };
}

/**
 * Create a subscription checkout session
 */
export async function createSubscriptionCheckout(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  
  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Create a subscription price (one-time setup)
 */
export async function createSubscriptionPrice(params: {
  amount: number; // in dollars per month
  productName: string;
  productDescription?: string;
}): Promise<string> {
  const { amount, productName, productDescription } = params;
  const stripe = getStripe();
  
  // Create product
  const product = await stripe.products.create({
    name: productName,
    description: productDescription,
  });
  
  // Create price
  const price = await stripe.prices.create({
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    product: product.id,
  });
  
  return price.id;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Create a customer portal session for managing subscription
 */
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
  
  return session.url;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
