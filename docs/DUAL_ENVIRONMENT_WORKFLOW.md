# SleekInvoices: Dual Environment Development Workflow

This guide explains how to work on SleekInvoices using both **Manus** (cloud-based AI development) and **Claude Code** (local development) while maintaining a clean GitHub workflow.

## Overview

SleekInvoices supports a hybrid development workflow where you can seamlessly switch between:

| Environment             | Purpose                                      | Auth Mode         | Database         |
| ----------------------- | -------------------------------------------- | ----------------- | ---------------- |
| **Manus**               | Production, staging, AI-assisted development | Full OAuth        | Production MySQL |
| **Claude Code (Local)** | Feature development, debugging, testing      | Bypass (dev user) | Local MySQL      |

Both environments sync through GitHub, ensuring your work is never lost and can be continued from either platform.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│     Manus       │     │   Claude Code   │
│  (Production)   │     │    (Local)      │
│                 │     │                 │
│  - Full OAuth   │     │  - SKIP_AUTH    │
│  - Prod DB      │     │  - Local DB     │
│  - Checkpoints  │     │  - Git commits  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │    ┌──────────┐       │
         └────►  GitHub  ◄───────┘
              │   Repo   │
              └──────────┘
```

## Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/BigManDrewskii/sd-invoice-generator.git
cd sd-invoice-generator
```

### 2. Configure Local Environment

Copy the environment template:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your local settings. The minimum required configuration:

```env
# Auth bypass for local development
SKIP_AUTH=true
VITE_SKIP_AUTH=true

# Database (required)
DATABASE_URL=mysql://root:password@localhost:3306/sleekinvoice_dev

# JWT Secret (any string)
JWT_SECRET=local-dev-secret-key

# Frontend URLs
VITE_OAUTH_PORTAL_URL=http://localhost:5173
VITE_APP_ID=local-dev-app
```

### 3. Initialize the Database

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE sleekinvoice_dev;"

# Run migrations
pnpm install
pnpm db:push
```

### 4. Start Development Server

```bash
pnpm dev
```

Open `http://localhost:5173` - you'll be automatically logged in as "Local Dev User".

## GitHub Workflow

### Working Locally with Claude Code

1. **Make changes** using Claude Code or your editor
2. **Test locally** with `pnpm test` and manual testing
3. **Commit and push** to GitHub:

```bash
git add .
git commit -m "feat: Add new feature description"
git push origin main
```

### Syncing to Manus

When you return to Manus after working locally:

1. **Pull latest changes**: Manus will automatically sync when you create a checkpoint
2. **Or manually sync**: Ask Manus to "sync with GitHub" or "pull latest changes"
3. **Create checkpoint**: This saves your work and makes it deployable

### Working in Manus

1. **Make changes** with Manus AI assistance
2. **Save checkpoint**: This commits to the internal Manus repo
3. **Push to GitHub**: The checkpoint automatically syncs to `user_github` remote

### Conflict Resolution

If both environments have changes:

```bash
# On local machine
git fetch origin
git merge origin/main
# Resolve any conflicts
git push origin main
```

Then in Manus, ask to "sync with GitHub" to pull the merged changes.

## Authentication Details

### Production Mode (Manus)

In production, the app uses Manus OAuth:

1. User clicks "Sign In"
2. Redirected to Manus OAuth portal
3. After authentication, redirected back with session cookie
4. Session persists for 1 year

### Development Mode (Local)

When `SKIP_AUTH=true` is set:

1. Backend automatically creates/uses `dev-user-local` account
2. No OAuth redirect occurs
3. All API calls are authenticated as the dev user
4. Console shows: `[Auth] Local dev mode detected - auth bypass enabled`

The bypass is implemented in:

- `server/_core/context.ts` - Creates dev user context
- `server/_core/sdk.ts` - Suppresses auth warnings
- `client/src/const.ts` - Returns safe placeholder for login URL
- `client/src/_core/hooks/useAuth.ts` - Skips OAuth redirect

## Environment Variables Reference

### Required for Local Development

| Variable         | Description          | Example                               |
| ---------------- | -------------------- | ------------------------------------- |
| `SKIP_AUTH`      | Enable auth bypass   | `true`                                |
| `VITE_SKIP_AUTH` | Frontend auth bypass | `true`                                |
| `DATABASE_URL`   | MySQL connection     | `mysql://root:pass@localhost:3306/db` |
| `JWT_SECRET`     | Session signing key  | Any random string                     |

### Optional (Feature-Specific)

| Variable               | Feature         | Where to Get                                                  |
| ---------------------- | --------------- | ------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`    | Payments        | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) |
| `RESEND_API_KEY`       | Email sending   | [Resend](https://resend.com/api-keys)                         |
| `NOWPAYMENTS_API_KEY`  | Crypto payments | [NOWPayments](https://nowpayments.io/)                        |
| `QUICKBOOKS_CLIENT_ID` | Accounting sync | [Intuit Developer](https://developer.intuit.com/)             |
| `OPENROUTER_API_KEY`   | AI features     | [OpenRouter](https://openrouter.ai/)                          |

## Best Practices

### Do

- Always pull from GitHub before starting work in either environment
- Create meaningful commit messages
- Test locally before pushing
- Use Manus checkpoints for deployable states

### Don't

- Commit `.env.local` to GitHub (it's in `.gitignore`)
- Use production credentials in local development
- Make conflicting changes in both environments simultaneously
- Skip database migrations when schema changes

## Troubleshooting

### "Invalid URL" Error on Local

Missing environment variables. Ensure `VITE_OAUTH_PORTAL_URL` and `VITE_APP_ID` are set.

### Database Column Errors

Run migrations: `pnpm db:push`

### Module Not Found Errors

Reinstall dependencies: `rm -rf node_modules && pnpm install`

### Auth Not Working Locally

Verify `SKIP_AUTH=true` is in `.env.local` and restart the dev server.

### Changes Not Syncing

1. Check GitHub for latest commits
2. In Manus: "sync with GitHub" or "pull from user_github"
3. Locally: `git pull origin main`

## File Structure

```
sd-invoice-generator/
├── .env.local.example    # Template for local config
├── .env.local            # Your local config (gitignored)
├── docs/
│   └── DUAL_ENVIRONMENT_WORKFLOW.md  # This file
├── client/               # React frontend
├── server/               # Express + tRPC backend
├── drizzle/              # Database schema & migrations
└── shared/               # Shared types & utilities
```

## Support

- **Manus Issues**: Use the Manus chat interface
- **Code Issues**: Open a GitHub issue
- **Local Setup**: Refer to this document or ask Claude Code

---

_Last updated: January 2026_
