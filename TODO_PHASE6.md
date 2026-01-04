# Phase 6: Expense Tracking + Advanced Analytics + Invoice Customization

## Overview
Implement three major feature sets to complete SleekInvoices's financial management capabilities:
1. **Expense Tracking** - Track business costs with receipt uploads and categorization
2. **Advanced Analytics** - Aging reports, profitability analysis, cash flow projections
3. **Invoice Template Customization** - Multiple templates with branding options

**Estimated Total Time**: 12-16 hours  
**Target**: Match/exceed FreshBooks, QuickBooks capabilities at $12/month

---

# Phase 6A: Expense Tracking System (4-5 hours)

## Component 1: Database Schema (30-45 min)

### Tasks:
- [ ] Create `expenses` table
  - [ ] id (primary key)
  - [ ] userId (foreign key)
  - [ ] categoryId (foreign key, nullable)
  - [ ] vendorName (text)
  - [ ] amount (decimal)
  - [ ] currency (text, default USD)
  - [ ] expenseDate (date)
  - [ ] description (text)
  - [ ] receiptUrl (text, nullable - S3 URL)
  - [ ] receiptKey (text, nullable - S3 key)
  - [ ] paymentMethod (enum: cash, credit_card, debit_card, bank_transfer, check)
  - [ ] isBillable (boolean, default false)
  - [ ] clientId (foreign key, nullable - if billable)
  - [ ] invoiceId (foreign key, nullable - if billed)
  - [ ] taxAmount (decimal, default 0)
  - [ ] notes (text, nullable)
  - [ ] createdAt, updatedAt

- [ ] Create `expense_categories` table
  - [ ] id (primary key)
  - [ ] userId (foreign key)
  - [ ] name (text) - e.g., "Office Supplies", "Travel", "Software"
  - [ ] color (text) - hex color for UI
  - [ ] icon (text, nullable) - icon name
  - [ ] isDefault (boolean) - system defaults
  - [ ] createdAt, updatedAt

- [ ] Run `pnpm db:push`

### Acceptance Criteria:
- Tables created with proper foreign keys
- Indexes on userId, expenseDate, categoryId
- Default categories seeded (Office, Travel, Software, Marketing, etc.)

---

## Component 2: Backend API (60-90 min)

### Tasks:
- [ ] Add expense database functions in `server/db.ts`
  - [ ] `createExpense(userId, expense)` - Create new expense
  - [ ] `getExpenseById(id, userId)` - Get single expense
  - [ ] `getExpensesByUserId(userId, filters)` - List with filters (date range, category)
  - [ ] `updateExpense(id, userId, updates)` - Update expense
  - [ ] `deleteExpense(id, userId)` - Delete expense
  - [ ] `getExpenseStats(userId, dateRange)` - Total expenses, by category
  - [ ] `getExpenseCategories(userId)` - Get all categories
  - [ ] `createExpenseCategory(userId, category)` - Create category
  - [ ] `updateExpenseCategory(id, userId, updates)` - Update category
  - [ ] `deleteExpenseCategory(id, userId)` - Delete category

- [ ] Add tRPC router in `server/routers.ts`
  - [ ] `expenses.create` - Create expense
  - [ ] `expenses.get` - Get single expense
  - [ ] `expenses.list` - List expenses with filters
  - [ ] `expenses.update` - Update expense
  - [ ] `expenses.delete` - Delete expense
  - [ ] `expenses.uploadReceipt` - Upload receipt to S3
  - [ ] `expenses.getStats` - Get expense statistics
  - [ ] `expenseCategories.list` - List categories
  - [ ] `expenseCategories.create` - Create category
  - [ ] `expenseCategories.update` - Update category
  - [ ] `expenseCategories.delete` - Delete category

### Acceptance Criteria:
- All CRUD operations working
- Receipt upload to S3 functional
- Filters working (date range, category, payment method)
- Stats calculation accurate

---

## Component 3: Frontend UI (90-120 min)

