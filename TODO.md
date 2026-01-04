# Invoice Generator - Implementation TODO

## 🚧 CURRENT WORK: Phase 6A Frontend - Expense Tracking

- [x] Backend complete (receipt upload, enhanced procedures, S3 integration)
- [x] Component 1: Receipt Upload Component (45 min)
  - [x] Drag-and-drop file input
  - [x] Image/PDF preview
  - [x] Upload progress and validation
- [x] Component 2: Enhanced Expense Form (60 min)
  - [x] Add vendor, payment method, tax fields
  - [x] Integrate receipt upload
  - [x] Add billable checkbox + client selector
- [x] Component 3: Expandable Row Detail View (60 min)
  - [x] Add expand/collapse state management
  - [x] Add ChevronDown/ChevronUp icon button
  - [x] Build expanded detail layout showing vendor, payment, tax, receipt, billable
  - [x] Add smooth animation for expand/collapse
  - [x] Test all fields display correctly
- [x] Component 4: Billable Expense Workflow (45 min)
  - [x] Backend: getBillableUnlinked procedure
  - [x] Backend: linkToInvoice procedure
  - [x] Backend: getBillableExpenses helper in db.ts
  - [x] Frontend: Add expenses button on CreateInvoice
  - [x] Frontend: Expense selection dialog
  - [x] Frontend: Auto-create line items from expenses
- [ ] Component 5: Filtering & Stats (30 min)
  - [ ] Filter by payment method, billable status, client
  - [ ] Enhanced stats display
- [ ] Component 6: Testing (60 min)
  - [ ] 10 comprehensive tests for all features
  - [ ] Target: 92+ total tests passing
- [ ] Component 7: Final verification and checkpoint (30 min)

See TODO_PHASE6A_FRONTEND.md for detailed implementation plan

## 🐛 BUG FIXES (Completed)

- [x] Fix nested `<a>` tag error on Dashboard page
  - [x] Investigate Dashboard.tsx for nested Link components
  - [x] Remove nested anchor tags from Recent Invoices section
  - [x] Verify fix in browser

## ✅ COMPLETED PHASES

### Phase 1: Clients Management (Complete)
- [x] Create shared components (ClientDialog, DeleteConfirmDialog)
- [x] Implement Clients.tsx with table view and search
- [x] Implement create client flow
- [x] Implement edit client flow
- [x] Implement delete client flow with confirmation
- [x] Add loading and error states
- [x] Test all CRUD operations

### Phase 2: Invoices List (Complete)
- [x] Build InvoiceTable component
- [x] Implement status filter dropdown
- [x] Add search by invoice number/client
- [x] Add quick action buttons (view, edit, delete, PDF, email, payment link)
- [x] Add loading and error states
- [x] Test all features

---

## 🚧 REMAINING PHASES

### Phase 3: Create Invoice Page
**Goal:** Build dynamic invoice creation form with line items, calculations, and client selection

#### 3.1 Component Structure
- [x] Create `/client/src/components/invoices/LineItemRow.tsx`
  - Input fields: description, quantity, rate
  - Auto-calculate amount (quantity × rate)
  - Delete button
  - Drag handle for reordering (optional for MVP)
  
- [x] Create `/client/src/components/invoices/InvoiceFormCalculations.tsx`
  - Display subtotal (sum of line items)
  - Tax rate input (percentage)
  - Discount input with type toggle (percentage/fixed)
  - Display calculated: discount amount, tax amount, grand total
  - All calculations update in real-time

- [x] Create `/client/src/components/invoices/ClientSelector.tsx`
  - Dropdown with search
  - "Create New Client" quick action button
  - Opens ClientDialog inline
  - Auto-selects newly created client

#### 3.2 Main Form Implementation
- [x] Create `/client/src/pages/CreateInvoice.tsx`
  - Page layout with navigation
  - Form structure with sections:
    * Client selection
    * Invoice metadata (number, dates)
    * Line items (dynamic array)
    * Calculations section
    * Notes and payment terms
    * Action buttons

#### 3.3 State Management
- [x] Set up form state
  - Client ID (number | null)
  - Invoice number (string, read-only from API)
  - Issue date (Date)
  - Due date (Date)
  - Line items array: `{ id: string, description: string, quantity: number, rate: number }`
  - Tax rate (number, default 0)
  - Discount type ('percentage' | 'fixed')
  - Discount value (number, default 0)
  - Notes (string)
  - Payment terms (string)

