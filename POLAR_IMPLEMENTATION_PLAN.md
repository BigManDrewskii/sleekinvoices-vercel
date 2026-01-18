# Polar Integration Implementation Plan

## Project Overview

This document outlines the complete implementation plan for integrating Polar as a complementary payment provider alongside Stripe in SleekInvoices. The integration will enable users to choose between Stripe and Polar for subscription billing and credit purchases.

---

## Phase 1: Foundation & Setup (Week 1-2)

### 1.1 Environment Setup

**Objective**: Prepare development environment and create Polar account

**Tasks**:
- [ ] Create Polar sandbox account at https://polar.sh/dashboard
- [ ] Generate Organization Access Token (OAT)
- [ ] Add `POLAR_ACCESS_TOKEN` to `.env.local` and production secrets
- [ ] Add `POLAR_WEBHOOK_SECRET` for webhook validation
- [ ] Test Polar API connectivity with curl/SDK

**Deliverables**:
- Polar sandbox account configured
- Environment variables set up
- API connectivity verified

**Time Estimate**: 2-3 hours

---

### 1.2 Create Payment Provider Abstraction Layer

**Objective**: Build unified interface for payment providers

**Tasks**:
- [ ] Create `server/lib/payment/types.ts` with interfaces:
  - `PaymentProvider` (abstract interface)
  - `CheckoutSessionParams`, `CheckoutSession`
  - `Subscription`, `SubscriptionParams`
  - `PaymentEvent`, `RefundResult`
  - `PaymentProviderType` enum

- [ ] Create `server/lib/payment/base-provider.ts`:
  - Abstract class implementing `PaymentProvider`
  - Common helper methods
  - Logging and event tracking

- [ ] Create `server/lib/payment/provider-factory.ts`:
  - Factory pattern for provider instantiation
  - Singleton pattern for provider instances
  - Error handling for unknown providers

**Code Structure**:
```
server/lib/payment/
├── types.ts           (interfaces and types)
├── base-provider.ts   (abstract base class)
├── provider-factory.ts (factory pattern)
├── stripe-provider.ts (Stripe implementation)
├── polar-provider.ts  (Polar implementation)
└── webhook-handler.ts (unified webhook handling)
```

**Deliverables**:
- Payment provider abstraction layer
- Type definitions
- Factory pattern implementation

**Time Estimate**: 4-6 hours

**Testing**:
```bash
# Verify types compile
pnpm tsc --noEmit

# Unit tests for factory pattern
pnpm test server/lib/payment/provider-factory.test.ts
```

---

### 1.3 Refactor Existing Stripe Implementation

**Objective**: Extract Stripe logic into StripeProvider class

**Tasks**:
- [ ] Create `server/lib/payment/stripe-provider.ts`:
  - Implement all `PaymentProvider` methods
  - Move existing Stripe checkout logic
  - Move subscription management logic
  - Move refund logic
  - Move webhook handling

- [ ] Extract Stripe webhook validation
- [ ] Extract Stripe customer creation/management
- [ ] Implement `mapStripeSubscription()` helper

**Current Stripe Integration Points** (to refactor):
- `server/routers/payment.ts` - checkout routes
- `server/routers/subscription.ts` - subscription routes
- `server/routers/webhook.ts` - Stripe webhook handler
- `server/lib/stripe.ts` - Stripe client initialization

**Deliverables**:
- StripeProvider implementation
- All existing Stripe logic refactored
- Tests updated

**Time Estimate**: 6-8 hours

**Testing**:
```bash
# Verify existing tests still pass
pnpm test server/routers/payment.test.ts
pnpm test server/routers/subscription.test.ts
```

---

### 1.4 Database Schema Updates

**Objective**: Add Polar-specific fields to database

**Tasks**:
- [ ] Create migration file:
  ```sql
  ALTER TABLE subscriptions ADD COLUMN (
    payment_provider ENUM('stripe', 'polar') DEFAULT 'stripe',
    polar_subscription_id VARCHAR(255) UNIQUE,
    polar_customer_id VARCHAR(255),
    polar_product_id VARCHAR(255),
    polar_price_id VARCHAR(255)
  );
  ```

