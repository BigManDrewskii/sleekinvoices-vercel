# Phase 2: Invoice Limit Enforcement

**Goal:** Enforce 3 invoices per month limit for FREE tier users with proper tracking and UI feedback.

**Estimated Time:** 2-3 hours  
**Dependencies:** Phase 1 (subscription constants) must be complete

---

## Pre-Implementation Analysis

### Current State
- [ ] Review existing invoice creation flow in server/routers.ts
- [ ] Check if usage tracking table exists in drizzle/schema.ts
- [ ] Identify all invoice creation entry points (UI, API, recurring)
- [ ] Review subscription helper functions from Phase 1

### Requirements
- [ ] Track invoice creation count per user per month
- [ ] Block invoice creation when free user reaches 3/month
- [ ] Show usage counter in UI (e.g., "2 of 3 invoices used")
- [ ] Display upgrade prompt when limit reached
- [ ] Reset counter at start of each month (automatic)
- [ ] Pro users bypass all limits

---

## Task 1: Database Schema for Usage Tracking

### 1.1 Add usageTracking Table to drizzle/schema.ts
- [x] Create `usageTracking` table definition
- [x] Fields:
  - [x] id (primary key, auto-increment)
  - [x] userId (foreign key to users table)
  - [x] month (format: YYYY-MM, e.g., "2026-01")
  - [x] invoicesCreated (integer, default 0)
  - [x] createdAt (timestamp)
  - [x] updatedAt (timestamp)
- [x] Add unique index on (userId, month)
- [x] Add foreign key constraint to users table

### 1.2 Push Schema Changes
- [x] Run `pnpm db:push` to apply changes (Migration: 0008_shocking_vulture.sql)
- [x] Verify table created in database (usageTracking with 6 columns, 1 index)
- [x] Check for any migration errors (SUCCESS)
- [x] Document schema changes in comments (JSDoc added)

---

## Task 2: Backend Usage Tracking Helpers

### 2.1 Add Usage Tracking Functions to server/db.ts
- [x] `getCurrentMonthUsage(userId: number)`
  - [x] Get current month in YYYY-MM format
  - [x] Query usageTracking table for user + month
  - [x] Return { invoicesCreated: number } or { invoicesCreated: 0 } if not exists
  - [x] Add JSDoc documentation

- [x] `incrementInvoiceCount(userId: number)`
  - [x] Get current month in YYYY-MM format
  - [x] Upsert usageTracking record (insert or update)
  - [x] Increment invoicesCreated by 1
  - [x] Update updatedAt timestamp
  - [x] Return new count

- [x] `canUserCreateInvoice(userId: number, subscriptionStatus: SubscriptionStatus)`
  - [x] Import isPro and canCreateInvoice from shared/subscription
  - [x] If isPro(subscriptionStatus), return true immediately
  - [x] Get current month usage
  - [ ] Return canCreateInvoice(subscriptionStatus, usage.invoicesCreated)
  - [ ] Add JSDoc with examples

### 2.2 Add Helper Exports
- [ ] Export all new functions from db.ts
- [ ] Verify TypeScript compilation
- [ ] Add unit test stubs (optional for now)

---

## Task 3: Enforce Limits in Invoice Creation

### 3.1 Update invoices.create Procedure in server/routers.ts
- [ ] Locate `invoices.create` mutation
- [ ] Import canUserCreateInvoice from server/db
- [ ] Add limit check BEFORE creating invoice:
  ```typescript
  const canCreate = await canUserCreateInvoice(ctx.user.id, ctx.user.subscriptionStatus);
  if (!canCreate) {
    throw new Error('Monthly invoice limit reached. Upgrade to Pro for unlimited invoices.');
  }
  ```
- [ ] After successful invoice creation, call incrementInvoiceCount
- [ ] Handle errors gracefully
- [ ] Add comment explaining the enforcement logic

### 3.2 Update invoices.createFromRecurring (if exists)
- [ ] Check if recurring invoice generation exists
- [ ] Add same limit check before creating invoice
- [ ] Increment counter after creation
- [ ] Log when recurring invoice skipped due to limit

### 3.3 Verify TypeScript Compilation
- [ ] Run `pnpm exec tsc --noEmit`
- [ ] Fix any type errors
- [ ] Ensure no breaking changes

---

## Task 4: Add Usage Display to Frontend

### 4.1 Create Usage Display Component
- [ ] Create `client/src/components/subscription/UsageIndicator.tsx`
- [ ] Props: `{ invoicesUsed: number, invoicesLimit: number | null, isPro: boolean }`
- [ ] Display format: "2 of 3 invoices used this month" (free tier)
- [ ] Display format: "Unlimited invoices" (pro tier)
- [ ] Add progress bar visual (optional)
- [ ] Style with Tailwind classes

### 4.2 Add tRPC Procedure for Usage Stats
- [ ] Create `subscription.getUsage` procedure in server/routers.ts
- [ ] Return:
  ```typescript
  {
    invoicesUsed: number,
    invoicesLimit: number | null,
    remainingInvoices: number,
    isPro: boolean
  }
  ```
- [ ] Use getCurrentMonthUsage and subscription helpers

