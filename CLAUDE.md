# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
# Install dependencies
pnpm install

# Run development server (auto-restarts on changes)
pnpm dev

# Run type checking
pnpm check

# Format code with Prettier
pnpm format
```

### Database

```bash
# Generate and run migrations
pnpm db:push

# Audit database schema (check for inconsistencies)
pnpm db:audit

# Sync database schema (development)
pnpm db:sync

# Reset user data (careful!)
pnpm db:reset

# Seed database with test data (local dev only)
pnpm seed
```

### Testing

```bash
# Run all tests (vitest)
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/ai/assistant.test.ts
```

### Production

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture Overview

### Tech Stack

- **Frontend**: React 19, TailwindCSS 4, TypeScript, Wouter (routing), React Query
- **Backend**: Express, tRPC 11, Drizzle ORM, node-cron
- **Database**: MySQL (TiDB compatible) with Drizzle ORM
- **Auth**: Manus OAuth with JWT session cookies (bypassed in local dev with SKIP_AUTH=true)
- **Payments**: Stripe + NOWPayments (crypto subscriptions)
- **PDF**: Puppeteer (headless Chrome)
- **Email**: Resend API with delivery tracking webhooks
- **Storage**: S3-compatible API (AWS SDK v3)
- **AI**: OpenRouter API with multiple LLM backends
- **Monitoring**: Sentry (error tracking)
- **Testing**: Vitest
- **Build**: Vite + esbuild

### Project Structure

```
├── client/src/          # React frontend
│   ├── pages/          # Page components (30+ routes)
│   ├── components/     # Reusable UI components (shadcn/ui based)
│   ├── contexts/       # React contexts (AI, Theme, Cookie Consent)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (tRPC client, decimal math, fonts)
│   ├── _core/          # Core hooks and utilities
│   └── App.tsx         # Wouter routes + app shell
├── server/             # Express + tRPC backend
│   ├── _core/          # Framework code (OAuth, context, error monitoring)
│   ├── routers.ts      # tRPC API router definitions
│   ├── db.ts           # Database queries (Drizzle ORM)
│   ├── pdf.ts          # PDF generation (Puppeteer)
│   ├── email.ts        # Email sending (Resend)
│   ├── stripe.ts       # Stripe integration
│   ├── ai/             # AI features (assistant, smart compose)
│   ├── jobs/           # Cron jobs (recurring invoices, reminders)
│   ├── webhooks/       # Webhook handlers (Stripe, Resend, NOWPayments)
│   ├── storage.ts      # S3 file operations
│   └── lib/            # Backend utilities
├── drizzle/            # Database schema and migrations
│   └── schema.ts       # 43+ table definitions with Drizzle
├── shared/             # Shared types between client/server
└── scripts/            # Utility scripts (seeding, schema sync)
```

## Key Architectural Patterns

### 1. tRPC API Architecture

- All API endpoints defined in `server/routers.ts` (single-file router)
- Client calls via `client/src/lib/trpc.ts` (createTRPCReact)
- Use `protectedProcedure` for authenticated routes (requires `ctx.user`)
- Use `publicProcedure` for public routes (landing page, webhooks, client portal)
- Input validation with Zod schemas
- Context creation in `server/_core/context.ts` (handles SKIP_AUTH dev mode)
- Error monitoring via Sentry (`server/_core/errorMonitoring.ts`)

**CRITICAL**: SKIP_AUTH=true will throw in production (security block in context.ts)

### 2. Database Layer

- All queries in `server/db.ts` (no inline SQL in routers)
- Use Drizzle ORM query builder (not raw SQL)
- Schema defined in `drizzle/schema.ts` (43 tables with full type inference)
- Run `pnpm db:push` after schema changes to generate migrations
- Decimal.js for financial calculations (avoid floating point math)
- Connection pooling via mysql2

### 3. Authentication & Authorization Flow

- Production: Manus OAuth with JWT session cookies (httpOnly, secure, SameSite)
- Local Dev: Set `SKIP_AUTH=true` in `.env.local` to auto-authenticate as "dev-user-local"
- Session user available in `ctx.user` for protected procedures
- Frontend gets user from `api.auth.me` query
- CSRF protection via custom header validation (server/_core/csrf.ts)
- Rate limiting: standard (100 req/15min) and strict (20 req/15min) for sensitive routes

### 4. Frontend Patterns

- UI components use shadcn/ui conventions (Radix UI + TailwindCSS)
- State management: React Query via tRPC for server state + Context API for client state
- Forms: react-hook-form with Zod validation
- Routing: Wouter with lazy loading for authenticated pages
- Toasts: Sonner (`toast.success()`, `toast.error()`)
- Theme: next-themes (light/dark with CSS variables)
- Error boundaries: Catch render errors and show fallback UI
- Loading states: Skeleton components for all async data

### 5. Styling System

- TailwindCSS 4 with Vite plugin (automatic CSS scanning)
- Custom theme in `client/src/index.css` with CSS variables
- Dark mode: Automatic via next-themes (prefers-color-scheme)
- Icons: Phosphor Icons (@phosphor-icons/react) - Bold weight for primary actions
- Responsive breakpoints: Mobile first (320px base, 768px tablet, 1024px desktop)
- Utility classes: `card-glow`, `hover-lift`, `stagger-fade-in`, `gradient-text`
- Manual chunk splitting in vite.config.ts for vendor bundles (React, Radix, forms, etc.)

### 6. Invoice Template System

- Templates stored in `invoiceTemplates` table
- Single default template: "Sleek - Default"
- Full customization: colors, fonts (Google Fonts), layout, field visibility
- Live preview in `SleekTemplateEditor.tsx`
- PDF generation uses template settings in `server/pdf.ts`

### 7. AI Features

- AI Assistant: Chat interface with streaming responses, context persistence
- Smart Compose: Extract invoice data from natural language text
- OpenRouter API integration with multiple LLM backends (Gemini, Claude, etc.)
- Lazy-loaded to reduce main bundle size (vendor-ai-markdown chunk)
- Credit-based rate limiting: 5 credits/month free, 50 credits/month pro
- Usage tracking via `aiCredits` and `aiUsageLogs` tables

## Important Implementation Details

### Invoice Number Generation

- Format: `INV-YYYY-####` (e.g., INV-2026-0001)
- Auto-increments per user per year
- Uniqueness enforced in `server/routers.ts` (check before create)

