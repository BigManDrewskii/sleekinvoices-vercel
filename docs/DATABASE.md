# Database Management Guide

This document covers database management for SleekInvoices, including schema synchronization, development data seeding, and environment management.

## Overview

SleekInvoices uses **MySQL** with **Drizzle ORM** for database operations. The production database is hosted by Manus and automatically configured via the `DATABASE_URL` environment variable.

## Quick Reference

| Command                            | Description                             |
| ---------------------------------- | --------------------------------------- |
| `pnpm db:push`                     | Push schema changes to database         |
| `node scripts/audit-schema.mjs`    | Audit database vs Drizzle schema        |
| `node scripts/sync-schema.mjs`     | Add missing columns to database         |
| `node scripts/seed-dev-data.mjs`   | Seed development mock data              |
| `node scripts/reset-user-data.mjs` | Clear user data for empty state testing |

## Schema Management

### Drizzle Schema Location

The database schema is defined in `/drizzle/schema.ts`. This file contains all table definitions using Drizzle ORM syntax.

### Pushing Schema Changes

After modifying the schema, push changes to the database:

```bash
pnpm db:push
```

This command generates and applies migrations automatically.

### Auditing Schema Sync

To check if the database matches the Drizzle schema:

```bash
node scripts/audit-schema.mjs
```

This will report:

- Missing tables
- Missing columns
- Extra columns (in DB but not in schema)

### Syncing Missing Columns

If columns are missing, run the sync script:

```bash
node scripts/sync-schema.mjs
```

This script safely adds missing columns without affecting existing data.

## Development Data Management

### Seeding Mock Data

To populate the database with realistic test data:

```bash
# Seed data for the first user
node scripts/seed-dev-data.mjs

# Seed data for a specific user
node scripts/seed-dev-data.mjs --user-id=1
```

The seed script creates:

- 5 clients with varied details
- 10 products/services
- 15 invoices (mix of draft, sent, paid, overdue)
- 5 estimates (mix of statuses)
- 20 expenses across categories
- 5 expense categories
- Payment records for paid invoices

### Resetting User Data (Empty State)

To test empty-state UI/UX, clear all user data:

```bash
# Interactive mode (prompts for confirmation)
node scripts/reset-user-data.mjs

# Auto-confirm (for scripts/CI)
node scripts/reset-user-data.mjs --confirm

# Reset specific user
node scripts/reset-user-data.mjs --user-id=1 --confirm
```

**What gets deleted:**

- All invoices and line items
- All estimates and line items
- All clients
- All products
- All expenses and categories
- All payments
- All email logs
- All recurring invoices
- All templates

**What is preserved:**

- User account and profile
- Subscription status
- Reminder settings (preferences)

## Environment States

### Development State

For development and testing with mock data:

1. Reset existing data: `node scripts/reset-user-data.mjs --confirm`
2. Seed fresh data: `node scripts/seed-dev-data.mjs`

### Empty State

For testing empty-state UI/UX:

1. Reset all data: `node scripts/reset-user-data.mjs --confirm`
2. Do not run seed script

### Production State

The production database contains real user data. Never run reset or seed scripts against production without explicit confirmation.

## Database Tables

### Core Tables

| Table               | Description                |
| ------------------- | -------------------------- |
| `users`             | User accounts and profiles |
| `clients`           | Client/customer records    |
| `invoices`          | Invoice headers            |
| `invoiceLineItems`  | Invoice line items         |
| `estimates`         | Estimate/quote headers     |
| `estimateLineItems` | Estimate line items        |
| `products`          | Product/service library    |
| `payments`          | Payment records            |

### Financial Tables

| Table                       | Description                  |
| --------------------------- | ---------------------------- |
| `expenses`                  | Expense tracking             |
| `expenseCategories`         | Expense categorization       |
| `recurringInvoices`         | Recurring invoice templates  |
| `recurringInvoiceLineItems` | Recurring invoice line items |

### System Tables

| Table              | Description               |
| ------------------ | ------------------------- |
| `invoiceTemplates` | Custom invoice templates  |
| `emailLog`         | Email delivery tracking   |
| `reminderSettings` | Reminder preferences      |
| `reminderLogs`     | Reminder history          |
| `aiCredits`        | AI feature usage tracking |
| `usageTracking`    | Invoice limit tracking    |

### Payment Integration Tables

| Table                        | Description                  |
| ---------------------------- | ---------------------------- |
| `stripeWebhookEvents`        | Stripe webhook audit log     |
| `cryptoSubscriptionPayments` | Crypto payment tracking      |
| `paymentGateways`            | Connected payment providers  |
| `userWallets`                | User crypto wallet addresses |

## Troubleshooting

### "Unknown column" Errors

If you see errors about unknown columns:

1. Run the audit: `node scripts/audit-schema.mjs`
2. Run the sync: `node scripts/sync-schema.mjs`
3. Restart the dev server: `pnpm dev`

### Schema Drift

If the database and Drizzle schema are significantly out of sync:

1. Review the audit output carefully
2. Run sync script for safe column additions
3. For complex changes, create a manual migration

### Connection Issues

If you can't connect to the database:

1. Check `DATABASE_URL` is set correctly
2. Ensure SSL is enabled for production
3. Verify network connectivity to the database host

## Best Practices

1. **Always backup before major changes** - Export data before running destructive operations
2. **Test migrations locally first** - Use a test database before applying to production
3. **Keep schema in sync** - Run audit regularly to catch drift early
4. **Use transactions** - Wrap related changes in transactions for atomicity
5. **Document changes** - Update this guide when adding new tables or columns
