# Phase 6A Frontend Implementation Plan

## Overview
Complete expense tracking frontend with receipt uploads, expandable row details, and billable workflow.

**Requirements Confirmed:**
- Receipt upload during expense creation (not separate step)
- Billable workflow: auto-create line items + allow editing before adding
- Receipt types: Images (jpg, png, gif, webp) + PDFs, 5MB max
- Expense list: Expandable row detail view (not new columns)
- Testing: Write all tests at the end

---

## COMPONENT 1: Receipt Upload Component (45 min) ✅

### File: `client/src/components/expenses/ReceiptUpload.tsx`

- [x] Create ReceiptUpload component with props:
  - `value: { url?: string, key?: string } | null`
  - `onChange: (receipt: { url: string, key: string } | null) => void`
  - `disabled?: boolean`

- [x] Implement file input with drag-and-drop zone
  - [x] Hidden file input element
  - [x] Clickable drop zone with dashed border
  - [x] Drag over state styling (border color change)
  - [x] File type validation (image/*, application/pdf)
  - [x] File size validation (5MB max)
  - [x] Show error toast for invalid files

- [x] Implement file preview
  - [x] Image preview with thumbnail
  - [x] PDF preview with icon + filename
  - [x] "View Full Size" button (opens in new tab)
  - [x] "Remove" button to clear receipt

- [x] Implement upload functionality
  - [x] Convert file to base64
  - [x] Call `trpc.expenses.uploadReceipt.useMutation()`
  - [x] Show upload progress indicator
  - [x] Handle upload errors with toast
  - [x] Update parent component with URL and key

- [x] Add upload states
  - [x] Idle: Show drop zone
  - [x] Uploading: Show spinner + progress
  - [x] Uploaded: Show preview + remove button
  - [x] Error: Show error message + retry button

---

## COMPONENT 2: Enhanced Expense Form (60 min) ✅

### File: `client/src/pages/Expenses.tsx` (Update existing form)

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

## COMPONENT 3: Expandable Row Detail View (60 min)

### File: `client/src/pages/Expenses.tsx` (Update expense list)

- [ ] Add expandedExpenseId state
  - [ ] `const [expandedExpenseId, setExpandedExpenseId] = useState<number | null>(null)`

- [ ] Update expense list table structure
  - [ ] Keep existing columns: Date, Category, Amount, Description, Actions
  - [ ] Add expand/collapse icon button in first column
  - [ ] Use ChevronDown/ChevronUp icon from lucide-react

- [ ] Create ExpenseDetailRow component (inline or separate)
  - [ ] Render below main row when expanded
  - [ ] Full-width colspan
  - [ ] Grid layout for details (2-3 columns)

- [ ] Display additional details in expanded view:
  - [ ] Vendor (if exists)
  - [ ] Payment Method (if exists) - with badge styling
  - [ ] Tax Amount (if > 0)
  - [ ] Total (amount + tax)
  - [ ] Receipt thumbnail/link (if exists)
    - [ ] Image: show thumbnail, click to open full size
    - [ ] PDF: show PDF icon, click to open
  - [ ] Billable status (if true) - with badge
  - [ ] Client name (if billable) - with link to client
  - [ ] Invoice link (if linked to invoice)

- [ ] Add expand/collapse functionality
  - [ ] Click row or icon to toggle
  - [ ] Update expandedExpenseId state
  - [ ] Smooth animation (optional, use CSS transition)

- [ ] Style expanded row
  - [ ] Light background color to distinguish from main rows
  - [ ] Padding and spacing for readability
  - [ ] Responsive grid (stack on mobile)

---

## COMPONENT 4: Billable Expense Workflow (45 min)

### Backend Procedures (server/routers.ts)

- [ ] Add `expenses.getBillableUnlinked` query
  - [ ] Input: `{ clientId?: number }`
  - [ ] Return expenses where isBillable=true AND invoiceId=null
  - [ ] Optional filter by clientId
  - [ ] Order by date DESC

- [ ] Add `expenses.linkToInvoice` mutation
  - [ ] Input: `{ expenseId: number, invoiceId: number }`
  - [ ] Update expense.invoiceId
  - [ ] Return success

### Frontend: Create Invoice Integration

- [ ] Update `client/src/pages/CreateInvoice.tsx`
  - [ ] Add "Add from Billable Expenses" button/section
  - [ ] Show only after client is selected
  - [ ] Fetch billable expenses for selected client
  - [ ] Display list of unbilled expenses with checkboxes

- [ ] Create expense selection UI
  - [ ] Checkbox list of expenses
  - [ ] Show: date, description, amount
  - [ ] "Add Selected" button

- [ ] Implement add selected expenses
  - [ ] For each selected expense:
    - [ ] Create line item with expense details
    - [ ] Description: expense description
    - [ ] Quantity: 1
    - [ ] Rate: expense amount + tax
  - [ ] Allow editing line items before saving invoice
  - [ ] Link expenses to invoice after invoice is created

### Frontend: View Invoice Integration

- [ ] Update `client/src/pages/ViewInvoice.tsx`
  - [ ] Add "Related Expenses" section (optional)
  - [ ] Query expenses where invoiceId = current invoice
  - [ ] Display list with links back to expense details

---

## COMPONENT 5: Filtering & Stats Enhancement (30 min)

### File: `client/src/pages/Expenses.tsx`

- [ ] Add filter state
  - [ ] paymentMethodFilter: string | null
  - [ ] billableFilter: 'all' | 'billable' | 'non-billable'
  - [ ] clientFilter: number | null

- [ ] Add filter UI above expense list
  - [ ] Payment Method dropdown (All, Cash, Credit Card, etc.)
  - [ ] Billable Status dropdown (All, Billable, Non-Billable)
  - [ ] Client dropdown (All, or specific client)
  - [ ] "Clear Filters" button

- [ ] Implement client-side filtering
  - [ ] Filter expenses array based on active filters
  - [ ] Update displayed list

- [ ] Update stats display
  - [ ] Show total by payment method (if filter active)
  - [ ] Show billable vs non-billable breakdown
  - [ ] Show tax totals

---

## COMPONENT 6: Comprehensive Testing (60 min)

### File: `server/expenses-enhanced.test.ts`

- [ ] Test 1: Create expense with all new fields
  - [ ] vendor, paymentMethod, taxAmount
  - [ ] Verify all fields saved correctly

- [ ] Test 2: Create expense with receipt
  - [ ] Upload receipt (mock base64)
  - [ ] Create expense with receiptUrl and receiptKey
  - [ ] Verify receipt fields saved

- [ ] Test 3: Update expense with new fields
  - [ ] Create expense
  - [ ] Update vendor, paymentMethod, taxAmount
  - [ ] Verify updates applied

- [ ] Test 4: Delete expense with receipt
  - [ ] Create expense with receipt
  - [ ] Delete expense
  - [ ] Verify receipt deletion attempted (mock storageDelete)

- [ ] Test 5: Create billable expense
  - [ ] Set isBillable=true, clientId
  - [ ] Verify saved correctly

- [ ] Test 6: Get billable unlinked expenses
  - [ ] Create billable expense (no invoiceId)
  - [ ] Create non-billable expense
  - [ ] Query getBillableUnlinked
  - [ ] Verify only billable returned

- [ ] Test 7: Link expense to invoice
  - [ ] Create billable expense
  - [ ] Create invoice
  - [ ] Link expense to invoice
  - [ ] Verify invoiceId updated

- [ ] Test 8: Filter expenses by payment method
  - [ ] Create expenses with different payment methods
  - [ ] Query with filter
  - [ ] Verify correct expenses returned

- [ ] Test 9: Receipt upload validation
  - [ ] Test file size limit (mock)
  - [ ] Test file type validation (mock)
  - [ ] Verify errors handled

- [ ] Test 10: Expense stats with new fields
  - [ ] Create expenses with tax, billable flags
  - [ ] Query stats
  - [ ] Verify totals include tax
  - [ ] Verify billable breakdown

- [ ] Run all tests
  - [ ] `pnpm test expenses-enhanced`
  - [ ] Verify all 10 tests pass
  - [ ] Run full test suite: `pnpm test`
  - [ ] Target: 92+ tests passing

---

## COMPONENT 7: Final Verification & Checkpoint (30 min)

- [ ] Manual testing checklist
  - [ ] Create expense with all fields
  - [ ] Upload receipt (image)
  - [ ] Upload receipt (PDF)
  - [ ] Expand/collapse expense rows
  - [ ] Filter by payment method
  - [ ] Filter by billable status
  - [ ] Create billable expense
  - [ ] Link expense to invoice
  - [ ] Delete expense with receipt
  - [ ] Verify receipt deleted from S3 (check logs)

- [ ] Update TODO_PHASE6A.md
  - [ ] Mark all tasks complete

- [ ] Check project status
  - [ ] `webdev_check_status`
  - [ ] Verify no TypeScript errors
  - [ ] Verify no console errors in browser

- [ ] Create checkpoint documentation
  - [ ] File: `CHECKPOINT_PHASE6A.md`
  - [ ] Document all features implemented
  - [ ] Include test results
  - [ ] Include screenshots (optional)

- [ ] Save checkpoint
  - [ ] `webdev_save_checkpoint`
  - [ ] Description: "Phase 6A Complete: Enhanced Expense Tracking with Receipts and Billable Workflow"

---

## Success Criteria

✅ Receipt upload works with images and PDFs (5MB max)  
✅ All new expense fields functional (vendor, payment method, tax, billable)  
✅ Expandable row detail view shows all expense information  
✅ Billable expense workflow: select expenses when creating invoice  
✅ Filtering works for payment method, billable status, client  
✅ All 10 new tests pass (92+ total tests)  
✅ No TypeScript errors  
✅ No console errors in browser  
✅ Receipt deletion works when expense deleted

---

## Estimated Timeline

- Component 1 (Receipt Upload): 45 min
- Component 2 (Enhanced Form): 60 min
- Component 3 (Expandable Rows): 60 min
- Component 4 (Billable Workflow): 45 min
- Component 5 (Filtering): 30 min
- Component 6 (Testing): 60 min
- Component 7 (Verification): 30 min

**Total: 5.5 hours**

---

## Notes

- Reference this TODO before starting each component
- Mark tasks complete as you finish them
- Test each component in browser before moving to next
- Keep code clean and well-commented
- Follow existing code style and patterns
