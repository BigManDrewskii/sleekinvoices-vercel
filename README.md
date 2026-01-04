# SleekInvoices - Professional Invoice Generator

A modern, elegant invoice generator built to compete with FreshBooks, offering 80% cost savings with superior UX.

## 🎯 Project Vision

**Goal:** Create a cheaper, faster, more elegant alternative to FreshBooks for freelancers and small businesses.

**Target Pricing:**
- Free: 3 invoices/month
- Pro: $12/month (vs. FreshBooks $15-65/month)

**Competitive Advantages:**
- 80% cheaper than FreshBooks
- Native Stripe integration (no separate accounts)
- Modern, fast, elegant UI
- Simple and focused (no bloat)
- Easy cancellation (no lock-in)

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript + TailwindCSS 4
- **Backend:** Express + tRPC 11 + Drizzle ORM
- **Database:** MySQL/TiDB
- **Payments:** Stripe (payment links + subscriptions)
- **PDF:** Puppeteer
- **Email:** Resend
- **Storage:** S3 (for PDFs and logos)
- **Auth:** Manus OAuth

### Database Schema

**Tables:**
- `users` - User accounts with company info and subscription status
- `clients` - Client database for invoice recipients
- `invoices` - Invoice records with financial calculations
- `invoiceLineItems` - Line items for each invoice
- `emailLog` - Email sending history

**Key Features:**
- Auto-incrementing invoice numbers
- Tax and discount calculations
- Status tracking (draft, sent, paid, overdue, canceled)
- Stripe payment link integration
- Email tracking

## ✅ What's Implemented

### Backend (100% Complete)

**Database Layer (`server/db.ts`):**
- ✅ User management (upsert, get by ID/OpenID)
- ✅ Client CRUD operations
- ✅ Invoice CRUD operations
- ✅ Line item management
- ✅ Analytics queries (stats, monthly revenue)
- ✅ Email logging

**API Layer (`server/routers.ts`):**
- ✅ Auth routes (me, logout)
- ✅ User routes (profile, update, logo upload)
- ✅ Client routes (list, get, create, update, delete)
- ✅ Invoice routes (list, get, create, update, delete, generate PDF, create payment link, send email, send reminder)
- ✅ Analytics routes (stats, monthly revenue)
- ✅ Subscription routes (status, create checkout, customer portal)

**Utilities:**
- ✅ Stripe integration (`server/stripe.ts`) - Payment links, subscriptions, customer portal
- ✅ PDF generation (`server/pdf.ts`) - Professional invoice templates
- ✅ Email sending (`server/email.ts`) - Invoice emails and payment reminders

### Frontend (30% Complete)

**Completed:**
- ✅ Landing page with pricing
- ✅ Dashboard with stats and recent invoices
- ✅ Navigation structure
- ✅ Routing setup
- ✅ Theme system (light/dark)
- ✅ Status badge styles

**Stub Pages (Need Implementation):**
- ⏳ Clients page (list, create, edit, delete)
- ⏳ Invoices page (list with filters)
- ⏳ Create Invoice page (form with line items)
- ⏳ Edit Invoice page
- ⏳ View Invoice page (with actions: PDF, email, payment link)
- ⏳ Analytics page (charts and metrics)
- ⏳ Settings page (profile, company info, logo)
- ⏳ Subscription page (upgrade, manage)

## 📋 Next Steps

### Phase 1: Core Invoice Management (4-6 hours)

**1. Clients Page**
- List all clients with search
- Create/edit client modal
- Delete confirmation
- Link to client's invoices

**2. Invoices List Page**
- Table view with filters (status, date range)
- Search by invoice number or client
- Quick actions (view, edit, delete, send)
- Status badges

**3. Create Invoice Page**
- Client selection (with "Create New" option)
- Dynamic line items (add/remove rows)
- Tax rate input (percentage)
- Discount input (percentage or fixed)
- Auto-calculation of totals
- Notes and payment terms
- Save as draft or send immediately

**4. View Invoice Page**
- Display invoice details
- Actions: Download PDF, Send Email, Create Payment Link, Send Reminder
- Show payment status
- Display email history
- Edit and delete options

