# Payment Provider Abstraction Layer Design

## Overview

This document outlines the architecture for supporting multiple payment providers (Stripe and Polar) through a unified abstraction layer. The design enables switching between providers and running both simultaneously without duplicating business logic.

---

## Core Interfaces

### 1. PaymentProvider Interface

```typescript
// server/lib/payment/types.ts

export type PaymentProviderType = 'stripe' | 'polar';

export interface CheckoutSessionParams {
  userId: number;
  email: string;
  productId: string;
  priceId: string;
  quantity?: number;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  provider: PaymentProviderType;
  expiresAt?: Date;
}

export interface Subscription {
  id: string;
  provider: PaymentProviderType;
  userId: number;
  productId: string;
  priceId: string;
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  metadata?: Record<string, any>;
}

export interface PaymentEvent {
  id: string;
  type: 'checkout.completed' | 'subscription.created' | 'subscription.updated' | 'subscription.canceled' | 'invoice.paid' | 'invoice.payment_failed';
  provider: PaymentProviderType;
  timestamp: Date;
  data: Record<string, any>;
}

export interface PaymentProvider {
  // Checkout
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession>;
  getCheckoutSession(sessionId: string): Promise<CheckoutSession | null>;

  // Subscriptions
  createSubscription(params: SubscriptionParams): Promise<Subscription>;
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  pauseSubscription(subscriptionId: string): Promise<void>;
  resumeSubscription(subscriptionId: string): Promise<void>;

  // Refunds
  issueRefund(orderId: string, amount?: number): Promise<RefundResult>;

  // Webhooks
  validateWebhookSignature(signature: string, payload: string): boolean;
  parseWebhookEvent(payload: string): PaymentEvent;

  // Customers
  getOrCreateCustomer(userId: number, email: string, name?: string): Promise<string>;
}

export interface SubscriptionParams {
  userId: number;
  email: string;
  productId: string;
  priceId: string;
  metadata?: Record<string, string>;
}

export interface RefundResult {
  refundId: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
}
```

---

## Implementation Structure

### File Organization

```
server/
├── lib/
│   └── payment/
│       ├── types.ts                    # Shared interfaces
│       ├── provider-factory.ts         # Factory for creating providers
│       ├── base-provider.ts            # Abstract base class
│       ├── stripe-provider.ts          # Stripe implementation
│       ├── polar-provider.ts           # Polar implementation
│       └── webhook-handler.ts          # Unified webhook handler
├── routers/
│   └── payment.ts                      # Payment API routes
└── db/
    └── schema.ts                       # Database schema with provider fields
```

---

## Provider Factory

```typescript
// server/lib/payment/provider-factory.ts

import { PaymentProvider, PaymentProviderType } from './types';
import { StripeProvider } from './stripe-provider';
import { PolarProvider } from './polar-provider';

export class PaymentProviderFactory {
  private static providers: Map<PaymentProviderType, PaymentProvider> = new Map();

  static getProvider(type: PaymentProviderType): PaymentProvider {
    if (!this.providers.has(type)) {
      if (type === 'stripe') {
        this.providers.set(type, new StripeProvider());
      } else if (type === 'polar') {
        this.providers.set(type, new PolarProvider());
      } else {
        throw new Error(`Unknown payment provider: ${type}`);
      }
    }
    return this.providers.get(type)!;
  }

  static getAllProviders(): PaymentProvider[] {
    return [
      this.getProvider('stripe'),
      this.getProvider('polar'),
    ];
  }
}
```

---

## Base Provider Class

```typescript
// server/lib/payment/base-provider.ts

import { PaymentProvider, PaymentProviderType, CheckoutSessionParams, Subscription, PaymentEvent } from './types';

export abstract class BasePaymentProvider implements PaymentProvider {
  abstract type: PaymentProviderType;

  abstract createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession>;
  abstract getCheckoutSession(sessionId: string): Promise<CheckoutSession | null>;
  abstract createSubscription(params: SubscriptionParams): Promise<Subscription>;
  abstract getSubscription(subscriptionId: string): Promise<Subscription | null>;
  abstract updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription>;
  abstract cancelSubscription(subscriptionId: string): Promise<void>;
  abstract pauseSubscription(subscriptionId: string): Promise<void>;
  abstract resumeSubscription(subscriptionId: string): Promise<void>;
  abstract issueRefund(orderId: string, amount?: number): Promise<RefundResult>;
  abstract validateWebhookSignature(signature: string, payload: string): boolean;
  abstract parseWebhookEvent(payload: string): PaymentEvent;
  abstract getOrCreateCustomer(userId: number, email: string, name?: string): Promise<string>;

  // Helper methods
  protected logEvent(event: PaymentEvent): void {
    console.log(`[${this.type.toUpperCase()}] Event: ${event.type}`, event);
  }

  protected async saveEvent(event: PaymentEvent): Promise<void> {
    // Save to database for audit trail
    // await db.paymentEvents.create(event);
  }
}
```

