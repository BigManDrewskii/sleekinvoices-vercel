# Local Development Setup - Complete Guide

## ✅ Current Status

Your local environment is **fully configured and working**:

- ✅ Docker MySQL running (healthy)
- ✅ Database schema synced (19 tables)
- ✅ Dev users seeded (4 test users including Local Dev User)
- ✅ `.env.local` configured with `SKIP_AUTH=true`
- ✅ `.gitignore` protecting sensitive files
- ✅ Dev server running on http://localhost:3000/

---

## 🔒 Local vs Production Separation

### How It Works

**Local Development (Your Machine)**

- Uses **Docker MySQL** on `localhost:3306`
- Database: `sleekinvoices_dev` (separate from production)
- Auth: **BYPASSED** with `SKIP_AUTH=true` (auto-login as dev user)
- Domain: `http://localhost:3000/`
- Data: **Completely isolated** from production

**Production (Live Server)**

- Uses **TiDB/PlanetScale** (remote database)
- Database: `sleekinvoices_prod` (different database entirely)
- Auth: **Real OAuth** with Manus
- Domain: `https://sleekinvoices.com/`
- Data: **Real user data** (never touches local)

### Why Pushing to GitHub Is Safe

When you push code to GitHub:

- ✅ **Code changes** go to the repo (Landing.tsx, Docs.tsx, etc.)
- ✅ **Schema definitions** go to the repo (drizzle/schema.ts)
- ❌ **Environment variables** (.env.local) are IGNORED by `.gitignore`
- ❌ **Database data** stays on your local Docker container
- ❌ **Production database** is NOT touched (different DATABASE_URL)

**What happens on production deployment:**

1. Code is pulled from GitHub
2. Production uses its own `.env` file (with production DATABASE_URL)
3. Schema migrations run on production database (if needed)
4. Production database and local database remain completely separate

---

## 🚀 Your Local Development Workflow

### Starting Your Local Environment (EASY MODE)

```bash
# Run the startup script (handles everything automatically)
./dev.sh
```

This script:

- ✅ Starts Docker MySQL
- ✅ Waits for database to be healthy
- ✅ Loads .env.local variables
- ✅ Starts dev server with auth bypass
- ✅ Shows you the correct URLs

### Starting Manually (if preferred)

```bash
# 1. Start Docker MySQL (if not already running)
docker-compose up -d

# 2. Verify database is healthy
docker-compose ps

# 3. Start development server (loads .env.local automatically)
pnpm dev

# 4. Open in browser
# IMPORTANT: Use http://localhost:3000/ (NOT 5173!)
# Landing: http://localhost:3000/landing
# Docs: http://localhost:3000/docs
# Dashboard: http://localhost:3000/dashboard
```

**⚠️ IMPORTANT:** SleekInvoices runs on **port 3000**, not 5173. The server serves both frontend and backend.

### Navigating Freely Without Issues

Since `SKIP_AUTH=true` is set, you automatically login as:

- **Email:** `dev@localhost.test`
- **User ID:** `4`
- **Name:** Local Dev User
- **Tier:** Pro (unlimited features)

**You can freely:**

- ✅ Navigate to `/dashboard`, `/invoices`, `/clients`, etc.
- ✅ Create invoices, clients, estimates
- ✅ Use AI features (if OPENROUTER_API_KEY is set)
- ✅ Test payment flows (use Stripe test cards)
- ✅ Modify templates, settings
- ✅ All data stays in your local database

### Resetting Your Local Data

If you want to start fresh:

```bash
# Option 1: Reset specific user data
DATABASE_URL="mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev" pnpm seed

# Option 2: Complete database reset
docker-compose down -v  # Destroys database
docker-compose up -d    # Recreates clean database
pnpm db:push            # Recreates schema
pnpm seed              # Seeds test data
```

---

## 🛡️ Protection Mechanisms

### 1. Environment Variables (.gitignore)

Your `.gitignore` **already protects**:

