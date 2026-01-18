# Polar Payment Integration Exploration

## Executive Summary

**Polar** is a modern payment platform positioned as a Merchant of Record (MoR) alternative to Stripe, specifically designed for SaaS, digital products, and software licensing. It offers lower fees (4% + $0.40 vs Stripe's variable rates), global tax compliance, and automated benefit delivery (license keys, file downloads, GitHub access, Discord roles).

**Recommendation**: Polar is viable as a complementary payment option to Stripe, particularly for:
- Subscription billing with simpler pricing models
- Digital product sales with automated delivery
- International customers (tax compliance handled automatically)
- Lower-volume transactions (no monthly minimums)

---

## Key Differences: Polar vs Stripe

| Feature | Polar | Stripe |
|---------|-------|--------|
| **Model** | Merchant of Record (MoR) | Payment Processor |
| **Tax Compliance** | Handles globally (VAT, GST, sales tax) | You handle compliance |
| **Pricing** | 4% + $0.40 per transaction | 2.9% + $0.30 (varies by type) |
| **Monthly Fees** | $0 | $0 (no monthly minimum) |
| **Subscriptions** | ✅ Full support | ✅ Full support |
| **Usage-Based Billing** | ✅ Metered pricing | ✅ Full support |
| **Automated Benefits** | ✅ License keys, file downloads, GitHub, Discord | ❌ Manual implementation |
| **License Key Generation** | ✅ Built-in | ❌ Manual implementation |
| **File Delivery** | ✅ Up to 10GB files | ❌ Manual implementation |
| **API Maturity** | Newer, actively developed | Mature, battle-tested |
| **Webhook Support** | ✅ Full event system | ✅ Full event system |
| **SDK Support** | ✅ TypeScript, Python, Go, PHP | ✅ Extensive |
| **Customer Portal** | ✅ Built-in | ✅ Requires custom build |
| **Refunds** | ✅ Full refunds (fees deducted) | ✅ Full refunds |

---

## Polar Core Features

### 1. **Flexible Product Management**
- **One-time purchases**: Digital products, courses, templates, software licenses
- **Subscriptions**: Recurring billing with automatic renewals
- **Flexible pricing**: Fixed price, pay-what-you-want, free with optional minimums
- **Usage-based billing**: Metered pricing for consumption-based models

### 2. **Checkout Options**
- **Checkout Links**: No-code solution, create and share instantly
- **Embedded Checkout**: Customizable checkout on your website
- **Checkout API**: Programmatic control for custom flows
- **Custom Fields**: Collect additional customer data during checkout

### 3. **Automated Benefits (Entitlements)**
- **License Keys**: Generate and deliver software licenses with custom formats
- **File Downloads**: Secure delivery of digital assets (up to 10GB)
- **GitHub Access**: Auto-invite customers to private repositories
- **Discord Access**: Automatic role assignment and server invites
- **Seats**: Manage per-seat licensing for team subscriptions

### 4. **Global Merchant of Record**
- **International Tax Compliance**: Handles VAT, GST, sales tax globally
- **EU VAT**: Proper B2B reverse charge and B2C tax collection
- **Automatic Tax Calculation**: Real-time tax rates for every transaction
- **Compliance Reporting**: Automatic filing and documentation

### 5. **Customer Management**
- **Customer Portal**: Built-in portal for customers to manage subscriptions
- **Subscription Management**: Pause, resume, cancel, upgrade/downgrade
- **Order History**: Track all purchases and transactions
- **Benefit Access**: View and manage entitlements

### 6. **Analytics & Reporting**
- **Revenue Metrics**: Track MRR, ARR, churn, LTV
- **Customer Insights**: Cohort analysis, retention rates
- **Product Performance**: Sales, conversion rates by product
- **Financial Reports**: Detailed transaction and payout reports

---

## API Architecture

### Base URLs
- **Production**: `https://api.polar.sh/v1`
- **Sandbox**: `https://sandbox-api.polar.sh/v1`

### Authentication
1. **Organization Access Tokens (OAT)**: For server-side operations (managing products, orders, subscriptions)
   - Format: `Authorization: Bearer polar_oat_xxxxxxxxxxxxxxxxx`
   - Never expose in client-side code
   
2. **Customer Access Tokens**: For customer-facing operations (viewing orders, subscriptions, benefits)
   - Generated via `/v1/customer-sessions/` endpoint
   - Safe for browser exposure

### Core API Endpoints
- **Checkout**: Create checkout sessions, manage checkout links
- **Customers**: Manage customer data
- **Subscriptions**: Create, update, cancel subscriptions
- **Orders**: Track one-time purchases
- **Products**: Manage products and pricing
- **Discounts**: Create and apply discount codes
- **Refunds**: Issue refunds
- **Benefits**: Manage license keys, file downloads, GitHub/Discord access
- **License Keys**: Generate and validate license keys
- **Webhooks**: Subscribe to events (order.created, subscription.updated, etc.)

### Rate Limits
- **300 requests per minute** per organization/customer
- **3 requests per second** for unauthenticated license key endpoints
- Retry-After header provided on 429 responses

### SDKs Available
- **TypeScript/JavaScript**: Full-featured SDK
- **Python**: Django, Flask, FastAPI support
- **Go**: Native Go SDK
- **PHP**: WordPress, Laravel integration

---

## Integration Approach for SleekInvoices

### Option 1: Dual Payment Provider (Recommended)
Implement both Stripe and Polar with a provider abstraction layer:

```
┌─────────────────────────────────────────┐
│      Payment Provider Abstraction       │
│  (Unified interface for both providers) │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼────┐      ┌───▼────┐
   │ Stripe │      │ Polar  │
   └────────┘      └────────┘
```

**Benefits:**
- Users choose their preferred payment method at checkout
- Stripe for complex billing scenarios (usage-based, custom pricing)
- Polar for simpler subscriptions and digital product sales
- Reduced dependency on single provider
- Leverage Polar's tax compliance for international customers

### Option 2: Polar for Subscriptions, Stripe for Invoices
- Use Polar exclusively for subscription billing and credits
- Keep Stripe for invoice payments and one-time charges
- Simpler implementation, clear separation of concerns

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. **Create Payment Provider Interface**
   ```typescript
   interface PaymentProvider {
     createCheckoutSession(params): Promise<CheckoutSession>
     getSubscription(id): Promise<Subscription>
     cancelSubscription(id): Promise<void>
     issueRefund(orderId, amount): Promise<Refund>
     validateWebhook(signature, payload): boolean
   }
   ```

2. **Implement Polar SDK Integration**
   - Install `@polar-sh/sdk` package
   - Create PolarProvider class implementing interface
   - Set up authentication (OAT tokens)

3. **Database Schema Updates**
   - Add `payment_provider` field to subscriptions table
   - Add `polar_subscription_id` field
   - Add `polar_customer_id` field
   - Create migration

### Phase 2: Checkout Integration (Week 2-3)
1. **Create Polar Checkout Session**
   - Implement `/api/polar/checkout` endpoint
   - Handle product/subscription selection
   - Support custom metadata (user ID, plan type)

2. **Update Frontend Checkout**
   - Add provider selection UI
   - Route to appropriate checkout (Stripe or Polar)
   - Handle redirects and return URLs

3. **Webhook Handling**
   - Create `/api/polar/webhook` endpoint
   - Handle events: `order.created`, `subscription.created`, `subscription.updated`
   - Sync to database

### Phase 3: Subscription Management (Week 3-4)
1. **Subscription Portal**
   - Display Polar subscriptions alongside Stripe
   - Support pause/resume/cancel for both providers
   - Show billing history

2. **Automated Entitlements**
   - Use Polar's built-in benefits for license key delivery
   - Or sync to SleekInvoices' existing entitlement system

3. **Billing Dashboard**
   - Display revenue from both providers
   - MRR/ARR calculations
   - Churn analysis

### Phase 4: Testing & Optimization (Week 4-5)
1. **Sandbox Testing**
   - Test all checkout flows
   - Verify webhook handling
   - Test subscription lifecycle (create, update, cancel)

2. **Production Deployment**
   - Set up Polar production account
   - Configure webhooks
   - Monitor transactions

---

## Database Schema Changes

```sql
-- Add Polar fields to subscriptions table
ALTER TABLE subscriptions ADD COLUMN (
  payment_provider ENUM('stripe', 'polar') DEFAULT 'stripe',
  polar_subscription_id VARCHAR(255) UNIQUE,
  polar_customer_id VARCHAR(255),
  polar_product_id VARCHAR(255),
  polar_price_id VARCHAR(255)
);

-- Create Polar webhook events log
CREATE TABLE polar_webhook_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id VARCHAR(255) UNIQUE,
  event_type VARCHAR(100),
  payload JSON,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Polar customers mapping
CREATE TABLE polar_customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,
  polar_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Cost Analysis

### Polar Pricing
- **Transaction Fee**: 4% + $0.40
- **Monthly Fee**: $0
- **Payout Fee**: Depends on payment method (typically 1-2%)
- **Example**: $100 subscription
  - Polar: $4.40 + payout fee
  - Stripe: $2.90 + payout fee
  - **Difference**: +$1.50 per transaction

### When Polar Makes Sense
- International customers (tax compliance included)
- Digital product sales with automated delivery
- Subscription plans under $50/month (lower relative cost)
- Customers preferring Polar's interface

### When Stripe Makes Sense
- Usage-based billing with complex calculations
- High-volume transactions (fees add up)
- Invoicing and payment plans
- Customers with existing Stripe integrations

---

## Risk Assessment

### Advantages
✅ Lower fees for simple subscriptions
✅ Global tax compliance (huge for international)
✅ Automated benefit delivery (license keys, downloads)
✅ Built-in customer portal
✅ Simpler API for basic use cases
✅ Modern, actively developed platform

### Risks
⚠️ Newer platform (less battle-tested than Stripe)
⚠️ Smaller ecosystem and community
⚠️ Limited advanced features (usage-based billing newer)
⚠️ Potential API changes (not yet v1.0 stable)
⚠️ Support response times (smaller team)

### Mitigation
- Start with Polar for new subscriptions, keep Stripe as fallback
- Implement comprehensive webhook testing
- Monitor Polar's changelog for breaking changes
- Maintain abstraction layer for easy provider switching

---

## Recommended Next Steps

1. **Create Payment Provider Abstraction Layer**
   - Design unified interface for both Stripe and Polar
   - Implement in TypeScript with strong typing

2. **Set Up Polar Sandbox Account**
   - Create test organization
   - Generate OAT tokens
   - Test API endpoints

3. **Implement Polar Provider Class**
   - Checkout session creation
   - Subscription management
   - Webhook handling

4. **Update Database Schema**
   - Add Polar fields to subscriptions
   - Create webhook event log
   - Create customer mapping table

5. **Build Checkout UI**
   - Add provider selection
   - Route to appropriate checkout
   - Handle redirects

6. **Deploy & Monitor**
   - Start with small percentage of traffic
   - Monitor webhook processing
   - Gather user feedback

---

## Conclusion

Polar is a **viable and complementary payment option** to Stripe, particularly for:
- Subscription billing with simpler pricing models
- International customers (tax compliance is a major advantage)
- Digital product sales with automated delivery
- Users who prefer Polar's interface and features

**Recommended approach**: Implement Polar alongside Stripe using a provider abstraction layer, allowing users to choose their preferred payment method. Start with subscriptions and expand to other products based on user demand.

**Estimated effort**: 3-4 weeks for full integration with testing and optimization.