### Tasks:
- [ ] Create `client/src/pages/Expenses.tsx`
  - [ ] Expense list table with filters
  - [ ] Date range picker
  - [ ] Category filter dropdown
  - [ ] Payment method filter
  - [ ] "Add Expense" button
  - [ ] Edit/Delete actions
  - [ ] Receipt preview/download
  - [ ] Total expenses summary

- [ ] Create `client/src/pages/AddExpense.tsx` (or dialog)
  - [ ] Form fields: vendor, amount, date, category, payment method
  - [ ] Receipt upload with drag-and-drop
  - [ ] Billable toggle with client selector
  - [ ] Description textarea
  - [ ] Save button with validation

- [ ] Create `client/src/pages/ExpenseCategories.tsx`
  - [ ] Category list with color indicators
  - [ ] Add/Edit/Delete category
  - [ ] Color picker
  - [ ] Icon selector

- [ ] Add Expenses route to `client/src/App.tsx`
  - [ ] `/expenses` route
  - [ ] Add to navigation menu

- [ ] Update Dashboard to show expense summary
  - [ ] Total expenses card
  - [ ] Net profit card (revenue - expenses)

### Acceptance Criteria:
- Expense CRUD working in UI
- Receipt upload functional with preview
- Filters working smoothly
- Categories manageable
- Responsive design

---

## Component 4: Testing (45-60 min)

### Tasks:
- [ ] Create `server/expenses.test.ts`
  - [ ] Test: Create expense
  - [ ] Test: Get expense by ID
  - [ ] Test: List expenses with filters
  - [ ] Test: Update expense
  - [ ] Test: Delete expense
  - [ ] Test: Get expense stats
  - [ ] Test: Category CRUD operations
  - [ ] Test: Receipt upload to S3
  - [ ] Test: Billable expense linking to client
  - [ ] Test: Currency handling

- [ ] Run all tests: `pnpm test`

### Acceptance Criteria:
- All tests passing (~86 total: 76 existing + 10 new)
- Edge cases covered

---

# Phase 6B: Advanced Analytics Dashboard (4-5 hours)

## Component 1: Backend Analytics (90-120 min)

### Tasks:
- [ ] Add analytics functions in `server/db.ts`
  - [ ] `getAgingReport(userId)` - Invoices by age (0-30, 31-60, 61-90, 90+)
  - [ ] `getClientProfitability(userId)` - Revenue vs expenses per client
  - [ ] `getCashFlowProjection(userId, months)` - Projected cash flow
  - [ ] `getRevenueByMonth(userId, year)` - Monthly revenue breakdown
  - [ ] `getExpensesByMonth(userId, year)` - Monthly expense breakdown
  - [ ] `getExpensesByCategory(userId, dateRange)` - Category breakdown
  - [ ] `getTaxReport(userId, year)` - Annual tax summary
  - [ ] `getTopClients(userId, limit)` - Highest revenue clients
  - [ ] `getPaymentMethodStats(userId)` - Payment method breakdown

- [ ] Add tRPC router procedures
  - [ ] `analytics.getAgingReport`
  - [ ] `analytics.getClientProfitability`
  - [ ] `analytics.getCashFlowProjection`
  - [ ] `analytics.getRevenueByMonth`
  - [ ] `analytics.getExpensesByMonth`
  - [ ] `analytics.getExpensesByCategory`
  - [ ] `analytics.getTaxReport`
  - [ ] `analytics.exportTaxReport` - Generate PDF

### Acceptance Criteria:
- All analytics queries optimized
- Data accurate and validated
- Export functionality working

---

## Component 2: Frontend Analytics UI (90-120 min)