---

## Stripe Provider Implementation

```typescript
// server/lib/payment/stripe-provider.ts

import Stripe from 'stripe';
import { BasePaymentProvider } from './base-provider';
import { PaymentProviderType, CheckoutSessionParams, Subscription, PaymentEvent, CheckoutSession } from './types';

export class StripeProvider extends BasePaymentProvider {
  type: PaymentProviderType = 'stripe';
  private stripe: Stripe;

  constructor() {
    super();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      customer_email: params.email,
      line_items: [
        {
          price: params.priceId,
          quantity: params.quantity || 1,
        },
      ],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId.toString(),
        ...params.metadata,
      },
    });

    return {
      id: session.id,
      url: session.url!,
      provider: 'stripe',
      expiresAt: new Date(session.expires_at * 1000),
    };
  }

  async getCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      url: session.url!,
      provider: 'stripe',
      expiresAt: new Date(session.expires_at * 1000),
    };
  }

  async createSubscription(params: SubscriptionParams): Promise<Subscription> {
    const customerId = await this.getOrCreateCustomer(params.userId, params.email);
    
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: params.priceId }],
      metadata: {
        userId: params.userId.toString(),
        ...params.metadata,
      },
    });

    return this.mapStripeSubscription(subscription, params.userId);
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription) return null;

    const userId = parseInt(subscription.metadata?.userId || '0');
    return this.mapStripeSubscription(subscription, userId);
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      metadata: updates.metadata,
    });

    const userId = parseInt(subscription.metadata?.userId || '0');
    return this.mapStripeSubscription(subscription, userId);
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.del(subscriptionId);
  }

  async pauseSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      pause_collection: {
        behavior: 'void',
      },
    });
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.update(subscriptionId, {
      pause_collection: undefined,
    });
  }

  async issueRefund(orderId: string, amount?: number): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      charge: orderId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status as 'pending' | 'succeeded' | 'failed',
    };
  }

  validateWebhookSignature(signature: string, payload: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: string): PaymentEvent {
    const event = JSON.parse(payload);
    
    return {
      id: event.id,
      type: event.type as PaymentEvent['type'],
      provider: 'stripe',
      timestamp: new Date(event.created * 1000),
      data: event.data.object,
    };
  }

  async getOrCreateCustomer(userId: number, email: string, name?: string): Promise<string> {
    // Check if customer already exists in database
    // If not, create in Stripe and save mapping
    // Return Stripe customer ID
    
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { userId: userId.toString() },
    });

    return customer.id;
  }

  private mapStripeSubscription(stripeSubscription: Stripe.Subscription, userId: number): Subscription {
    return {
      id: stripeSubscription.id,
      provider: 'stripe',
      userId,
      productId: (stripeSubscription.items.data[0].price.product as string),
      priceId: stripeSubscription.items.data[0].price.id,
      status: stripeSubscription.status as Subscription['status'],
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : undefined,
      metadata: stripeSubscription.metadata,
    };
  }
}
```

---

## Polar Provider Implementation (Skeleton)

```typescript
// server/lib/payment/polar-provider.ts

import { Polar } from '@polar-sh/sdk';
import { BasePaymentProvider } from './base-provider';
import { PaymentProviderType, CheckoutSessionParams, Subscription, PaymentEvent, CheckoutSession } from './types';

export class PolarProvider extends BasePaymentProvider {
  type: PaymentProviderType = 'polar';
  private polar: Polar;

  constructor() {
    super();
    this.polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
    });
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession> {
    // Implementation similar to Stripe
    // Use Polar Checkout API
    throw new Error('Not implemented');
  }

  // ... other methods
}
```

---

## Database Schema Updates