### Subscription System

- Free tier: 3 invoices/month
- Pro tier: Unlimited (Stripe or crypto)
- Usage tracked in `usageTracking` table (month format: YYYY-MM)
- Check limits in invoice creation procedures

### QuickBooks Integration

- Two-way sync: SleekInvoices ↔ QuickBooks
- OAuth flow: Settings → Connect → Callback page
- Auto-sync on invoice create/send/payment
- Mapping tables: `quickbooksCustomerMapping`, `quickbooksInvoiceMapping`
- Manual sync via Settings page

### Email Templates

- Visual editor with variable chips (no HTML knowledge required)
- Variables: `{{invoiceNumber}}`, `{{clientName}}`, `{{amount}}`, etc.
- Templates stored in `reminderSettings` table
- Preview with sample data in Settings

### Crypto Payments (NOWPayments)

- Duration-based subscriptions (1, 3, 6, 12 months)
- Webhook handler: `server/webhooks/nowpayments.ts`
- Payment tracking: `cryptoSubscriptionPayments` table
- Subscription end date in `users.subscriptionEndDate`

### Performance Optimizations

- Code splitting: AI features, charts lazy-loaded
- Manual chunks in `vite.config.ts` for better caching (React, Radix, forms, Stripe, etc.)
- Skeleton loaders for async data
- Pagination on large lists (invoices, clients, payments)
- Image optimization before S3 upload (Sharp)
- Lazy loading for all mascot images

### Background Jobs (Cron)

- Recurring invoice generation (daily check at midnight)
- Overdue invoice detection (daily)
- Payment reminder scheduling (automated based on due dates)
- Initialized in `server/_core/index.ts` via `initializeScheduler()`

### Webhook Handlers