- [ ] Create `payment_customers` table:
  ```sql
  CREATE TABLE payment_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    polar_customer_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

- [ ] Create `payment_webhook_events` table for audit trail

- [ ] Update Drizzle schema in `server/db/schema.ts`

- [ ] Run migration: `pnpm db:push`

**Deliverables**:
- Database migration files
- Updated Drizzle schema
- Migration executed successfully

**Time Estimate**: 2-3 hours

**Verification**:
```bash
# Verify schema changes
pnpm db:push
pnpm db:studio  # Visual verification
```

---

## Phase 2: Polar Provider Implementation (Week 2-3)

### 2.1 Install Polar SDK

**Objective**: Add Polar SDK to project

**Tasks**:
- [ ] Install Polar SDK: `pnpm add @polar-sh/sdk`
- [ ] Update `package.json` with version pinning
- [ ] Verify TypeScript types are available
- [ ] Test SDK import and initialization

**Deliverables**:
- Polar SDK installed
- TypeScript types available
- SDK initialization working

**Time Estimate**: 1 hour

---

### 2.2 Implement PolarProvider Class

**Objective**: Create Polar implementation of PaymentProvider interface

**Tasks**:
- [ ] Create `server/lib/payment/polar-provider.ts`

- [ ] Implement methods:
  - [ ] `createCheckoutSession()` - Create Polar checkout
  - [ ] `getCheckoutSession()` - Retrieve checkout details
  - [ ] `createSubscription()` - Create subscription
  - [ ] `getSubscription()` - Retrieve subscription
  - [ ] `updateSubscription()` - Update subscription
  - [ ] `cancelSubscription()` - Cancel subscription
  - [ ] `pauseSubscription()` - Pause subscription
  - [ ] `resumeSubscription()` - Resume subscription
  - [ ] `issueRefund()` - Issue refund
  - [ ] `validateWebhookSignature()` - Validate webhook
  - [ ] `parseWebhookEvent()` - Parse webhook payload
  - [ ] `getOrCreateCustomer()` - Manage customers

- [ ] Implement helper methods:
  - [ ] `mapPolarSubscription()` - Map Polar response to interface
  - [ ] `mapPolarCheckoutSession()` - Map checkout response
  - [ ] Error handling and logging

**API Reference**:
- Checkout: POST `/v1/checkouts/`
- Subscriptions: GET/POST/PATCH `/v1/subscriptions/`
- Customers: GET/POST `/v1/customers/`
- Refunds: POST `/v1/refunds/`

**Deliverables**:
- PolarProvider class
- All interface methods implemented
- Error handling in place

**Time Estimate**: 8-10 hours

**Testing**:
```bash
# Unit tests for PolarProvider
pnpm test server/lib/payment/polar-provider.test.ts
```

---

### 2.3 Implement Unified Webhook Handler

**Objective**: Handle webhooks from both providers

**Tasks**:
- [ ] Create `server/lib/payment/webhook-handler.ts`

- [ ] Implement webhook routing:
  - [ ] Route to correct provider based on signature
  - [ ] Validate webhook signature
  - [ ] Parse webhook event
  - [ ] Save event to database

- [ ] Implement event handlers:
  - [ ] `handleCheckoutCompleted()` - Sync order to database
  - [ ] `handleSubscriptionCreated()` - Create subscription record
  - [ ] `handleSubscriptionUpdated()` - Update subscription status
  - [ ] `handleSubscriptionCanceled()` - Mark subscription canceled
  - [ ] `handleInvoicePaid()` - Update payment status
  - [ ] `handleInvoicePaymentFailed()` - Handle payment failure

- [ ] Implement idempotency:
  - [ ] Check if event already processed
  - [ ] Prevent duplicate processing
  - [ ] Log all events for audit trail

**Deliverables**:
- Unified webhook handler
- Event routing logic
- Idempotency checks
- Audit trail

**Time Estimate**: 4-6 hours

**Testing**:
```bash
# Unit tests for webhook handler
pnpm test server/lib/payment/webhook-handler.test.ts
```

---

## Phase 3: API Routes & Checkout Integration (Week 3-4)

### 3.1 Create Unified Payment Router

**Objective**: Build tRPC routes for payment operations

**Tasks**:
- [ ] Update `server/routers/payment.ts`:

  - [ ] `createCheckoutSession` procedure:
    ```typescript
    input: { provider: 'stripe' | 'polar', productId, priceId, ... }
    output: { id, url, provider, expiresAt }
    ```

  - [ ] `getCheckoutSession` procedure
  
  - [ ] `getSubscriptions` procedure:
    - Fetch all subscriptions for user
    - Support filtering by provider
    - Include both Stripe and Polar subscriptions

  - [ ] `updateSubscription` procedure:
    - Support pause, resume, cancel
    - Route to correct provider

  - [ ] `cancelSubscription` procedure
  
  - [ ] `pauseSubscription` procedure
  
  - [ ] `resumeSubscription` procedure

- [ ] Add error handling and validation
- [ ] Add logging for debugging

**Deliverables**:
- Updated payment router
- All procedures implemented
- Input validation
- Error handling

**Time Estimate**: 4-5 hours

**Testing**:
```bash
# Integration tests for payment router
pnpm test server/routers/payment.test.ts
```

---

### 3.2 Create Webhook Routes

**Objective**: Handle webhooks from both providers

**Tasks**:
- [ ] Create webhook routes:
  - [ ] `POST /api/stripe/webhook` - Stripe webhook
  - [ ] `POST /api/polar/webhook` - Polar webhook

- [ ] Implement webhook handlers:
  - [ ] Validate signature
  - [ ] Parse event
  - [ ] Route to handler
  - [ ] Return 200 OK

- [ ] Add error handling:
  - [ ] Log errors
  - [ ] Retry logic (if needed)
  - [ ] Dead letter queue (for failed events)

**Deliverables**:
- Webhook routes
- Signature validation
- Event processing
- Error handling

**Time Estimate**: 3-4 hours

**Testing**:
```bash
# Test webhook signature validation
pnpm test server/routers/webhook.test.ts
```

---

### 3.3 Update Frontend Checkout UI

**Objective**: Add provider selection to checkout

**Tasks**:
- [ ] Create `client/src/components/payment/ProviderSelector.tsx`:
  - Radio buttons for Stripe/Polar
  - Provider descriptions
  - Feature comparison

- [ ] Update `client/src/pages/Billing.tsx`:
  - Add provider selection
  - Pass provider to checkout mutation
  - Handle both checkout URLs

- [ ] Update `client/src/pages/Subscription.tsx`:
  - Display provider for each subscription
  - Show provider-specific actions
  - Handle provider-specific cancellation

- [ ] Add provider badges to subscription cards:
  - Show which provider each subscription uses
  - Different styling for each provider

**Deliverables**:
- Provider selector component
- Updated billing page
- Updated subscription page
- Provider badges

**Time Estimate**: 4-5 hours

**Testing**:
```bash
# Component tests
pnpm test client/src/components/payment/ProviderSelector.test.tsx
```

---

## Phase 4: Testing & Validation (Week 4)

### 4.1 Unit Tests

**Objective**: Comprehensive unit test coverage

**Test Files**:
- [ ] `server/lib/payment/types.test.ts` - Type validation
- [ ] `server/lib/payment/base-provider.test.ts` - Base class
- [ ] `server/lib/payment/provider-factory.test.ts` - Factory pattern
- [ ] `server/lib/payment/stripe-provider.test.ts` - Stripe implementation
- [ ] `server/lib/payment/polar-provider.test.ts` - Polar implementation
- [ ] `server/lib/payment/webhook-handler.test.ts` - Webhook handling

**Coverage Target**: >85% for payment module

**Deliverables**:
- Unit tests for all payment providers
- >85% code coverage
- All tests passing

**Time Estimate**: 6-8 hours

---

### 4.2 Integration Tests

**Objective**: Test end-to-end payment flows

**Test Scenarios**:
- [ ] Create checkout session (Stripe)
- [ ] Create checkout session (Polar)
- [ ] Complete checkout flow (Stripe)
- [ ] Complete checkout flow (Polar)
- [ ] Create subscription (Stripe)
- [ ] Create subscription (Polar)
- [ ] Cancel subscription (Stripe)
- [ ] Cancel subscription (Polar)
- [ ] Process webhook (Stripe)
- [ ] Process webhook (Polar)
- [ ] Handle webhook idempotency
- [ ] Handle webhook errors

**Deliverables**:
- Integration tests
- All scenarios passing
- Error scenarios covered

**Time Estimate**: 8-10 hours

---

### 4.3 Sandbox Testing

**Objective**: Test with Polar sandbox environment

**Tasks**:
- [ ] Set up Polar sandbox account
- [ ] Create test products and prices
- [ ] Test checkout flow in sandbox
- [ ] Test webhook delivery
- [ ] Test subscription lifecycle
- [ ] Test refund flow
- [ ] Verify tax calculation (if applicable)

**Deliverables**:
- Sandbox testing completed
- All flows verified
- Issues documented

**Time Estimate**: 4-6 hours

---

### 4.4 Production Readiness

**Objective**: Prepare for production deployment

**Tasks**:
- [ ] Create Polar production account
- [ ] Generate production OAT token
- [ ] Configure production webhook URL
- [ ] Set up monitoring and alerting
- [ ] Create runbook for common issues
- [ ] Document troubleshooting steps

**Deliverables**:
- Production account configured
- Monitoring set up
- Runbook created
- Team trained

**Time Estimate**: 3-4 hours

---

## Phase 5: Deployment & Monitoring (Week 5)

### 5.1 Feature Flag Implementation

**Objective**: Safely roll out Polar integration

**Tasks**:
- [ ] Create feature flag: `ENABLE_POLAR_PROVIDER`
- [ ] Add flag to environment variables
- [ ] Update provider factory to respect flag
- [ ] Add flag to admin dashboard
- [ ] Create gradual rollout plan

**Rollout Strategy**:
1. **Day 1**: Enable for 10% of new users
2. **Day 2-3**: Enable for 25% of new users
3. **Day 4-5**: Enable for 50% of new users
4. **Day 6-7**: Enable for 100% of users

**Deliverables**:
- Feature flag implementation
- Rollout plan
- Monitoring dashboard

**Time Estimate**: 2-3 hours

---

### 5.2 Monitoring & Alerting

**Objective**: Monitor Polar integration health

**Metrics to Track**:
- [ ] Checkout session creation rate (by provider)
- [ ] Checkout completion rate (by provider)
- [ ] Subscription creation rate (by provider)
- [ ] Webhook processing latency
- [ ] Webhook error rate
- [ ] Refund success rate
- [ ] Customer satisfaction (by provider)

**Alerts**:
- [ ] Webhook processing errors > 1%
- [ ] Checkout completion rate < 50%
- [ ] Subscription creation failures > 5%
- [ ] API response time > 5s

**Deliverables**:
- Monitoring dashboard
- Alert rules configured
- Runbook for alerts

**Time Estimate**: 3-4 hours

---

### 5.3 Documentation

**Objective**: Document Polar integration

**Documents**:
- [ ] API documentation (for internal use)
- [ ] Webhook event reference
- [ ] Troubleshooting guide
- [ ] Migration guide (for users switching providers)
- [ ] FAQ for support team

**Deliverables**:
- Complete documentation
- Support team trained
- FAQ published

**Time Estimate**: 2-3 hours

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Polar API changes | Medium | High | Monitor changelog, maintain abstraction layer |
| Webhook delivery failures | Low | High | Implement retry logic, dead letter queue |
| Tax compliance issues | Low | High | Test with international customers, consult legal |
| Provider outage | Low | High | Implement fallback provider, status page |
| Data sync issues | Medium | High | Implement reconciliation job, audit trail |

### Mitigation Strategies

1. **Abstraction Layer**: Keeps provider-specific logic isolated
2. **Comprehensive Testing**: Catches issues early
3. **Monitoring & Alerting**: Detects problems in production
4. **Feature Flags**: Enables safe rollout and rollback
5. **Audit Trail**: Enables debugging and compliance
6. **Documentation**: Helps team respond to issues

---

## Success Criteria

✅ **Phase 1**: Payment abstraction layer complete, all tests passing
✅ **Phase 2**: Polar provider implemented, sandbox testing complete
✅ **Phase 3**: Checkout UI updated, both providers working
✅ **Phase 4**: 85%+ test coverage, all integration tests passing
✅ **Phase 5**: Deployed to production, monitoring active, zero critical issues

---

## Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Foundation | 2 weeks | Week 1 | Week 2 |
| Phase 2: Polar Provider | 1 week | Week 2 | Week 3 |
| Phase 3: API & Checkout | 1 week | Week 3 | Week 4 |
| Phase 4: Testing | 1 week | Week 4 | Week 5 |
| Phase 5: Deployment | 1 week | Week 5 | Week 6 |
| **Total** | **6 weeks** | | |

---

## Resource Requirements

### Team
- 1 Full-stack engineer (primary)
- 1 QA engineer (testing & validation)
- 1 DevOps engineer (deployment & monitoring)

### Tools
- Polar sandbox account
- Polar production account
- Monitoring tools (DataDog, New Relic, etc.)
- Feature flag service (LaunchDarkly, etc.)

### Budget
- Polar transaction fees (variable)
- Monitoring/alerting tools
- Testing infrastructure

---

## Next Steps (When Ready to Implement)

1. **Week 1**: Create payment abstraction layer
2. **Week 2**: Refactor Stripe, update database
3. **Week 3**: Implement Polar provider
4. **Week 4**: Update checkout UI
5. **Week 5**: Comprehensive testing
6. **Week 6**: Deploy to production

---

## Appendix: API Reference

### Polar Checkout API
```
POST /v1/checkouts/
{
  "product_id": "prod_123",
  "price_id": "price_123",
  "customer_email": "user@example.com",
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel"
}
```

### Polar Subscription API
```
POST /v1/subscriptions/
{
  "customer_id": "cus_123",
  "product_id": "prod_123",
  "price_id": "price_123"
}
```

### Polar Webhook Events
- `checkout.created`
- `checkout.updated`
- `order.created`
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`
- `invoice.created`
- `invoice.paid`
- `invoice.payment_failed`

---

## Questions & Clarifications

Before starting implementation, confirm:
1. ✅ Dual provider approach approved?
2. ✅ Polar account setup ready?
3. ✅ Timeline acceptable?
4. ✅ Resource allocation confirmed?
5. ✅ Success criteria agreed?

---

**Document Version**: 1.0
**Last Updated**: January 18, 2026
**Status**: Ready for Implementation
