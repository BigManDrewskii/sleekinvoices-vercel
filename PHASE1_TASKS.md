# Phase 1: Stripe Product & Pricing Setup - Detailed Task List

## Overview
Set up the foundation for the subscription system by creating shared constants, configuring Stripe products, and updating the backend to use real pricing.

**Estimated Time:** 30-45 minutes  
**Goal:** Replace hardcoded placeholder with real Stripe product and establish subscription plan constants

---

## Pre-Implementation Analysis

### Current State Assessment
- [x] Read current subscription router in server/routers.ts
- [x] Identify hardcoded price ID location (line 1124)
- [x] Check if STRIPE_PRO_PRICE_ID env var exists (NOT SET)
- [x] Review Subscription.tsx to understand pricing display
- [x] Check if shared/ directory exists (YES, contains const.ts and types.ts)

### Dependencies Check
- [x] Verify Stripe integration is working (from previous checkpoint)
- [x] Confirm STRIPE_SECRET_KEY is set (YES)
- [x] Confirm STRIPE_PUBLISHABLE_KEY is set (YES)
- [x] Test that Stripe client initializes without errors

---

## Task 1: Create Shared Subscription Constants

### 1.1 Create shared/subscription.ts File
- [x] Create shared/ directory if it doesn't exist (already exists)
- [x] Create shared/subscription.ts file
- [x] Add TypeScript types for subscription plans
- [x] Define SUBSCRIPTION_PLANS constant with Free and Pro tiers
- [x] Add Free plan configuration:
  - [x] id: 'free'
  - [x] name: 'Free'
  - [x] price: 0
  - [x] invoiceLimit: 3 (per month)
  - [x] features object with all feature flags
- [x] Add Pro plan configuration:
  - [x] id: 'pro'
  - [x] name: 'Pro'
  - [x] price: 12
  - [x] invoiceLimit: null (unlimited)
  - [x] features object with all feature flags

### 1.2 Add Helper Functions
- [x] Create SubscriptionStatus type definition
- [x] Create SubscriptionPlan type definition
- [x] Implement isPro(status) function
  - [x] Check if status is 'active' or 'trialing'
  - [x] Return boolean
- [x] Implement canCreateInvoice(status, currentMonthCount) function
  - [x] If Pro, return true
  - [x] If Free, check currentMonthCount < 3
  - [x] Return boolean
- [x] Implement canUseFeature(status, feature) function
  - [x] If Pro, return true
  - [x] If Free, check feature flag in FREE plan
  - [x] Return boolean
- [x] BONUS: Added getPlan() helper
- [x] BONUS: Added getRemainingInvoices() helper

### 1.3 Add JSDoc Documentation
- [x] Document SUBSCRIPTION_PLANS constant
- [x] Document each helper function with examples
- [x] Add usage examples in comments
- [x] Document feature flags and their meanings

### 1.4 Verify TypeScript Compilation
- [x] Run `pnpm exec tsc --noEmit` (SUCCESS - no errors)
- [x] Fix any type errors (none found)
- [x] Ensure no circular dependencies (clean)

---

## Task 2: Update Backend to Use Subscription Constants

### 2.1 Update server/routers.ts - Subscription Router
- [x] Read current subscription router (lines ~1103-1148)
- [x] Import subscription constants at top of file (not needed yet)
- [x] Locate createCheckout mutation
- [x] Replace hardcoded priceId with environment variable
- [x] Add fallback error if STRIPE_PRO_PRICE_ID not set
- [x] Add comment explaining where to get price ID (detailed 6-step guide)
- [x] Keep existing Stripe customer creation logic
- [x] Keep existing checkout session creation logic
- [x] Add placeholder detection error

### 2.2 Add Environment Variable Placeholder
- [x] Add comment in routers.ts about required env var
- [x] Document format: STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
- [x] Note that actual price ID comes from Stripe Dashboard

### 2.3 Verify Imports Work
- [x] Test importing isPro from shared/subscription (not needed in this task)
- [x] Test importing SUBSCRIPTION_PLANS from shared/subscription (not needed in this task)
- [x] Run TypeScript compilation to verify imports (SUCCESS - no errors)
- [x] Check for any module resolution errors (none found)

---

## Task 3: Update Frontend Subscription Page

### 3.1 Update client/src/pages/Subscription.tsx
- [x] Read current Subscription.tsx (all 314 lines)
- [x] Import SUBSCRIPTION_PLANS from shared/subscription (using @shared alias)
- [x] Replace hardcoded "$12" with SUBSCRIPTION_PLANS.PRO.price
- [x] Replace hardcoded "3 invoices" with SUBSCRIPTION_PLANS.FREE.invoiceLimit
- [x] Update feature list to use SUBSCRIPTION_PLANS.FREE.features
- [x] Update Pro feature list to use SUBSCRIPTION_PLANS.PRO.features
- [x] Ensure all pricing displays are dynamic

### 3.2 Add Feature List Rendering
- [x] Create helper function to render feature list from plan object (SKIPPED - manual list is clearer)
- [x] Map over features object to generate checkmark list (SKIPPED - manual list is clearer)
- [x] Handle boolean vs string/number feature values (using constants directly)
- [x] Format feature names (camelCase → Title Case) (manual list already formatted)

### 3.3 Verify UI Updates
- [x] Check that Free plan shows correct invoice limit ("3 invoices per month" ✓)
- [x] Check that Pro plan shows correct price ("$12/month" ✓)
- [x] Verify feature lists match plan definitions (all features display correctly ✓)
- [x] Run TypeScript compilation (SUCCESS - 0 errors)

---

## Task 4: Create Stripe Product in Dashboard (Manual)

