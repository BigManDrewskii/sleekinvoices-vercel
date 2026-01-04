# Next Steps - Invoice Generator Implementation Guide

## 🎯 Current Status

**Backend: 100% Complete** ✅
- Full database schema with all tables
- Complete tRPC API for all operations
- Stripe integration (payments + subscriptions)
- PDF generation with professional templates
- Email sending (invoices + reminders)
- Analytics queries ready

**Frontend: 30% Complete** ⏳
- Landing page ✅
- Dashboard with stats ✅
- Navigation structure ✅
- Routing setup ✅
- Stub pages created (need implementation)

## 📝 Implementation Roadmap

### Phase 1: Clients Management (2-3 hours)

**File:** `client/src/pages/Clients.tsx`

**Features to implement:**
1. List all clients in a table/grid
2. Search/filter clients
3. "Add Client" button → modal/form
4. Edit client (inline or modal)
5. Delete client with confirmation
6. Link to view client's invoices

**API calls available:**
```typescript
trpc.clients.list.useQuery()
trpc.clients.create.useMutation()
trpc.clients.update.useMutation()
trpc.clients.delete.useMutation()
```

**UI Components to use:**
- `Table` from shadcn/ui
- `Dialog` for create/edit modals
- `Button` for actions
- `Input` for search
- `AlertDialog` for delete confirmation

---

### Phase 2: Invoices List (2-3 hours)

**File:** `client/src/pages/Invoices.tsx`

**Features to implement:**
1. Table view of all invoices
2. Status filter (All, Draft, Sent, Paid, Overdue)
3. Date range filter
4. Search by invoice number or client name
5. Quick actions per row:
   - View invoice
   - Edit invoice
   - Download PDF
   - Send email
   - Create payment link
6. Status badges with colors
7. Pagination or infinite scroll

**API calls available:**
```typescript
trpc.invoices.list.useQuery()
trpc.invoices.delete.useMutation()
trpc.invoices.generatePDF.useMutation()
trpc.invoices.sendEmail.useMutation()
trpc.invoices.createPaymentLink.useMutation()
```

---

### Phase 3: Create Invoice (3-4 hours)

**File:** `client/src/pages/CreateInvoice.tsx`

**Features to implement:**
1. Client selection dropdown (with "Add New Client" option)
2. Invoice number (auto-generated, display only)
3. Issue date picker
4. Due date picker
5. **Dynamic line items:**
   - Description, Quantity, Rate inputs
   - Auto-calculate Amount
   - Add/Remove row buttons
   - Drag to reorder (optional)
6. Tax rate input (percentage)
7. Discount input (percentage or fixed)
8. **Auto-calculated totals:**
   - Subtotal
   - Discount amount
   - Tax amount
   - Grand total
9. Notes textarea
10. Payment terms textarea
11. Actions:
    - Save as Draft
    - Save and Send Email
12. Form validation

**API calls:**
```typescript
trpc.clients.list.useQuery() // For client dropdown
trpc.invoices.getNextNumber.useQuery() // For invoice number
trpc.invoices.create.useMutation()
```

**Key implementation details:**
- Use `useState` to manage line items array
- Recalculate totals on every change
- Validate required fields before submit
- Show loading state during save
- Toast notification on success/error

---

### Phase 4: View Invoice (2-3 hours)

**File:** `client/src/pages/ViewInvoice.tsx`

**Features to implement:**
1. Display invoice details in a clean layout:
   - Invoice number, dates, status
   - Client information
   - Line items table
   - Totals breakdown
   - Notes and payment terms
2. **Action buttons:**
   - Edit Invoice
   - Download PDF
   - Send Email
   - Create Payment Link (if not exists)
   - Send Reminder (if sent/overdue)
   - Mark as Paid (if sent/overdue)
   - Delete Invoice
3. Show payment link if exists
4. Display email history
5. Status badge

**API calls:**
```typescript
trpc.invoices.get.useQuery({ id })
trpc.invoices.generatePDF.useMutation()
trpc.invoices.sendEmail.useMutation()
trpc.invoices.createPaymentLink.useMutation()
trpc.invoices.sendReminder.useMutation()
trpc.invoices.update.useMutation() // For status change
trpc.invoices.delete.useMutation()
```

---

### Phase 5: Edit Invoice (2 hours)

**File:** `client/src/pages/EditInvoice.tsx`