```typescript
// server/db/schema.ts

import { sqliteTable, text, integer, timestamp, boolean, json } from 'drizzle-orm/sqlite-core';

export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey().autoIncrement(),
  userId: integer('user_id').notNull(),
  
  // Payment provider info
  paymentProvider: text('payment_provider', { enum: ['stripe', 'polar'] }).notNull().default('stripe'),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  polarSubscriptionId: text('polar_subscription_id').unique(),
  
  // Product/Price info
  productId: text('product_id').notNull(),
  priceId: text('price_id').notNull(),
  
  // Status
  status: text('status', { enum: ['active', 'paused', 'canceled', 'past_due'] }).notNull(),
  
  // Billing period
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  
  // Cancellation
  canceledAt: timestamp('canceled_at'),
  
  // Metadata
  metadata: json('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentCustomers = sqliteTable('payment_customers', {
  id: integer('id').primaryKey().autoIncrement(),
  userId: integer('user_id').notNull().unique(),
  
  stripeCustomerId: text('stripe_customer_id').unique(),
  polarCustomerId: text('polar_customer_id').unique(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const paymentWebhookEvents = sqliteTable('payment_webhook_events', {
  id: integer('id').primaryKey().autoIncrement(),
  
  provider: text('provider', { enum: ['stripe', 'polar'] }).notNull(),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  
  payload: json('payload').notNull(),
  processed: boolean('processed').notNull().default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

---

## API Routes

```typescript
// server/routers/payment.ts

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { PaymentProviderFactory } from '../lib/payment/provider-factory';
import { z } from 'zod';

export const paymentRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({
      provider: z.enum(['stripe', 'polar']),
      productId: z.string(),
      priceId: z.string(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const provider = PaymentProviderFactory.getProvider(input.provider);
      
      const session = await provider.createCheckoutSession({
        userId: ctx.user.id,
        email: ctx.user.email,
        productId: input.productId,
        priceId: input.priceId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });

      return session;
    }),

  getSubscriptions: protectedProcedure
    .query(async ({ ctx }) => {
      // Fetch subscriptions from database for current user
      // Return both Stripe and Polar subscriptions
    }),

  cancelSubscription: protectedProcedure
    .input(z.object({
      subscriptionId: z.string(),
      provider: z.enum(['stripe', 'polar']),
    }))
    .mutation(async ({ input }) => {
      const provider = PaymentProviderFactory.getProvider(input.provider);
      await provider.cancelSubscription(input.subscriptionId);
    }),
});
```

---

## Webhook Handler

```typescript
// server/lib/payment/webhook-handler.ts

import { PaymentProviderFactory } from './provider-factory';
import { PaymentProviderType } from './types';

export class WebhookHandler {
  async handleWebhook(provider: PaymentProviderType, signature: string, payload: string): Promise<void> {
    const paymentProvider = PaymentProviderFactory.getProvider(provider);

    // Validate signature
    if (!paymentProvider.validateWebhookSignature(signature, payload)) {
      throw new Error('Invalid webhook signature');
    }

    // Parse event
    const event = paymentProvider.parseWebhookEvent(payload);

    // Save event to database
    await this.saveEvent(event);

    // Handle event
    switch (event.type) {
      case 'checkout.completed':
        await this.handleCheckoutCompleted(event);
        break;
      case 'subscription.created':
        await this.handleSubscriptionCreated(event);
        break;
      case 'subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;
      case 'subscription.canceled':
        await this.handleSubscriptionCanceled(event);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;
    }
  }

  private async saveEvent(event: PaymentEvent): Promise<void> {
    // Save to database
  }

  private async handleCheckoutCompleted(event: PaymentEvent): Promise<void> {
    // Handle checkout completion
  }

  private async handleSubscriptionCreated(event: PaymentEvent): Promise<void> {
    // Handle subscription creation
  }

  // ... other handlers
}
```

---

## Usage Example

```typescript
// Creating a checkout session
const provider = PaymentProviderFactory.getProvider('polar');
const session = await provider.createCheckoutSession({
  userId: 123,
  email: 'user@example.com',
  productId: 'prod_123',
  priceId: 'price_123',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
});

// Getting a subscription
const subscription = await provider.getSubscription('sub_123');

// Canceling a subscription
await provider.cancelSubscription('sub_123');
```

---

## Benefits of This Design

✅ **Provider Agnostic**: Easy to add new providers (Paddle, LemonSqueezy, etc.)
✅ **Consistent Interface**: Same API regardless of provider
✅ **Testable**: Mock providers for unit testing
✅ **Maintainable**: Business logic separated from provider details
✅ **Flexible**: Support both providers simultaneously
✅ **Scalable**: Add new features without modifying existing code

---

## Next Steps

1. Implement StripeProvider (refactor existing code)
2. Implement PolarProvider (new implementation)
3. Update database schema with migrations
4. Create unified webhook handler
5. Update checkout UI to support provider selection
6. Write comprehensive tests for both providers
7. Deploy to production with feature flag
