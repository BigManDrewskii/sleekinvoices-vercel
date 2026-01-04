# Phase 6A: Expense Tracking - Implementation Plan

## Overview
Complete expense tracking with receipt uploads, enhanced UI, and billable expense workflow.

**Estimated Time:** 3-4 hours  
**Current Status:** Schema complete, basic CRUD exists, need to add receipt uploads and enhanced UI

---

## Component 1: Receipt Upload with S3 (45-60 min)

### Backend Implementation
- [x] Add receipt upload endpoint to expense router
  - Accept file upload (multipart/form-data)
  - Validate file type (images, PDFs only)
  - Validate file size (max 5MB)
  - Generate unique file key with user ID prefix
  - Upload to S3 using `storagePut()`
  - Return receipt URL and key

- [ ] Add receipt deletion logic
  - When expense is deleted, delete receipt from S3
  - Use `storageDelete()` helper (need to create if doesn't exist)
  - Handle gracefully if receipt doesn't exist

- [ ] Update expense procedures
  - `create`: Accept receiptUrl and receiptKey
  - `update`: Handle receipt replacement (delete old, upload new)
  - `delete`: Delete receipt from S3 before deleting expense

### Frontend Implementation
- [ ] Create receipt upload component
  - File input with drag-and-drop
  - Preview uploaded image/PDF
  - Upload progress indicator
  - Error handling for size/type validation
  - Delete uploaded receipt button

---

## Component 2: Enhanced Expense Procedures (30-45 min)

### Update Database Functions (server/db.ts)
- [ ] Update `createExpense()` to accept all new fields:
  - vendor (string)
  - paymentMethod (enum)
  - taxAmount (decimal)
  - receiptUrl (string)
  - receiptKey (string)
  - isBillable (boolean)
  - clientId (number, nullable)
  - invoiceId (number, nullable)

- [ ] Update `updateExpense()` similarly
  - Handle all new fields
  - Update receipt if changed

- [ ] Update `getExpenseStats()` to include:
  - Total billable expenses
  - Total non-billable expenses
  - Expenses by payment method
  - Expenses by category with tax breakdown

### Update tRPC Router (server/routers.ts)
- [ ] Update `expenses.create` input schema
  - Add all new fields with proper validation
  - Make vendor, paymentMethod, taxAmount optional
  - Make isBillable default to false

- [ ] Update `expenses.update` input schema
  - Same as create

- [ ] Add `expenses.uploadReceipt` procedure
  - Accept file data (base64 or buffer)
  - Upload to S3
  - Return URL and key

---

## Component 3: Enhanced Expense UI (60-90 min)

### Update Expenses Page (client/src/pages/Expenses.tsx)
- [ ] Enhance expense form dialog
  - Add vendor field (text input)
  - Add payment method dropdown (cash, credit_card, debit_card, bank_transfer, check, other)
  - Add tax amount field (number input)
  - Add receipt upload section
  - Add billable checkbox
  - Add client selector (conditional, only show if billable=true)
  - Improve layout with sections

- [ ] Add receipt display
  - Show receipt thumbnail in expense list
  - Click to view full size
  - Download receipt button

- [ ] Enhance expense list table
  - Add vendor column
  - Add payment method badge
  - Add receipt indicator icon
  - Add billable badge
  - Add client name (if billable)

- [ ] Add filtering
  - Filter by payment method
  - Filter by billable status
  - Filter by client (if billable)
  - Filter by date range

- [ ] Improve stats display
  - Show total by payment method
  - Show billable vs non-billable breakdown
  - Show tax totals

---

## Component 4: Billable Expense Workflow (30-45 min)

### Backend
- [ ] Add `expenses.linkToInvoice` procedure
  - Accept expenseId and invoiceId
  - Update expense.invoiceId
  - Optionally add expense as line item to invoice

- [ ] Add `expenses.getBillableUnlinked` query
  - Return all billable expenses not yet linked to invoice
  - Filter by clientId

### Frontend
- [ ] Create "Link to Invoice" feature
  - Show list of billable expenses for a client
  - Allow selecting expenses when creating invoice
  - Auto-add selected expenses as line items
  - Mark expenses as linked

- [ ] Add billable expense indicator on invoice view
  - Show which line items came from expenses
  - Link back to expense detail

---

## Component 5: Testing (45-60 min)

### Backend Tests (server/expenses.test.ts)
- [ ] Test expense creation with all fields
- [ ] Test receipt upload and deletion
- [ ] Test expense update with receipt replacement
- [ ] Test expense deletion removes receipt from S3
- [ ] Test billable expense workflow
- [ ] Test linking expense to invoice
- [ ] Test expense stats with new fields
- [ ] Test filtering and querying

**Target:** 8-10 new tests

---

## Component 6: Documentation & Checkpoint (15-30 min)

- [ ] Update TODO_PHASE6A.md with completion status
- [ ] Create CHECKPOINT_PHASE6A.md
- [ ] Run all tests (target: 90+ passing)
- [ ] Check project status
- [ ] Save checkpoint

---

## Success Criteria

✅ Receipt upload works with S3 storage  
✅ All new expense fields are functional  
✅ Billable expense workflow is complete  
✅ Expense list shows all new information  
✅ Filtering works for all new fields  
✅ All tests passing (90+ total)  
✅ No TypeScript errors  
✅ No console errors in browser

---

## Notes

- Schema already enhanced in previous session
- Basic CRUD operations already exist
- Focus on receipt uploads and UI enhancements
- Billable workflow is new functionality