**Implementation:**
- Reuse the CreateInvoice form component
- Pre-populate with existing invoice data
- Use `trpc.invoices.get.useQuery()` to fetch data
- Use `trpc.invoices.update.useMutation()` to save
- Handle line items properly (delete old, create new)

---

### Phase 6: Analytics Dashboard (2-3 hours)

**File:** `client/src/pages/Analytics.tsx`

**Features to implement:**
1. **Overview cards:**
   - Total revenue
   - Outstanding balance
   - Total invoices
   - Paid invoices
   - Overdue invoices
2. **Monthly revenue chart:**
   - Use Recharts library
   - Bar or line chart
   - Last 6-12 months
3. **Invoice status breakdown:**
   - Pie chart or donut chart
   - Draft, Sent, Paid, Overdue counts
4. **Top clients by revenue:**
   - Table or list
   - Client name + total paid
5. **Recent activity:**
   - Latest invoices
   - Recent payments

**API calls:**
```typescript
trpc.analytics.getStats.useQuery()
trpc.analytics.getMonthlyRevenue.useQuery({ months: 12 })
trpc.invoices.list.useQuery() // For additional analysis
```

**Install Recharts:**
```bash
pnpm add recharts
```

---

### Phase 7: Settings Page (2-3 hours)

**File:** `client/src/pages/Settings.tsx`

**Features to implement:**
1. **Profile section:**
   - Name input
   - Email (display only)
   - Save button
2. **Company information:**
   - Company name
   - Address (textarea)
   - Phone number
   - Save button
3. **Logo upload:**
   - File input (accept images)
   - Preview current logo
   - Upload button
   - Convert to base64 before sending
4. **Account section:**
   - Current subscription status
   - Link to subscription page
   - Logout button

**API calls:**
```typescript
trpc.user.getProfile.useQuery()
trpc.user.updateProfile.useMutation()
trpc.user.uploadLogo.useMutation()
trpc.auth.logout.useMutation()
```

**Logo upload implementation:**
```typescript
const handleLogoUpload = async (file: File) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target?.result as string;
    const base64Data = base64.split(',')[1]; // Remove data:image/png;base64,
    await uploadLogo.mutateAsync({
      base64Data,
      mimeType: file.type,
    });
  };
  reader.readAsDataURL(file);
};
```

---

### Phase 8: Subscription Page (1-2 hours)

**File:** `client/src/pages/Subscription.tsx`

**Features to implement:**
1. **Current plan display:**
   - Free or Pro
   - Status badge
   - Current period end date (if Pro)
2. **Usage stats:**
   - Invoices created this month
   - Limit for free tier (3/month)
3. **Upgrade section (if Free):**
   - Pro features list
   - Price: $12/month
   - "Upgrade to Pro" button
4. **Manage subscription (if Pro):**
   - "Manage Subscription" button → Stripe Customer Portal
   - Cancel, update payment method, etc.

**API calls:**
```typescript
trpc.subscription.getStatus.useQuery()
trpc.subscription.createCheckout.useMutation() // Returns Stripe URL
trpc.subscription.createPortalSession.useMutation() // Returns portal URL
```

**Implementation:**
```typescript
const handleUpgrade = async () => {
  const { url } = await createCheckout.mutateAsync();
  window.location.href = url; // Redirect to Stripe
};

const handleManage = async () => {
  const { url } = await createPortal.mutateAsync();
  window.location.href = url; // Redirect to Stripe portal
};
```

---

### Phase 9: Polish & Error Handling (2-3 hours)

**Global improvements:**

1. **Toast notifications:**
   - Success: "Invoice created successfully"
   - Error: "Failed to send email. Please try again."
   - Use `toast` from `sonner`

2. **Loading states:**
   - Buttons: `disabled` + spinner during mutation
   - Pages: Skeleton loaders
   - Tables: Loading rows

3. **Form validation:**
   - Required fields
   - Email format
   - Number validation
   - Date validation
   - Show error messages

4. **Empty states:**
   - No clients yet
   - No invoices yet
   - No data in analytics
   - Helpful CTAs

5. **Responsive design:**
   - Mobile navigation (hamburger menu)
   - Responsive tables (stack on mobile)
   - Touch-friendly buttons
   - Proper spacing on small screens

6. **Error boundaries:**
   - Already have `ErrorBoundary` in App.tsx
   - Add error handling in API calls

---

### Phase 10: Testing (2-3 hours)