- [x] Implement line item operations
  - Add line item (push new item with temp ID)
  - Remove line item (filter by ID)
  - Update line item (map and replace)
  - Initialize with 1 empty line item

#### 3.4 Calculations Logic
- [x] Implement `calculateSubtotal(lineItems)`
  - Sum all line item amounts
  - Return number with 2 decimal precision

- [x] Implement `calculateDiscount(subtotal, type, value)`
  - If percentage: `subtotal * (value / 100)`
  - If fixed: `value`
  - Return discount amount

- [x] Implement `calculateTax(amountAfterDiscount, taxRate)`
  - `amountAfterDiscount * (taxRate / 100)`
  - Return tax amount

- [x] Implement `calculateTotal(subtotal, discount, tax)`
  - `subtotal - discount + tax`
  - Return grand total

- [x] Wire calculations to update on any input change
  - Use `useMemo` for performance
  - Recalculate on: line items, tax rate, discount type/value changes

#### 3.5 API Integration
- [x] Fetch next invoice number on mount
  - `trpc.invoices.getNextNumber.useQuery()`
  - Display in read-only field

- [x] Fetch clients list for dropdown
  - `trpc.clients.list.useQuery()`
  - Format for select component

- [x] Implement create invoice mutation
  - `trpc.invoices.create.useMutation()`
  - Transform form state to API format
  - Handle success: redirect to invoice view
  - Handle error: show toast

#### 3.6 Form Validation
- [x] Implement validation rules
  - Client ID: required
  - Invoice number: required (auto-filled)
  - Issue date: required, cannot be future
  - Due date: required, must be >= issue date
  - Line items: at least 1 item required
  - Line item description: required, non-empty
  - Line item quantity: required, > 0
  - Line item rate: required, >= 0
  - Tax rate: >= 0, <= 100
  - Discount value: >= 0

- [x] Show validation errors
  - Inline error messages under fields
  - Prevent submit if validation fails
  - Highlight invalid fields

#### 3.7 User Experience
- [x] Add "Save as Draft" button
  - Set status to 'draft'
  - Save and redirect

- [x] Add "Save and Send" button
  - Set status to 'sent'
  - Save, send email, redirect
  - Show loading state

- [x] Add loading states
  - Disable form during save
  - Show spinner on buttons
  - Disable all inputs

- [ ] Add empty states
  - "No clients yet" → link to create client
  - Guide user through first invoice

---

### Phase 4: View Invoice Page
**Goal:** Display invoice details with all actions (PDF, email, payment link, etc.)

#### 4.1 Component Structure
- [ ] Create `/client/src/components/invoices/InvoiceHeader.tsx`
  - Invoice number, status badge
  - Issue date, due date
  - Action buttons row

- [ ] Create `/client/src/components/invoices/InvoiceClientInfo.tsx`
  - Client name, email, phone, address
  - Company name if available

- [ ] Create `/client/src/components/invoices/InvoiceLineItemsTable.tsx`
  - Read-only table of line items
  - Columns: Description, Quantity, Rate, Amount
  - Footer with subtotal

- [ ] Create `/client/src/components/invoices/InvoiceTotals.tsx`
  - Subtotal
  - Discount (if any)
  - Tax
  - Grand total (emphasized)

#### 4.2 Main Page Implementation
- [ ] Create `/client/src/pages/ViewInvoice.tsx`
  - Get invoice ID from URL params
  - Fetch invoice data with client and line items
  - Layout with sections:
    * Header with actions
    * Client info
    * Line items table
    * Totals
    * Notes and payment terms
    * Payment link (if exists)
    * Email history

#### 4.3 Actions Implementation
- [ ] Edit button
  - Navigate to `/invoices/:id/edit`

- [ ] Download PDF button
  - Call `generatePDF` mutation
  - Open PDF in new tab
  - Show loading spinner

- [ ] Send Email button
  - Call `sendEmail` mutation
  - Show success toast
  - Refresh invoice data

- [ ] Create Payment Link button
  - Only show if no link exists
  - Call `createPaymentLink` mutation
  - Copy link to clipboard
  - Show success toast

- [ ] Send Reminder button
  - Only show if status is 'sent' or 'overdue'
  - Call `sendReminder` mutation
  - Show success toast

- [ ] Mark as Paid button
  - Only show if status is 'sent' or 'overdue'
  - Update status to 'paid'
  - Show success toast

