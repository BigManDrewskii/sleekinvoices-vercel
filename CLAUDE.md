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
pnpm test server/templates.test.ts
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

- **Frontend**: React 19, TailwindCSS 4, TypeScript, Wouter (routing)
- **Backend**: Express, tRPC 11, Drizzle ORM
- **Database**: MySQL (TiDB compatible)
- **Auth**: Manus OAuth (bypassed in local dev with SKIP_AUTH=true)
- **Payments**: Stripe + NOWPayments (crypto)
- **PDF**: Puppeteer
- **Email**: Resend
- **Storage**: S3 (AWS SDK)
- **AI**: OpenRouter API

### Project Structure

```
├── client/src/          # React frontend
│   ├── pages/          # Page components
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (AI, Onboarding, Theme)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (tRPC, decimal math, fonts, HSL)
│   └── App.tsx         # Routes and app shell
├── server/             # Express + tRPC backend
│   ├── _core/          # Framework code (don't modify)
│   ├── routers.ts      # tRPC API routes
│   ├── db.ts           # Database queries (Drizzle)
│   ├── pdf.ts          # PDF generation (Puppeteer)
│   ├── email.ts        # Email sending (Resend)
│   ├── stripe.ts       # Stripe integration
│   ├── ai/             # AI features (assistant, smart compose)
│   ├── lib/            # Backend utilities
│   └── webhooks/       # Webhook handlers
├── drizzle/            # Database schema and migrations
│   └── schema.ts       # All table definitions
├── shared/             # Shared types between client/server
└── scripts/            # Utility scripts
```

## Key Architectural Patterns

### 1. tRPC API Architecture

- All API endpoints defined in `server/routers.ts`
- Client calls via `@/lib/trpc.ts`
- Use `protectedProcedure` for authenticated routes
- Use `publicProcedure` for public routes (landing, webhooks)
- Input validation with Zod schemas

### 2. Database Layer

- All queries in `server/db.ts` (no inline SQL in routers)
- Use Drizzle ORM query builder (not raw SQL)
- Schema defined in `drizzle/schema.ts`
- Run `pnpm db:push` after schema changes

### 3. Authentication Flow

- Production: Manus OAuth with JWT session cookies
- Local Dev: Set `SKIP_AUTH=true` in `.env.local` to bypass
- Session user available in `ctx.user` for protected procedures
- Frontend gets user from `useQuery(api.auth.me)`

### 4. Frontend Patterns

- UI components use shadcn/ui conventions (in `client/src/components`)
- State management: React Query (tRPC) + Context API
- Forms: react-hook-form with Zod validation
- Routing: Wouter (`<Route path="..." component={...} />`)
- Toasts: Sonner (`toast.success()`, `toast.error()`)
- Theme: next-themes (light/dark with tweakcn color system)

### 5. Styling System

- TailwindCSS 4 with custom theme in `client/src/index.css`
- Design tokens: Uses tweakcn color palette
- Dark mode: Automatic with CSS variables
- Icons: Phosphor Icons (@phosphor-icons/react) - use Bold weight for primary actions

### 6. Invoice Template System

- Templates stored in `invoiceTemplates` table
- Single default template: "Sleek - Default"
- Full customization: colors, fonts (Google Fonts), layout, field visibility
- Live preview in `SleekTemplateEditor.tsx`
- PDF generation uses template settings in `server/pdf.ts`

### 7. AI Features

- AI Assistant: Chat interface in sidebar (`AIAssistant.tsx`)
- Smart Compose: Extract invoice data from text (`server/ai/smartCompose.ts`)
- OpenRouter API for LLM calls
- Lazy-loaded to reduce main bundle size

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
- Manual chunks in `vite.config.ts` for better caching
- Skeleton loaders for async data
- Pagination on large lists (invoices, clients, payments)

## Common Development Tasks

### Adding a New Page

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link in `client/src/components/Navigation.tsx`

### Adding a New API Endpoint

1. Define procedure in `server/routers.ts`
2. Add database query in `server/db.ts` if needed
3. Call from frontend via `api.yourRouter.yourProcedure.useQuery()`

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

## Important Notes

### Code Quality Standards

- **Type Safety**: No `any` without justification; prefer `unknown`
- **Error Handling**: Always handle promise rejections with try/catch
- **Forms**: Use react-hook-form + Zod validation
- **Database**: Use Drizzle query builder, not raw SQL
- **Comments**: Only where logic isn't self-evident (no "what" comments)

### Testing Requirements

- Write tests for all new API procedures
- Test invoice calculation logic (decimal precision)
- Test subscription limit enforcement
- Test database queries with edge cases

### Performance Considerations

- Lazy load heavy dependencies (AI, charts)
- Use pagination for large datasets
- Add loading skeletons for async data
- Optimize images before S3 upload (Sharp)

### Security Reminders

- Validate all user input with Zod
- Use `protectedProcedure` for authenticated routes
- Never expose API keys in frontend
- Sanitize HTML in email templates
- Verify Stripe webhook signatures

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