### 4.3 Integrate Usage Display in Dashboard
- [ ] Update `client/src/pages/Dashboard.tsx`
- [ ] Add `trpc.subscription.getUsage.useQuery()` call
- [ ] Display UsageIndicator component in header or sidebar
- [ ] Show warning when approaching limit (e.g., 2/3 used)

### 4.4 Update Create Invoice Page
- [ ] Update `client/src/pages/CreateInvoice.tsx`
- [ ] Check usage before allowing form submission
- [ ] Disable "Save" button if limit reached
- [ ] Show upgrade prompt modal when limit reached
- [ ] Display current usage at top of page

---

## Task 5: Add Upgrade Prompts

### 5.1 Create UpgradePrompt Component
- [ ] Create `client/src/components/subscription/UpgradePrompt.tsx`
- [ ] Props: `{ feature: string, onUpgrade: () => void }`
- [ ] Display modal/dialog with:
  - [ ] Feature name that's blocked
  - [ ] "Upgrade to Pro" button
  - [ ] Link to /subscription page
  - [ ] Dismiss button
- [ ] Style consistently with app theme

### 5.2 Integrate Upgrade Prompts
- [ ] Show when invoice creation blocked
- [ ] Show when user tries to create 4th invoice
- [ ] Link directly to Stripe checkout
- [ ] Track prompt impressions (optional analytics)

---

## Task 6: Testing & Verification

### 6.1 Manual Testing - Free User Flow
- [ ] Create test free user account
- [ ] Create 1st invoice → should succeed, counter = 1
- [ ] Create 2nd invoice → should succeed, counter = 2
- [ ] Create 3rd invoice → should succeed, counter = 3
- [ ] Try 4th invoice → should fail with error message
- [ ] Verify "New Invoice" button disabled after limit
- [ ] Verify upgrade prompt appears

### 6.2 Manual Testing - Pro User Flow
- [ ] Upgrade test user to Pro (or use existing Pro user)
- [ ] Create 10+ invoices → all should succeed
- [ ] Verify no usage counter shown (or shows "unlimited")
- [ ] Verify no limits enforced

### 6.3 Manual Testing - Month Rollover
- [ ] Manually set usageTracking.month to previous month
- [ ] Create new invoice
- [ ] Verify new month record created
- [ ] Verify counter starts at 1 for new month

### 6.4 Automated Testing (Optional)
- [ ] Write vitest test for getCurrentMonthUsage
- [ ] Write vitest test for incrementInvoiceCount
- [ ] Write vitest test for canUserCreateInvoice
- [ ] Write vitest test for invoice creation limit enforcement
- [ ] Run `pnpm test` to verify all tests pass

### 6.5 Edge Cases
- [ ] Test concurrent invoice creation (race condition)
- [ ] Test user with no subscription status (null)
- [ ] Test user with 'canceled' subscription (should be free tier)
- [ ] Test user with 'past_due' subscription (should be blocked?)

---

## Task 7: Documentation & Cleanup

### 7.1 Update Code Comments
- [ ] Add JSDoc to all new functions
- [ ] Document usage tracking logic
- [ ] Explain month format (YYYY-MM)
- [ ] Note that Pro users bypass limits

### 7.2 Update User-Facing Documentation
- [ ] Add section to SUBSCRIPTION_IMPLEMENTATION_PLAN.md
- [ ] Document how limits work
- [ ] Explain month reset behavior
- [ ] Note any edge cases

### 7.3 Update TODO.md
- [ ] Mark Phase 2 tasks complete
- [ ] Note any deviations from plan
- [ ] Document issues encountered

---

## Task 8: Final Verification & Checkpoint

### 8.1 Pre-Checkpoint Checks
- [ ] Run `pnpm exec tsc --noEmit` → zero errors
- [ ] Run `pnpm test` → all tests pass (or skip if no tests)
- [ ] Check dev server starts without errors
- [ ] Verify no console errors in browser
- [ ] Test invoice creation flow end-to-end

### 8.2 Create Checkpoint
- [ ] Write comprehensive checkpoint description
- [ ] List all files created/modified
- [ ] Document what works now
- [ ] Note any limitations or edge cases
- [ ] Include testing results

### 8.3 Prepare Handoff
- [ ] Summarize Phase 2 implementation
- [ ] List next steps (Phase 3: Feature gating)
- [ ] Note any blockers or issues
- [ ] Provide user with checkpoint attachment

---

## Success Criteria

Phase 2 is complete when:

- [x] usageTracking table exists in database
- [ ] getCurrentMonthUsage() function works correctly
- [ ] incrementInvoiceCount() function works correctly
- [ ] Free users cannot create more than 3 invoices per month
- [ ] Pro users can create unlimited invoices
- [ ] Usage counter displays in UI
- [ ] Upgrade prompts appear when limit reached
- [ ] All TypeScript compilation passes
- [ ] Manual testing confirms enforcement works
- [ ] No existing functionality broken

---

## Notes

- Month format is YYYY-MM (e.g., "2026-01") for easy querying and comparison
- Counter resets automatically when new month detected (no cron job needed)
- Pro users bypass all checks for performance
- Past_due subscriptions treated as free tier (can be changed)
- Concurrent creation handled by database unique constraint on (userId, month)