**5. Edit Invoice Page**
- Reuse create invoice form
- Pre-populate with existing data
- Update calculations on change

### Phase 2: Analytics & Settings (2-3 hours)

**6. Analytics Page**
- Revenue overview cards
- Monthly revenue chart (using Recharts)
- Invoice status breakdown
- Top clients by revenue
- Overdue invoices list

**7. Settings Page**
- Profile section (name, email)
- Company info (name, address, phone)
- Logo upload (with preview)
- Branding customization
- Account deletion

**8. Subscription Page**
- Current plan display
- Usage stats (invoices this month)
- Upgrade to Pro button
- Manage subscription (customer portal link)
- Billing history

### Phase 3: Polish & Testing (2-3 hours)

**9. Error Handling**
- Toast notifications for all actions
- Form validation with error messages
- Loading states for all async operations
- Empty states with helpful CTAs

**10. Responsive Design**
- Mobile navigation (hamburger menu)
- Responsive tables (card view on mobile)
- Touch-friendly buttons and forms

**11. Testing**
- Unit tests for critical backend functions
- Integration tests for invoice creation flow
- Manual testing of all features
- Cross-browser testing

**12. Documentation**
- User guide
- API documentation
- Deployment instructions

## 🚀 Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Start dev server
pnpm dev
```

### Environment Variables

Required secrets (already configured):
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `RESEND_API_KEY` - Resend email API key (optional, for email sending)

System-provided:
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - OAuth app ID
- `OAUTH_SERVER_URL` - OAuth backend URL

### Testing

```bash
# Run tests
pnpm test

# Type checking
pnpm check
```

## 📁 Project Structure

```
invoice-generator/
├── client/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/            # Utilities (tRPC client)
│   │   ├── App.tsx         # Routes
│   │   └── index.css       # Global styles
│   └── public/             # Static assets
├── server/
│   ├── routers.ts          # tRPC API routes
│   ├── db.ts               # Database queries
│   ├── stripe.ts           # Stripe integration
│   ├── pdf.ts              # PDF generation
│   ├── email.ts            # Email sending
│   └── _core/              # Framework code
├── drizzle/
│   └── schema.ts           # Database schema
├── shared/                 # Shared types
└── todo.md                 # Feature tracking
```

## 🎨 Design System

**Colors:**
- Primary: Professional blue (`oklch(50% 0.15 250)`)
- Background: Clean white/dark gray
- Accent: Subtle blues and grays

**Typography:**
- Font: System font stack
- Headings: Bold, tight tracking
- Body: Regular, comfortable line height

**Components:**
- Cards with subtle shadows
- Rounded corners (0.5rem)
- Status badges with semantic colors
- Smooth transitions and animations

## 🔐 Security

- OAuth authentication via Manus
- JWT session cookies (httpOnly, secure)
- SQL injection protection (Drizzle ORM)
- XSS protection (React escaping)
- CSRF protection (SameSite cookies)
- Stripe webhook signature verification

## 📊 Business Model

**Free Tier:**
- 3 invoices per month
- All core features
- Lead generation funnel

**Pro Tier ($12/month):**
- Unlimited invoices
- Unlimited clients
- Stripe payment links
- Auto reminders
- Custom branding
- Priority support

**Revenue Projections:**
- Month 1: 50 users × $12 = $600 MRR
- Month 3: 200 users × $12 = $2,400 MRR
- Month 6: 500 users × $12 = $6,000 MRR
- Month 12: 1,000 users × $12 = $12,000 MRR

## 🎯 Success Metrics

**Product Metrics:**
- Time to first invoice: < 5 minutes
- Invoice send success rate: > 95%
- Payment link conversion: > 30%
- User retention (30-day): > 60%

**Business Metrics:**
- Free to paid conversion: > 10%
- Churn rate: < 5% monthly
- Customer acquisition cost: < $50
- Lifetime value: > $500

## 🚢 Deployment

The app is deployed on Manus platform with:
- Automatic SSL certificates
- Custom domain support
- Zero-downtime deployments
- Automatic backups
- Built-in analytics

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a solo project built to compete in the invoice generator market. Not accepting contributions at this time.

---

**Built with speed and precision to ship fast and win customers.**