- [ ] Delete button
  - Show confirmation dialog
  - Call `delete` mutation
  - Redirect to invoices list

#### 4.4 Display Logic
- [ ] Handle loading state
  - Show skeleton loader

- [ ] Handle not found
  - Show 404 message
  - Link back to invoices list

- [ ] Handle error state
  - Show error message
  - Retry button

- [ ] Format all currency values
  - Use `formatCurrency` helper

- [ ] Format all dates
  - Use `formatDate` helper

---

### Phase 5: Edit Invoice Page
**Goal:** Reuse create form with pre-populated data

#### 5.1 Component Reuse Strategy
- [ ] Extract form logic into shared component
  - Create `/client/src/components/invoices/InvoiceForm.tsx`
  - Accept props: `initialData`, `onSubmit`, `submitLabel`
  - Handle both create and edit modes

- [ ] Refactor CreateInvoice.tsx
  - Use shared InvoiceForm component
  - Pass empty initialData
  - Pass create mutation

#### 5.2 Edit Page Implementation
- [ ] Create `/client/src/pages/EditInvoice.tsx`
  - Get invoice ID from URL params
  - Fetch invoice data
  - Transform API data to form format
  - Use shared InvoiceForm component
  - Pass update mutation

#### 5.3 Update Logic
- [ ] Implement update mutation handler
  - Delete existing line items
  - Create new line items
  - Update invoice record
  - Recalculate totals
  - Handle success: redirect to view page
  - Handle error: show toast

---

### Phase 6: Analytics Page
**Goal:** Display revenue metrics and charts

#### 6.1 Install Dependencies
- [ ] Install recharts
  - `pnpm add recharts`

#### 6.2 Component Structure
- [ ] Create `/client/src/components/analytics/StatCard.tsx`
  - Reusable card for metrics
  - Props: title, value, icon, trend (optional)

- [ ] Create `/client/src/components/analytics/MonthlyRevenueChart.tsx`
  - Bar chart or line chart
  - X-axis: months
  - Y-axis: revenue
  - Tooltip with formatted currency

- [ ] Create `/client/src/components/analytics/StatusBreakdownChart.tsx`
  - Pie chart or donut chart
  - Show count by status
  - Color-coded by status

- [ ] Create `/client/src/components/analytics/TopClientsTable.tsx`
  - Table of top 5-10 clients
  - Columns: Client name, Total paid
  - Sorted by total descending

#### 6.3 Main Page Implementation
- [ ] Create `/client/src/pages/Analytics.tsx`
  - Fetch analytics stats
  - Fetch monthly revenue data
  - Layout with sections:
    * Overview cards (4-6 metrics)
    * Monthly revenue chart
    * Status breakdown chart
    * Top clients table

#### 6.4 Data Fetching
- [ ] Fetch stats
  - `trpc.analytics.getStats.useQuery()`
  - Returns: total revenue, outstanding, paid count, overdue count, etc.

- [ ] Fetch monthly revenue
  - `trpc.analytics.getMonthlyRevenue.useQuery({ months: 12 })`
  - Returns array of: `{ month: string, revenue: number }`

#### 6.5 Empty States
- [ ] Handle no data
  - Show message: "No data yet"
  - Link to create first invoice

---

### Phase 7: Settings Page
**Goal:** User profile, company info, logo upload

#### 7.1 Component Structure
- [ ] Create `/client/src/components/settings/ProfileSection.tsx`
  - Form: name, email (read-only)
  - Save button

- [ ] Create `/client/src/components/settings/CompanySection.tsx`
  - Form: company name, address, phone
  - Save button

- [ ] Create `/client/src/components/settings/LogoSection.tsx`
  - Current logo preview
  - File input
  - Upload button
  - Loading state during upload

#### 7.2 Main Page Implementation
- [ ] Create `/client/src/pages/Settings.tsx`
  - Fetch user profile
  - Layout with tabs or sections:
    * Profile
    * Company
    * Logo
    * Account (logout, subscription link)

#### 7.3 Profile Update
- [ ] Implement profile form
  - Pre-fill with current data
  - Call `updateProfile` mutation
  - Show success toast

#### 7.4 Company Update
- [ ] Implement company form
  - Pre-fill with current data
  - Call `updateProfile` mutation (same endpoint)
  - Show success toast

#### 7.5 Logo Upload
- [ ] Implement file upload
  - Accept image files only
  - Max size: 2MB
  - Convert to base64
  - Call `uploadLogo` mutation
  - Show preview immediately
  - Show success toast

