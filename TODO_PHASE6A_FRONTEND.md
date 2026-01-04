# Phase 6A Frontend Implementation Plan

## Status: ✅ COMPLETED

## Overview
Complete expense tracking frontend with receipt uploads, expandable row details, and billable workflow.

**Requirements Confirmed:**
- Receipt upload during expense creation (not separate step)
- Billable workflow: auto-create line items + allow editing before adding
- Receipt types: Images (jpg, png, gif, webp) + PDFs, 5MB max
- Expense list: Expandable row detail view (not new columns)
- Testing: Write all tests at the end

---

## COMPONENT 1: Receipt Upload Component ✅

### File: `client/src/components/expenses/ReceiptUpload.tsx`

- [x] Create ReceiptUpload component with props
- [x] Implement file input with drag-and-drop zone
- [x] Implement file preview
- [x] Implement upload functionality
- [x] Add upload states

---

## COMPONENT 2: Enhanced Expense Form ✅

### File: `client/src/pages/Expenses.tsx`

- [x] Update expenseForm state to include new fields
- [x] Add vendor field to form
- [x] Add payment method dropdown
- [x] Add tax amount field with total calculation
- [x] Add receipt upload section
- [x] Add billable expense section with checkbox
- [x] Conditional client selector
- [x] Update form layout with sections
- [x] Update handleCreateExpense function
- [x] Validate billable expense requirements
- [x] Update form reset with all new fields

---

## COMPONENT 3: Expandable Row Detail View ✅

### File: `client/src/pages/Expenses.tsx`

- [x] Add expandedExpenses state (Set<number>)
- [x] Update expense list table structure
- [x] Create ExpenseDetailRow component (inline)
- [x] Display additional details in expanded view
- [x] Add expand/collapse functionality
- [x] Style expanded row

---

## COMPONENT 4: Billable Expense Workflow ✅

### Backend Procedures (server/routers.ts)
- [x] `expenses.getBillableUnlinked` query
- [x] `expenses.linkToInvoice` mutation

### Frontend: Create Invoice Integration
- [x] BillableExpenseDialog component
- [x] Integration with CreateInvoice page
- [x] Expense selection UI
- [x] Auto-populate line items from expenses

---

## COMPONENT 5: Filtering & Stats Enhancement ✅

### File: `client/src/pages/Expenses.tsx`

- [x] Add filter state
  - [x] paymentMethodFilter: string | null
  - [x] billableFilter: 'all' | 'billable' | 'non-billable'
  - [x] clientFilter: number | null
  - [x] categoryFilter: number | null

- [x] Add filter UI above expense list
  - [x] Payment Method dropdown
  - [x] Billable Status dropdown
  - [x] Client dropdown
  - [x] Category dropdown
  - [x] Active filter tags with remove buttons
  - [x] "Clear All Filters" button

- [x] Implement client-side filtering
  - [x] Filter expenses array based on active filters
  - [x] Update displayed list
  - [x] Show "No matching expenses" empty state

- [x] Update stats display
  - [x] Total expenses with tax breakdown
  - [x] Expense count (filtered/total)
  - [x] Billable amount and count
  - [x] Non-billable amount and count

---

## COMPONENT 6: Comprehensive Testing ✅

### File: `server/expenses-enhanced.test.ts`

- [x] Test 1: Create expense with all new fields (3 tests)
- [x] Test 2: Create expense with receipt (3 tests)
- [x] Test 3: Update expense with new fields (2 tests)
- [x] Test 4: Delete expense with receipt (2 tests)
- [x] Test 5: Create billable expense (2 tests)
- [x] Test 6: Get billable unlinked expenses (3 tests)
- [x] Test 7: Link expense to invoice (3 tests)
- [x] Test 8: Filter expenses by payment method (3 tests)
- [x] Test 9: Receipt upload validation (4 tests)
- [x] Test 10: Expense stats with new fields (4 tests)
- [x] Expense Filtering Logic (6 tests)
- [x] Billable Expense Workflow Logic (3 tests)

**Total: 38 tests passing**

---

## COMPONENT 7: Final Verification & Checkpoint ✅

- [x] Build passes successfully
- [x] All new tests pass (38/38)
- [x] TypeScript compilation successful
- [x] No breaking changes to existing functionality

---

## Success Criteria ✅

✅ Receipt upload works with images and PDFs (5MB max)  
✅ All new expense fields functional (vendor, payment method, tax, billable)  
✅ Expandable row detail view shows all expense information  
✅ Billable expense workflow: select expenses when creating invoice  
✅ Filtering works for payment method, billable status, client, category  
✅ All 38 new tests pass  
✅ No TypeScript errors  
✅ Build completes successfully

---

## Test Summary

| Test Suite | Tests |
|------------|-------|
| Schema Validation | 16 |
| Business Logic | 13 |
| Filtering Logic | 6 |
| Billable Workflow | 3 |
| **Total** | **38** |

---

## Files Modified

### Frontend
- `client/src/pages/Expenses.tsx` - Complete rewrite with filtering and enhanced stats

### Tests
- `server/expenses-enhanced.test.ts` - New comprehensive test suite

---

## Next Steps (Future Phases)

1. **View/Edit Invoice** - Invoice detail page with edit functionality
2. **Analytics Dashboard** - Revenue charts and expense breakdowns
3. **Settings Page** - User preferences and company settings
4. **Subscription Management** - Pro tier features and Stripe integration