### Tasks:
- [ ] Update `client/src/pages/Analytics.tsx`
  - [ ] Aging Report section
    - [ ] Table: 0-30 days, 31-60 days, 61-90 days, 90+ days
    - [ ] Amount and count per bucket
    - [ ] Visual bar chart
  
  - [ ] Client Profitability section
    - [ ] Table: Client name, revenue, expenses, profit, margin %
    - [ ] Sortable columns
    - [ ] Chart visualization
  
  - [ ] Cash Flow Projection section
    - [ ] Line chart: projected income vs expenses
    - [ ] 6-month projection
    - [ ] Confidence intervals
  
  - [ ] Revenue vs Expenses section
    - [ ] Monthly comparison chart
    - [ ] Year selector
    - [ ] Net profit trend line
  
  - [ ] Expense Breakdown section
    - [ ] Pie chart by category
    - [ ] Date range selector
    - [ ] Category legend with amounts
  
  - [ ] Tax Report section
    - [ ] Annual summary
    - [ ] Total revenue, expenses, net income
    - [ ] Tax liability estimate
    - [ ] Export to PDF button

- [ ] Add chart components (using existing chart library)
  - [ ] Bar chart for aging report
  - [ ] Pie chart for expense categories
  - [ ] Line chart for cash flow
  - [ ] Stacked bar chart for revenue vs expenses

### Acceptance Criteria:
- All charts rendering correctly
- Data updates in real-time
- Export functionality working
- Responsive design

---

## Component 3: Testing (30-45 min)

### Tasks:
- [ ] Create `server/analytics.test.ts`
  - [ ] Test: Aging report calculation
  - [ ] Test: Client profitability with expenses
  - [ ] Test: Cash flow projection accuracy
  - [ ] Test: Revenue by month aggregation
  - [ ] Test: Expense by category breakdown
  - [ ] Test: Tax report totals

- [ ] Run all tests: `pnpm test`

### Acceptance Criteria:
- All tests passing (~92 total: 86 existing + 6 new)

---

# Phase 6C: Invoice Template Customization (3-4 hours)

## Component 1: Database Schema (30 min)

### Tasks:
- [ ] Create `invoice_templates` table
  - [ ] id (primary key)
  - [ ] userId (foreign key)
  - [ ] name (text) - e.g., "Modern", "Classic", "Minimal"
  - [ ] isDefault (boolean)
  - [ ] layout (enum: standard, compact, detailed)
  - [ ] primaryColor (text) - hex color
  - [ ] accentColor (text) - hex color
  - [ ] fontFamily (text) - font name
  - [ ] logoPosition (enum: left, center, right)
  - [ ] showLogo (boolean)
  - [ ] showCompanyAddress (boolean)
  - [ ] showPaymentTerms (boolean)
  - [ ] customFields (JSON) - array of custom field definitions
  - [ ] footerText (text, nullable)
  - [ ] createdAt, updatedAt

- [ ] Add `templateId` to `invoices` table
  - [ ] templateId (foreign key, nullable)

- [ ] Run `pnpm db:push`

### Acceptance Criteria:
- Template table created
- Invoice linked to template
- Default templates seeded

---

## Component 2: Backend API (45-60 min)

### Tasks:
- [ ] Add template functions in `server/db.ts`
  - [ ] `getInvoiceTemplates(userId)` - List templates
  - [ ] `getInvoiceTemplateById(id, userId)` - Get single template
  - [ ] `createInvoiceTemplate(userId, template)` - Create template
  - [ ] `updateInvoiceTemplate(id, userId, updates)` - Update template
  - [ ] `deleteInvoiceTemplate(id, userId)` - Delete template
  - [ ] `setDefaultTemplate(id, userId)` - Set as default
  - [ ] `seedDefaultTemplates(userId)` - Create default templates

- [ ] Update PDF generation in `server/pdf.ts`
  - [ ] Apply template styling to PDF
  - [ ] Support custom colors, fonts, layout
  - [ ] Render custom fields
  - [ ] Apply logo positioning

- [ ] Add tRPC router procedures
  - [ ] `invoiceTemplates.list`
  - [ ] `invoiceTemplates.get`
  - [ ] `invoiceTemplates.create`
  - [ ] `invoiceTemplates.update`
  - [ ] `invoiceTemplates.delete`
  - [ ] `invoiceTemplates.setDefault`