#### 7.6 Account Actions
- [ ] Add logout button
  - Call `logout` mutation
  - Redirect to login

- [ ] Add subscription link
  - Navigate to `/subscription`

---

### Phase 8: Subscription Page
**Goal:** Display plan, usage, upgrade/manage subscription

#### 8.1 Component Structure
- [ ] Create `/client/src/components/subscription/PlanCard.tsx`
  - Display plan name (Free/Pro)
  - Features list
  - Price
  - Status badge

- [ ] Create `/client/src/components/subscription/UsageStats.tsx`
  - Invoices created this month
  - Limit for free tier (3/month)
  - Progress bar

#### 8.2 Main Page Implementation
- [ ] Create `/client/src/pages/Subscription.tsx`
  - Fetch subscription status
  - Layout with sections:
    * Current plan card
    * Usage stats
    * Upgrade section (if Free)
    * Manage section (if Pro)

#### 8.3 Free Tier Display
- [ ] Show current plan: Free
- [ ] Show usage: X/3 invoices this month
- [ ] Show Pro features list
- [ ] Show "Upgrade to Pro" button
  - Price: $12/month
  - Call `createCheckout` mutation
  - Redirect to Stripe

#### 8.4 Pro Tier Display
- [ ] Show current plan: Pro
- [ ] Show status: Active
- [ ] Show next billing date
- [ ] Show "Manage Subscription" button
  - Call `createPortalSession` mutation
  - Redirect to Stripe portal

---

### Phase 9: Polish & Responsive Design
**Goal:** Improve UX, add responsive design, error handling

#### 9.1 Toast Notifications
- [ ] Add success toasts to all mutations
  - Client created/updated/deleted
  - Invoice created/updated/deleted
  - Email sent
  - PDF generated
  - Payment link created
  - Profile updated
  - Logo uploaded

- [ ] Add error toasts to all mutations
  - Show error message from API
  - Fallback to generic message

#### 9.2 Loading States
- [ ] Add button loading states
  - Disable button during mutation
  - Show spinner icon
  - Change text to "Loading..." or "Saving..."

- [ ] Add page loading states
  - Skeleton loaders for tables
  - Skeleton loaders for cards
  - Spinner for full-page loads

#### 9.3 Form Validation UI
- [ ] Add inline error messages
  - Red text under invalid fields
  - Show on blur or submit

- [ ] Add field highlighting
  - Red border on invalid fields

- [ ] Add form-level error summary
  - List all errors at top of form

#### 9.4 Empty States
- [ ] Add empty states to all lists
  - No clients yet
  - No invoices yet
  - No data in analytics
  - Helpful message + CTA button

#### 9.5 Responsive Design
- [ ] Mobile navigation
  - Hamburger menu for small screens
  - Drawer or dropdown menu

- [ ] Responsive tables
  - Stack columns on mobile
  - Card view instead of table
  - Horizontal scroll as fallback

- [ ] Responsive forms
  - Stack fields vertically on mobile
  - Full-width inputs

- [ ] Responsive charts
  - Adjust size for mobile
  - Simplify tooltips

#### 9.6 Accessibility
- [ ] Add ARIA labels
  - Buttons, links, form fields

- [ ] Keyboard navigation
  - Tab order
  - Enter to submit forms
  - Escape to close dialogs

- [ ] Focus management
  - Visible focus rings
  - Focus trap in modals

---

### Phase 10: Testing & Final Checkpoint
**Goal:** Test all features, fix bugs, create final checkpoint

#### 10.1 Manual Testing Checklist
- [ ] Test: Create client
- [ ] Test: Edit client
- [ ] Test: Delete client
- [ ] Test: Search clients
- [ ] Test: Create invoice (draft)
- [ ] Test: Create invoice (sent)
- [ ] Test: Edit invoice
- [ ] Test: Delete invoice
- [ ] Test: Filter invoices by status
- [ ] Test: Search invoices
- [ ] Test: Download PDF
- [ ] Test: Send email
- [ ] Test: Create payment link
- [ ] Test: Mark as paid
- [ ] Test: View analytics
- [ ] Test: Update profile
- [ ] Test: Update company info
- [ ] Test: Upload logo
- [ ] Test: View subscription
- [ ] Test: Upgrade flow (don't complete payment)

#### 10.2 Edge Cases Testing
- [ ] Test: Create invoice with no clients
- [ ] Test: Create invoice with 0 line items
- [ ] Test: Create invoice with negative values
- [ ] Test: Edit invoice that doesn't exist
- [ ] Test: Delete invoice twice
- [ ] Test: Upload logo > 2MB
- [ ] Test: Upload non-image file as logo
- [ ] Test: Network error during save

#### 10.3 Responsive Testing
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1920px)
- [ ] Test navigation on mobile
- [ ] Test forms on mobile
- [ ] Test tables on mobile

