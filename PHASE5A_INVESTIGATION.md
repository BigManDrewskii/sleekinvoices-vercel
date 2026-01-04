# Phase 5A Investigation: Dashboard & Payment Integration Issues

**Investigation Date:** January 4, 2026  
**Investigator:** Manus AI  
**Goal:** Identify root causes of dashboard calculation discrepancies

---

## Problem Statement

The dashboard shows:
- Total Revenue: $0.00
- Outstanding: $0.00
- Total Invoices: 20
- Paid Invoices: 0

However, we have:
- A complete payment system (Phase 4A)
- Payment tracking functionality
- 42 passing tests including 15 payment tests

**Hypothesis:** Dashboard queries don't incorporate payment data, only check invoice status field.

---

## Investigation Plan

### 1. Analyze Dashboard Component
- [ ] Review Dashboard.tsx to understand data sources
- [ ] Identify which tRPC queries are used
- [ ] Check how revenue and paid count are calculated

### 2. Analyze Backend Queries
- [ ] Review dashboard-related tRPC procedures
- [ ] Check SQL queries for revenue calculation
- [ ] Verify how "paid invoices" are counted
- [ ] Check if queries join with payments table

### 3. Analyze Invoice Status Updates
- [ ] Check if manual payment recording updates invoice status
- [ ] Verify Stripe webhook updates invoice status
- [ ] Check if partial payments are handled

### 4. Database State Analysis
- [ ] Query actual invoice statuses in database
- [ ] Check if any invoices have status='paid'
- [ ] Verify payments table has records
- [ ] Check payment-invoice linkage

### 5. Invoice List Analysis
- [ ] Review Invoices.tsx component
- [ ] Check what data is displayed
- [ ] Verify if payment status is included in queries

---

## Findings

### Finding 1: Dashboard Data Source

**File:** `client/src/pages/Dashboard.tsx` (Lines 11-13)

**Current Implementation:**
```typescript
const { data: stats, isLoading: statsLoading } = trpc.analytics.getStats.useQuery(undefined, {
  enabled: isAuthenticated,
});
```

**Issues Identified:**
- Dashboard calls `trpc.analytics.getStats` which returns stats based on invoice.status field only
- Does not query payments table
- Does not calculate actual paid amounts from payment records

**Root Cause:**
- Backend `getInvoiceStats` function relies solely on invoice.status field

---

### Finding 2: Backend Revenue Calculation

**File:** `server/db.ts` (Lines 348-377)

**Current Implementation:**
```typescript
export async function getInvoiceStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
  
  const totalRevenue = allInvoices
    .filter(inv => inv.status === 'paid')  // ← PROBLEM!
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  const outstandingBalance = allInvoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.total), 0);
  
  const totalInvoices = allInvoices.length;
  const paidInvoices = allInvoices.filter(inv => inv.status === 'paid').length; // ← PROBLEM!
  const overdueInvoices = allInvoices.filter(inv => inv.status === 'overdue').length;
  
  return {
    totalRevenue,
    outstandingBalance,
    totalInvoices,
    paidInvoices,
    overdueInvoices,
    averageInvoiceValue,
  };
}
```

**Issues Identified:**
1. Revenue only counts invoices where `status='paid'`
2. Paid invoice count only checks status field
3. Does not query payments table at all
4. Does not sum actual payment amounts
5. Does not handle partial payments

**Root Cause:**
- Function was written before payment system existed
- Assumes invoice.status is the source of truth
- Needs to be rewritten to query payments table

---

### Finding 3: Invoice Status Update Logic

**Files:** 
- `server/webhooks/stripe.ts` (Line 106)
- `server/routers.ts` (Lines 831-848)

**Current Implementation:**

**Stripe Webhook (DOES update status):**
```typescript
// Line 106 in stripe.ts
await updateInvoice(invoice.id, invoice.userId, { status: "paid" });
```

**Manual Payment (DOES NOT update status):**
```typescript
// Lines 841-847 in routers.ts
create: protectedProcedure
  .mutation(async ({ ctx, input }) => {
    const payment = await db.createPayment({
      ...input,
      userId: ctx.user.id,
      status: "completed",
    });
    return payment;  // ← Just creates payment, doesn't update invoice!
  }),
```

**Issues Identified:**
1. Stripe webhooks DO update invoice status to 'paid'
2. Manual payment recording does NOT update invoice status
3. No logic to check if invoice is fully paid vs partially paid
4. No logic to update status back to 'sent' if payment is refunded

**Root Cause:**
- Inconsistent status update logic between Stripe and manual payments
- Missing payment amount comparison logic

---

### Finding 4: Invoice List Payment Data

**File:** `client/src/pages/Invoices.tsx`

**Current Implementation:**
- Invoice list queries `trpc.invoices.list` which returns basic invoice data
- No payment information included in query
- No payment status indicators in UI
- No filters for payment status

**Issues Identified:**
1. Invoice list doesn't show payment status
2. Can't filter by paid/unpaid/partial
3. No visual indicator of payment progress
4. Must click into each invoice to see payment status

**Root Cause:**
- Invoice list query doesn't join with payments table
- UI doesn't have payment status components

---

## Validation Logs

### Log 1: Dashboard Query Execution
```
// Will add logging to see actual SQL queries
```

### Log 2: Invoice Status Check
```
// Will query database to see actual statuses
```

### Log 3: Payment Records Check
```
// Will verify payments exist in database
```

---

## Conclusions

**After investigation, the root causes are:**

1. **Dashboard Calculation Issue** - `getInvoiceStats()` only checks `invoice.status='paid'` instead of querying payments table
2. **Manual Payment Status Gap** - Manual payments don't update invoice status, only Stripe webhooks do
3. **Invoice List Missing Payment Data** - Invoice list query doesn't include payment information
4. **No Overdue Detection** - No cron job or logic to mark invoices as overdue based on due date
5. **No Partial Payment Handling** - System treats invoices as binary (paid/unpaid), not partial

**Recommended Fixes:**

1. **Rewrite `getInvoiceStats()`** to:
   - Query payments table and sum actual payment amounts
   - Calculate paid invoices by comparing total paid vs invoice total
   - Handle partial payments correctly
   - Update outstanding balance to exclude paid amounts

2. **Update Manual Payment Creation** to:
   - Calculate total paid for invoice after creating payment
   - Update invoice status to 'paid' if fully paid
   - Keep status as 'sent' if partially paid
   - Add `amountPaid` field to invoice for tracking

3. **Enhance Invoice List Query** to:
   - Join with payments table
   - Include total paid amount
   - Calculate payment status (unpaid/partial/paid)
   - Add payment progress percentage

4. **Implement Overdue Detection** via:
   - Cron job that runs daily
   - Checks invoices with dueDate < today AND status != 'paid'
   - Updates status to 'overdue'
   - Logs overdue transitions

5. **Add Payment Filters** to:
   - Invoice list page
   - Filter by: All, Unpaid, Partial, Paid, Overdue
   - Search by payment method
   - Date range filters

---

## Next Steps

After completing investigation:
1. Document all findings above
2. Create detailed TODO.md with implementation plan
3. Proceed with fixes using concurrent testing approach