### Acceptance Criteria:
- Template CRUD working
- PDF generation applies template styling
- Default templates available

---

## Component 3: Frontend UI (60-90 min)

### Tasks:
- [ ] Create `client/src/pages/InvoiceTemplates.tsx`
  - [ ] Template gallery with previews
  - [ ] "Create Template" button
  - [ ] Edit/Delete/Set Default actions
  - [ ] Template preview modal

- [ ] Create template editor dialog
  - [ ] Name input
  - [ ] Layout selector (standard, compact, detailed)
  - [ ] Color pickers (primary, accent)
  - [ ] Font family dropdown
  - [ ] Logo position selector
  - [ ] Toggle switches (show logo, address, terms)
  - [ ] Custom fields editor (add/remove/reorder)
  - [ ] Footer text textarea
  - [ ] Live preview pane

- [ ] Update `client/src/pages/AddInvoice.tsx`
  - [ ] Template selector dropdown
  - [ ] Preview button to see invoice with template

- [ ] Add InvoiceTemplates route to App.tsx
  - [ ] `/invoice-templates` route
  - [ ] Add to settings or navigation

### Acceptance Criteria:
- Template editor functional
- Live preview working
- Template selection in invoice creation
- Gallery displays all templates

---

## Component 4: Testing (30 min)

### Tasks:
- [ ] Create `server/invoice-templates.test.ts`
  - [ ] Test: Create template
  - [ ] Test: Get template by ID
  - [ ] Test: Update template
  - [ ] Test: Delete template
  - [ ] Test: Set default template
  - [ ] Test: PDF generation with template

- [ ] Run all tests: `pnpm test`

### Acceptance Criteria:
- All tests passing (~98 total: 92 existing + 6 new)

---

# Integration & Final Checkpoint (1-2 hours)

## Tasks:
- [ ] Integration testing
  - [ ] Create expense, verify in analytics
  - [ ] Generate invoice with custom template
  - [ ] Check profit/loss reflects expenses
  - [ ] Export tax report with expenses included
  - [ ] Test aging report with overdue invoices
  - [ ] Verify cash flow projection

- [ ] Update Dashboard
  - [ ] Add expense summary card
  - [ ] Add net profit card (revenue - expenses)
  - [ ] Update charts to include expense data

- [ ] Run all tests: `pnpm test`
  - [ ] Target: ~98 tests passing

- [ ] Check status: `webdev_check_status`
  - [ ] No TypeScript errors
  - [ ] No build errors
  - [ ] Dev server running

- [ ] Create documentation
  - [ ] Update TODO_PHASE6.md (mark all complete)
  - [ ] Create CHECKPOINT_PHASE6.md
  - [ ] Save checkpoint

### Acceptance Criteria:
- All three features working together
- No regressions
- All tests passing
- Documentation complete

---

## Success Metrics

- **Functionality**: All 3 feature sets working end-to-end
- **Testing**: ~98 total tests passing
- **Performance**: Analytics load in <2 seconds
- **UX**: Intuitive navigation, responsive design
- **Competitive**: Match/exceed FreshBooks ($15-60/month) at $12/month

---

## Estimated Timeline

**Phase 6A: Expense Tracking** (4-5 hours)
- Database: 30-45 min
- Backend: 60-90 min
- Frontend: 90-120 min
- Testing: 45-60 min

**Phase 6B: Advanced Analytics** (4-5 hours)
- Backend: 90-120 min
- Frontend: 90-120 min
- Testing: 30-45 min

**Phase 6C: Invoice Templates** (3-4 hours)
- Database: 30 min
- Backend: 45-60 min
- Frontend: 60-90 min
- Testing: 30 min

**Integration & Checkpoint** (1-2 hours)

**Total: 12-16 hours**

---

## Notes

- Use existing S3 storage for receipt uploads
- Leverage existing PDF generation for template styling
- Reuse existing chart components from Analytics page
- Consider adding expense import from CSV (future enhancement)
- Consider adding recurring expenses (future enhancement)