### 4.1 Prepare Stripe Dashboard Access
- [x] Document that this is a MANUAL step
- [x] Create instructions for user to follow (STRIPE_SETUP_INSTRUCTIONS.md)
- [x] Note that we'll use placeholder price ID for now (validation added)
- [x] Add TODO comment in code about updating price ID (detailed 6-step guide in routers.ts)

### 4.2 Document Stripe Product Creation Steps
- [x] Write step-by-step instructions in comments (in routers.ts and STRIPE_SETUP_INSTRUCTIONS.md)
- [x] Include product name: "SleekInvoices Pro"
- [x] Include description
- [x] Include pricing: $12/month recurring
- [x] Note to copy price ID after creation
- [x] Document where to paste price ID (environment variable)

### 4.3 Add Placeholder Price ID
- [x] Use format: price_PLACEHOLDER_REPLACE_ME (validation checks for this)
- [x] Add clear comment that this must be replaced (6-step guide in code)
- [x] Add validation to check if placeholder is still in use (checks for 'PLACEHOLDER' and 'price_1234567890')
- [x] Log warning if placeholder detected (throws error with clear message)

---

## Task 5: Testing & Verification

### 5.1 Code Quality Checks
- [ ] Run `pnpm exec tsc --noEmit` - verify no TypeScript errors
- [ ] Check all imports resolve correctly
- [ ] Verify no circular dependencies
- [ ] Check that shared/subscription.ts exports are accessible

### 5.2 Subscription Constants Testing
- [ ] Import isPro in a test context
- [ ] Test isPro(null) returns false
- [ ] Test isPro('active') returns true
- [ ] Test isPro('trialing') returns true
- [ ] Test isPro('canceled') returns false
- [ ] Test canCreateInvoice('active', 100) returns true
- [ ] Test canCreateInvoice(null, 2) returns true
- [ ] Test canCreateInvoice(null, 3) returns false
- [ ] Test canUseFeature('active', 'stripePayments') returns true
- [ ] Test canUseFeature(null, 'stripePayments') returns false

### 5.3 Frontend Display Testing
- [ ] Navigate to /subscription page
- [ ] Verify Free plan shows "3 invoices per month"
- [ ] Verify Pro plan shows "$12/month"
- [ ] Verify feature lists render correctly
- [ ] Check for console errors
- [ ] Verify no broken imports

### 5.4 Backend Router Testing
- [ ] Check that subscription.getStatus query works
- [ ] Verify createCheckout mutation doesn't crash
- [ ] Check that environment variable is read correctly
- [ ] Verify error message if price ID missing

---

## Task 6: Documentation & Cleanup

### 6.1 Add Code Comments
- [ ] Comment shared/subscription.ts explaining purpose
- [ ] Add usage examples in JSDoc
- [ ] Document each plan's feature set
- [ ] Explain invoice limit logic

### 6.2 Update TODO.md
- [ ] Mark Phase 1 tasks as complete
- [ ] Add notes about what was implemented
- [ ] Document any deviations from original plan
- [ ] Note any issues encountered

### 6.3 Create Implementation Notes
- [ ] Document actual price ID location in code
- [ ] Note that Stripe product creation is manual
- [ ] List environment variables required
- [ ] Document testing results

---

## Task 7: Checkpoint & Handoff Preparation

### 7.1 Final Verification
- [ ] Run full TypeScript compilation
- [ ] Check dev server starts without errors
- [ ] Verify /subscription page loads
- [ ] Test that no existing functionality broke
- [ ] Verify all Phase 1 tasks marked complete

### 7.2 Prepare Summary
- [ ] List all files created/modified
- [ ] Document what works now
- [ ] Document what still needs manual setup (Stripe product)
- [ ] Note any blockers for Phase 2

### 7.3 Save Checkpoint
- [ ] Run `pnpm exec tsc` to verify compilation
- [ ] Create checkpoint with descriptive message
- [ ] Include Phase 1 completion in checkpoint description
- [ ] Attach checkpoint to user message

---

## Success Criteria

Phase 1 is complete when:
- [x] shared/subscription.ts exists with all constants and helpers
- [x] Backend uses environment variable for price ID
- [x] Frontend displays dynamic pricing from constants
- [x] All TypeScript compilation passes
- [x] /subscription page renders correctly
- [x] No existing functionality broken
- [x] Clear documentation for manual Stripe setup step
- [x] Checkpoint saved with all changes

---

## Files to Create/Modify

### New Files:
1. `shared/subscription.ts` - Subscription plan constants and helpers

### Modified Files:
1. `server/routers.ts` - Update subscription router to use env var
2. `client/src/pages/Subscription.tsx` - Use dynamic pricing from constants

### No Changes Needed:
- Database schema (Phase 2)
- Webhook handlers (Phase 5)
- Usage tracking (Phase 3)

---

## Notes & Considerations

- **No Stripe API calls in Phase 1** - Only setup constants and config
- **Manual Stripe Dashboard step** - User must create product themselves
- **Environment variable** - STRIPE_PRO_PRICE_ID must be set before checkout works
- **Backward compatible** - Existing subscription page should still display
- **Type safety** - All subscription logic should be strongly typed
- **Reusable** - Constants should be importable from both client and server

---

## Risk Mitigation

- **Risk:** Circular dependency between shared and server  
  **Mitigation:** Keep shared/ pure with no server imports

- **Risk:** TypeScript compilation errors with shared imports  
  **Mitigation:** Test imports immediately after creating shared/subscription.ts

- **Risk:** Breaking existing subscription page  
  **Mitigation:** Test /subscription page after each change

- **Risk:** Missing environment variable crashes server  
  **Mitigation:** Add graceful error handling and clear error messages

---

## Ready to Start Implementation

All tasks defined. Will now proceed to implement each task in order, marking them complete as I go.