#### 10.4 Browser Testing
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

#### 10.5 Bug Fixes
- [ ] Fix any bugs found during testing
- [ ] Document any known issues

#### 10.6 Code Cleanup
- [ ] Remove console.logs
- [ ] Remove commented code
- [ ] Fix TypeScript errors
- [ ] Fix ESLint warnings

#### 10.7 Documentation
- [ ] Update README.md with final status
- [ ] Document any setup steps
- [ ] Document known limitations

#### 10.8 Final Checkpoint
- [ ] Create checkpoint with all features complete
- [ ] Test checkpoint restore
- [ ] Verify deployed version works

---

## 📊 Progress Tracker

**Completed:** 2/10 phases (20%)
**Remaining:** 8/10 phases (80%)

**Estimated Time Remaining:** 15-20 hours

---

## 🎯 Current Focus

**Next Task:** Phase 3.1 - Create LineItemRow component

**Status:** Ready to start implementation


### Phase 4: View Invoice Page (Complete ✅)
- [x] Create `/client/src/pages/ViewInvoice.tsx`
- [x] Fetch invoice with line items and client data
- [x] Display invoice details (client info, dates, status)
- [x] Display line items table
- [x] Display calculations (subtotal, discount, tax, total)
- [x] Display notes and payment terms
- [x] Add Edit button (navigate to edit page)
- [x] Add Download PDF button (generate and download)
- [x] Add Send Email button (send invoice to client)
- [x] Add Create Payment Link button (Stripe integration)
- [x] Add Mark as Paid button (for sent/overdue invoices)
- [x] Add Delete button (with confirmation)
- [x] Add loading and error states
- [x] Add back navigation


### Phase 5: Edit Invoice Page (Complete ✅)
- [x] Create `/client/src/pages/EditInvoice.tsx`
- [x] Fetch existing invoice data
- [x] Pre-populate form with existing data
- [x] Reuse CreateInvoice components (LineItemRow, InvoiceFormCalculations, ClientSelector)
- [x] Implement update mutation
- [x] Handle form validation
- [x] Add loading states
- [x] Redirect to view page on success


### Phase 6: Analytics Page (Complete ✅)
- [x] Create `/client/src/pages/Analytics.tsx`
- [x] Add getAnalytics API endpoint
- [x] Add getInvoiceStatusBreakdown to db.ts
- [x] Display key metrics (revenue, outstanding, invoices, average value)
- [x] Add time range selector (7d, 30d, 90d, 1y)
- [x] Implement revenue over time line chart
- [x] Implement invoice status pie chart
- [x] Implement invoice volume bar chart
- [x] Add loading and empty states


### Phase 7: Settings Page (Complete ✅)
- [x] Create `/client/src/pages/Settings.tsx`
- [x] Display personal information (name, email)
- [x] Add company information form (name, address, phone)
- [x] Implement logo upload with preview
- [x] Add save profile mutation
- [x] Add upload logo mutation
- [x] Add logout button
- [x] Add loading states


### Phase 8: Subscription Page (Complete ✅)
- [x] Create `/client/src/pages/Subscription.tsx`
- [x] Display current subscription status
- [x] Show Free and Pro plan comparison
- [x] Implement upgrade button (Stripe Checkout)
- [x] Implement manage billing button (Stripe Customer Portal)
- [x] Add FAQ section
- [x] Add loading states


### Phase 9: Polish & Responsive Design (Complete ✅)
- [x] All pages have consistent navigation
- [x] Loading states implemented throughout
- [x] Error handling with toast notifications
- [x] Empty states with helpful CTAs
- [x] Responsive grid layouts (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- [x] Mobile-friendly navigation
- [x] Consistent color scheme and typography
- [x] Professional UI with shadcn/ui components


### Phase 10: Testing & Final Checkpoint (Complete ✅)
- [x] Write vitest tests for client operations
- [x] Write vitest tests for invoice operations
- [x] Run all tests and ensure they pass
- [x] Create final checkpoint