- **Stripe**: Payment events, subscription updates (`server/webhooks/stripe.ts`)
- **Resend**: Email delivery tracking (`server/webhooks/resend.ts`)
- **NOWPayments**: Crypto payment confirmations (`server/webhooks/nowpayments.ts`)
- All webhooks verify signatures before processing

## Common Development Tasks

### Adding a New Page

1. Create component in `client/src/pages/`
2. Add lazy-loaded route in `client/src/App.tsx`
3. Add navigation link in `client/src/components/Navigation.tsx`
4. If authenticated: wrap in lazy(), if public: eager load (Landing, Docs, etc.)

### Adding a New API Endpoint

1. Define procedure in `server/routers.ts`
2. Add database query in `server/db.ts` if needed
3. Call from frontend via `api.yourRouter.yourProcedure.useQuery()`
4. Use `protectedProcedure` if auth required, `publicProcedure` otherwise

### Modifying Database Schema

1. Edit `drizzle/schema.ts`
2. Run `pnpm db:push` to generate migration
3. Update relevant types in `server/db.ts`
4. Update queries and routers

### Adding a New Test

1. Create `*.test.ts` file in `server/`
2. Import vitest: `import { describe, it, expect } from 'vitest'`
3. Run with `pnpm test`

## Local Development Setup

### Quick Start (with Docker)

```bash
# 1. Copy environment file
cp .env.local.example .env.local

# 2. Start MySQL database
docker-compose up -d

# 3. Install dependencies
pnpm install

# 4. Push database schema
pnpm db:push

# 5. Seed with test data
node scripts/seed-local.mjs

# 6. Start dev server
pnpm dev

# 7. Open browser
open http://localhost:5173
```

### Environment Variables

- Required: `DATABASE_URL`, `JWT_SECRET`, `SKIP_AUTH=true`
- Optional: `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `OPENROUTER_API_KEY`
- See `.env.local.example` for full list

### Auth Bypass (Local Dev Only)

Set `SKIP_AUTH=true` in `.env.local` to bypass OAuth and auto-login as dev user.

## Important Implementation Notes

### Decimal Precision for Financial Calculations

- **ALWAYS** use Decimal.js for money math (import Decimal from "decimal.js")
- NEVER use native JavaScript numbers (floating point errors)
- Example: `new Decimal(amount).times(taxRate).toDecimalPlaces(2)`
- All invoice totals, tax calculations, and line item sums use Decimal.js

### Type Safety Standards

- NO `any` without explicit justification comment
- NO `@ts-ignore` or `@ts-expect-error` without explanation
- Prefer `unknown` over `any` when type is truly unknown
- Use explicit return types on exported functions

### Error Handling Patterns

- Always handle promise rejections with try/catch
- Use Error boundaries for React components
- Server errors sent to Sentry for monitoring
- User-facing errors via toast notifications (Sonner)

### Security Checklist

- [ ] Input validation with Zod schemas on all tRPC procedures
- [ ] SQL injection protection via Drizzle ORM (no raw SQL)
- [ ] XSS protection via React escaping + DOMPurify for HTML
- [ ] CSRF protection via custom headers on mutations
- [ ] Rate limiting on sensitive endpoints
- [ ] Webhook signature verification (Stripe, Resend, NOWPayments)
- [ ] httpOnly + secure + SameSite cookies for sessions
- [ ] Never expose API keys in frontend code

## Troubleshooting

### Database Issues

- Check `DATABASE_URL` is correct
- Run `pnpm db:push` after schema changes
- Ensure MySQL is running (Docker: `docker-compose ps`)

### Build Errors

- Run `pnpm check` for TypeScript errors
- Clear `dist/` and rebuild: `rm -rf dist && pnpm build`
- Check for circular dependencies in imports

### Test Failures

- Ensure database is accessible
- Check for stale test data
- Run single test: `pnpm test path/to/test.ts`

### Performance Issues

- Check bundle size: Run `pnpm build` and review chunk sizes
- Use React DevTools Profiler to identify slow renders
- Enable lazy loading for heavy components
- Verify pagination is working on large lists
