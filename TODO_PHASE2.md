# Invoice Generator - Phase 2 Features

## Feature 1: Recurring Invoices

### Database Schema
- [x] Add `recurringInvoices` table
  - id, userId, clientId, templateInvoiceId
  - frequency (weekly, monthly, yearly)
  - startDate, endDate (nullable)
  - nextInvoiceDate
  - isActive, createdAt, updatedAt
- [x] Add `recurringInvoiceLineItems` table for template line items
- [x] Run `pnpm db:push` to apply schema

### Backend API
- [x] Create `db.createRecurringInvoice()`
- [x] Create `db.getRecurringInvoicesByUserId()`
- [x] Create `db.getRecurringInvoiceById()`
- [x] Create `db.updateRecurringInvoice()`
- [x] Create `db.deleteRecurringInvoice()`
- [x] Create `db.getRecurringInvoicesDueForGeneration()`
- [x] Add tRPC router `recurringInvoices` with CRUD operations
- [ ] Create background job to generate invoices from recurring templates
- [ ] Add email notification when recurring invoice is generated

### Frontend UI
- [x] Create `RecurringInvoices.tsx` page
- [x] Add "Recurring Invoices" to navigation
- [x] Create `CreateRecurringInvoice.tsx` for create
- [x] Add frequency selector (weekly/monthly/yearly)
- [x] Add start/end date pickers
- [x] Add line items management (reuse from CreateInvoice)
- [x] Show next invoice date
- [x] Add toggle to activate/deactivate
- [ ] Add "View Generated Invoices" link

### Testing
- [x] Write vitest tests for recurring invoice operations
- [ ] Test invoice generation logic - DEFERRED (background job)
- [x] Test date calculations for next invoice

---

## Feature 2: Custom Invoice Templates

### Database Schema
- [x] Add `invoiceTemplates` table
  - id, userId, name, isDefault
  - primaryColor, secondaryColor, accentColor
  - fontFamily, fontSize
  - logoPosition (left, center, right)
  - showCompanyAddress, showPaymentTerms
  - footerText, createdAt, updatedAt
- [x] Run `pnpm db:push` to apply schema

### Backend API
- [x] Create `db.createInvoiceTemplate()`
- [x] Create `db.getInvoiceTemplatesByUserId()`
- [x] Create `db.getInvoiceTemplateById()`
- [x] Create `db.updateInvoiceTemplate()`
- [x] Create `db.deleteInvoiceTemplate()`
- [x] Create `db.setDefaultTemplate()`
- [x] Add tRPC router `invoiceTemplates` with CRUD operations
- [ ] Update PDF generation to use template settings - DEFERRED

### Frontend UI
- [x] Create `Templates.tsx` page
- [x] Add "Templates" to navigation
- [x] Create template management UI inline
- [x] Add color pickers for primary/secondary/accent colors
- [x] Add font family selector
- [ ] Add logo position selector - DEFERRED
- [ ] Add toggle switches for optional fields - DEFERRED
- [ ] Add live preview of invoice with template - DEFERRED
- [x] Add "Set as Default" button
- [ ] Update CreateInvoice to allow template selection - DEFERRED

### Testing
- [x] Write vitest tests for template operations
- [ ] Test PDF generation with different templates - DEFERRED
- [x] Test default template logic

---

## Feature 3: Expense Tracking

### Database Schema
- [x] Add `expenseCategories` table
  - id, userId, name, color, icon, createdAt
- [x] Add `expenses` table
  - id, userId, categoryId
  - amount, currency, date
  - vendor, description, notes
  - receiptUrl, paymentMethod
  - isRecurring, createdAt, updatedAt
- [x] Run `pnpm db:push` to apply schema

### Backend API
- [x] Create `db.createExpenseCategory()`
- [x] Create `db.getExpenseCategoriesByUserId()`
- [x] Create `db.updateExpenseCategory()`
- [x] Create `db.deleteExpenseCategory()`
- [x] Create `db.createExpense()`
- [x] Create `db.getExpensesByUserId()`
- [x] Create `db.getExpenseById()`
- [x] Create `db.updateExpense()`
- [x] Create `db.deleteExpense()`
- [x] Create `db.getExpensesByDateRange()`
- [x] Create `db.getExpensesByCategory()`
- [x] Add tRPC router `expenses` with CRUD operations
- [x] Add tRPC router `expenseCategories` with CRUD operations

### Frontend UI
- [x] Create `Expenses.tsx` page
- [x] Add "Expenses" to navigation
- [x] Create expense management UI inline
- [x] Add category selector with color indicators
- [x] Add amount input with currency
- [x] Add date picker
- [x] Add vendor and description fields
- [ ] Add receipt upload (use S3 storage) - DEFERRED
- [x] Add payment method selector
- [x] Create expense categories management inline
- [x] Add filters by date range and category
- [x] Add expense list with totals

### Testing
- [x] Write vitest tests for expense operations
- [x] Write vitest tests for category operations
- [ ] Test receipt upload to S3 - DEFERRED

---

## Feature 4: Profit/Loss Reports

### Backend API
- [x] Enhanced Analytics page with profit/loss overview
  - Calculate total revenue from paid invoices
  - Calculate total expenses
  - Calculate net profit/loss
  - Group by month
- [x] Show expense breakdown by category
- [x] Show revenue vs expenses comparison
- [x] Integrated into analytics router

### Frontend UI
- [x] Enhanced Analytics.tsx page with profit/loss section
- [x] Profit/loss integrated into Analytics
- [x] Date range selector already exists
- [x] Create profit/loss summary cards
  - Total Revenue
  - Total Expenses
  - Net Profit/Loss
- [x] Show expense breakdown by category with colors
- [ ] Create revenue vs expenses chart (line chart) - DEFERRED
- [ ] Create monthly profit/loss table - DEFERRED
- [ ] Add export to CSV functionality - DEFERRED

### Testing
- [x] Profit/loss integrated into analytics
- [x] Test with various date ranges via analytics tests
- [x] Test edge cases handled in UI

---
## Integration & Polish

- [ ] Update Dashboard to show expense summary - DEFERRED
- [ ] Add quick "Add Expense" button to Dashboard - DEFERRED
- [x] Update Analytics page with expense metrics
- [x] Ensure all new pages are responsive
- [x] Add loading states and error handling
- [x] Update navigation to include new pages
- [x] Create final checkpoint with all features