```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

**This means:**

- Your local DATABASE_URL never goes to GitHub
- API keys (STRIPE_SECRET_KEY, OPENROUTER_API_KEY) stay local
- OAuth secrets stay private

### 2. Separate Databases

**Local:** `sleekinvoices_dev` (Docker MySQL on your machine)
**Production:** `sleekinvoices_prod` (TiDB/PlanetScale in the cloud)

**They never interact.** Even if you accidentally used production DATABASE_URL locally, the code has safety checks.

### 3. Auth Bypass Protection

The server checks for production mode:

```typescript
// In server/_core/auth.ts (example)
if (process.env.SKIP_AUTH === "true" && process.env.NODE_ENV === "production") {
  throw new Error("SKIP_AUTH cannot be enabled in production!");
}
```

**This prevents** accidentally deploying with auth bypass enabled.

---

## 🧪 Testing Without Breaking Production

### Safe Testing Practices

**1. Use Test Credentials**

- Stripe: Use `sk_test_...` keys (not `sk_live_...`)
- NOWPayments: Use sandbox mode
- QuickBooks: Use `sandbox` environment

**2. Local Database Only**
Your Docker database is isolated. You can:

- Delete all invoices → `docker exec sleekinvoices-db mysql -usleekinvoices -plocaldev123 sleekinvoices_dev -e "DELETE FROM invoices;"`
- Truncate tables → `docker exec sleekinvoices-db mysql -usleekinvoices -plocaldev123 sleekinvoices_dev -e "TRUNCATE clients;"`
- Drop and recreate → `docker-compose down -v && docker-compose up -d`

**3. Branch-Based Development**
Create feature branches for experimentation:

```bash
git checkout -b feature/new-landing-design
# Make changes, test locally
git push origin feature/new-landing-design
# Merge to main only when ready
```

---

## 📊 Current Database State

**Tables:** 19
**Users:** 4 (including dev user)
**Status:** Healthy, fully synced

**Test Users Available:**

- `free@sleek-invoices.test` - Free plan user
- `pro@sleek-invoices.test` - Pro plan user
- `pastdue@sleek-invoices.test` - Subscription past due
- `dev@localhost.test` - **YOU** (auto-logged in with SKIP_AUTH)

---

## 🔧 Common Local Dev Tasks

### Add More Test Data

```bash
# Run seed script to add invoices, clients, expenses
DATABASE_URL="mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev" pnpm seed
```

### Check Database Directly

```bash
# Open MySQL CLI
docker exec -it sleekinvoices-db mysql -usleekinvoices -plocaldev123 sleekinvoices_dev

# Or use phpMyAdmin (if running)
open http://localhost:8080
```

### Update Database Schema

```bash
# After editing drizzle/schema.ts
DATABASE_URL="mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev" pnpm db:push
```

### Restart Dev Server

```bash
# Kill current server (Ctrl+C in terminal)
pnpm dev

# Or restart Docker if database issues
docker-compose restart
```

---

## 🚨 Troubleshooting

### "Database not available" Error

**Cause:** Database not started or connection failed

**Fix:**

```bash
docker-compose up -d
docker-compose ps  # Verify mysql is healthy
```

### "Auth Error" or "Unauthorized"

**Cause:** `SKIP_AUTH` not working

**Fix:**
Check `.env.local` has:

```
SKIP_AUTH=true
VITE_SKIP_AUTH=true
```

Restart dev server:

```bash
# Ctrl+C to stop, then:
pnpm dev
```

### Redirect Loop / Can't Navigate

**Cause:** Browser cached old auth state or wrong port

**Fix:**

1. **Make sure you're on the correct port:** http://localhost:3000/ (NOT 5173!)
2. **Clear browser storage:**
   - Open DevTools (F12 or Cmd+Option+I)
   - Go to Console tab
   - Run: `localStorage.clear(); sessionStorage.clear();`
   - Refresh page
3. **Hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   ./dev.sh  # Or: pnpm dev
   ```
5. **Verify auth bypass is working:**
   ```bash
   curl http://localhost:3000/api/trpc/auth.me
   # Should show: dev@localhost.test
   ```

### Changes Not Showing

**Cause:** Browser cache or HMR issue

**Fix:**

1. Hard refresh: Cmd+Shift+R
2. Clear browser cache
3. Restart dev server if HMR not working

---

## 📝 Summary: You're Protected

✅ **Local database** = Isolated Docker container (no production access)
✅ **Environment variables** = Never committed to GitHub (.gitignore)
✅ **Test data** = Seeded locally, not in production
✅ **Auth bypass** = Only works locally (production rejects it)
✅ **Code changes** = Pushed to GitHub safely, deployed separately to production

**Bottom Line:** You can break things locally all you want. Production is completely isolated and protected.

---

## 🎯 Next Steps

Your local environment is ready! You can now:

1. **Navigate freely:** Visit http://localhost:5173/landing
2. **Test features:** Create invoices, clients, use AI features
3. **View docs:** Visit http://localhost:5173/docs
4. **Make changes:** Edit code, push to GitHub safely
5. **Reset anytime:** `docker-compose down -v` for clean slate

**Production remains untouched** no matter what you do locally. 🚀
