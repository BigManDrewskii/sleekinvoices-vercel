import { describe, it, expect } from 'vitest';
import Stripe from 'stripe';

describe('Stripe Price ID Validation', () => {
  it('should validate that STRIPE_PRO_PRICE_ID is set and valid', async () => {
    // Check environment variable is set
    expect(process.env.STRIPE_PRO_PRICE_ID).toBeDefined();
    expect(process.env.STRIPE_PRO_PRICE_ID).toMatch(/^price_/);
    expect(process.env.STRIPE_PRO_PRICE_ID).not.toBe('price_1234567890');
    
    // Validate it's a real price in Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });
    
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRO_PRICE_ID!);
    
    // Verify price details
    expect(price.id).toBe(process.env.STRIPE_PRO_PRICE_ID);
    expect(price.active).toBe(true);
    expect(price.type).toBe('recurring');
    expect(price.recurring?.interval).toBe('month');
    expect(price.unit_amount).toBe(1200); // $12.00 in cents
    expect(price.currency).toBe('usd');
    
    console.log('✅ Stripe Price ID validated:', {
      id: price.id,
      amount: `$${(price.unit_amount! / 100).toFixed(2)}`,
      interval: price.recurring?.interval,
      product: price.product,
    });
  });
});