**Backend tests:**
- Already have `server/auth.logout.test.ts` as example
- Add tests for critical operations:
  - Invoice creation with calculations
  - Client CRUD operations
  - PDF generation
  - Email sending

**Manual testing checklist:**
- [ ] Create client
- [ ] Edit client
- [ ] Delete client
- [ ] Create invoice (draft)
- [ ] Edit invoice
- [ ] Send invoice email
- [ ] Generate PDF
- [ ] Create payment link
- [ ] Mark invoice as paid
- [ ] View analytics
- [ ] Update profile
- [ ] Upload logo
- [ ] Upgrade subscription
- [ ] Test on mobile
- [ ] Test in different browsers

---

## 🎨 Design Guidelines

**Colors:**
- Primary actions: Blue (`bg-primary`)
- Success: Green (`bg-green-600`)
- Warning: Orange (`bg-orange-600`)
- Danger: Red (`bg-red-600`)
- Neutral: Gray (`bg-gray-100`)

**Status badges:**
- Draft: Gray
- Sent: Blue
- Paid: Green
- Overdue: Red
- Canceled: Gray (muted)

**Spacing:**
- Page padding: `p-8`
- Card padding: `p-6`
- Section gaps: `gap-6` or `gap-8`
- Form field gaps: `gap-4`

**Typography:**
- Page titles: `text-3xl font-bold`
- Section titles: `text-xl font-semibold`
- Card titles: `text-lg font-semibold`
- Body text: `text-sm` or default
- Muted text: `text-muted-foreground`

---

## 🔧 Useful Code Snippets

### Status Badge Component
```typescript
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium status-${status}`}>
      {status.toUpperCase()}
    </span>
  );
}
```

### Currency Formatter
```typescript
function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}
```

### Date Formatter
```typescript
function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}
```

### Toast Notifications
```typescript
import { toast } from 'sonner';

// Success
toast.success('Invoice created successfully');

// Error
toast.error('Failed to send email');

// Loading
const toastId = toast.loading('Sending email...');
// Later...
toast.success('Email sent!', { id: toastId });
```

---

## 📦 Additional Dependencies Needed

```bash
# For charts
pnpm add recharts

# Already installed:
# - stripe, @stripe/stripe-js
# - puppeteer
# - resend
# - All shadcn/ui components
```

---

## 🚀 Quick Tips

1. **Start with the data flow:**
   - Fetch data with `useQuery`
   - Display in UI
   - Add mutations for actions
   - Handle loading/error states

2. **Reuse components:**
   - Create shared components for repeated UI
   - Example: InvoiceTable, ClientCard, StatusBadge

3. **Test as you go:**
   - Test each page after implementing
   - Don't wait until the end

4. **Use the template README:**
   - Follow the "Frontend Workflow" section
   - Use shadcn/ui components
   - Follow the design system

5. **Optimistic updates:**
   - For instant feedback on list operations
   - See template README for pattern

---

## 📚 Resources

- **tRPC Docs:** https://trpc.io/docs
- **shadcn/ui:** https://ui.shadcn.com/
- **Recharts:** https://recharts.org/
- **Stripe Docs:** https://stripe.com/docs
- **Template README:** `/home/ubuntu/invoice-generator/README.md`

---

## ⏱️ Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Clients Management | 2-3h |
| 2 | Invoices List | 2-3h |
| 3 | Create Invoice | 3-4h |
| 4 | View Invoice | 2-3h |
| 5 | Edit Invoice | 2h |
| 6 | Analytics | 2-3h |
| 7 | Settings | 2-3h |
| 8 | Subscription | 1-2h |
| 9 | Polish & Error Handling | 2-3h |
| 10 | Testing | 2-3h |
| **Total** | | **20-29 hours** |

**Realistic completion:** 3-4 full days of focused work

---

## ✅ Success Criteria

Before considering the project complete:

- [ ] All CRUD operations working
- [ ] Invoice creation with line items functional
- [ ] PDF generation working
- [ ] Email sending working
- [ ] Stripe payment links working
- [ ] Analytics displaying correctly
- [ ] Settings page functional
- [ ] Subscription flow working
- [ ] Mobile responsive
- [ ] No console errors
- [ ] All tests passing
- [ ] Deployed and accessible

---

**You've got a solid foundation. The hard backend work is done. Now it's just connecting the dots in the UI. Ship it! 🚀**
