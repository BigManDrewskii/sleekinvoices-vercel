# SleekInvoices Local Development Guide

This guide explains how to set up and run SleekInvoices locally for development with Claude Code or any other IDE.

## Quick Start (5 minutes)

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **Docker** (recommended) - [Download](https://docker.com/) - For local MySQL database
- **MySQL 8.0** (alternative) - If not using Docker

### Automatic Setup

Run the setup script to configure everything automatically:

```bash
# Clone the repository (if not already done)
git clone https://github.com/BigManDrewskii/sleekinvoices.git
cd sleekinvoices

# Run the setup script
./scripts/setup-local.sh
```

This script will:

1. Check prerequisites
2. Create `.env.local` from template
3. Install dependencies
4. Start Docker MySQL container
5. Push database schema
6. Seed sample data

### Manual Setup

If you prefer to set things up manually:

```bash
# 1. Copy environment template
cp .env.local.example .env.local

# 2. Start MySQL (choose one option)
# Option A: Docker (recommended)
docker-compose up -d

# Option B: Use your own MySQL
# Edit .env.local and update DATABASE_URL

# 3. Install dependencies
pnpm install

# 4. Push database schema
pnpm db:push

# 5. Seed sample data (optional but recommended)
node scripts/seed-local.mjs

# 6. Start development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Configuration

### Required Variables

The minimum configuration for local development:

```env
# Auth bypass - REQUIRED for local dev
SKIP_AUTH=true
VITE_SKIP_AUTH=true

# Database - REQUIRED
DATABASE_URL=mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev

# JWT Secret - REQUIRED
JWT_SECRET=local-dev-secret-key-change-in-production-12345

# Frontend URLs - REQUIRED (prevents URL errors)
VITE_OAUTH_PORTAL_URL=http://localhost:5173
VITE_APP_ID=local-dev-app
```

### Optional Variables

Add these to enable specific features:

| Feature         | Variables                                               | Where to get                                                  |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| Stripe Payments | `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`      | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) |
| Email Sending   | `RESEND_API_KEY`                                        | [Resend](https://resend.com/api-keys)                         |
| Crypto Payments | `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_PUBLIC_KEY`         | [NOWPayments](https://nowpayments.io/)                        |
| QuickBooks      | `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`      | [Intuit Developer](https://developer.intuit.com/)             |
| AI Features     | `OPENROUTER_API_KEY`                                    | [OpenRouter](https://openrouter.ai/)                          |
| File Uploads    | `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | AWS Console                                                   |

## How Auth Bypass Works

When `SKIP_AUTH=true` is set:

1. **Backend** (`server/_core/context.ts`):
   - Automatically creates a dev user with `openId: "dev-user-local"`
   - All API requests are authenticated as this user
   - No OAuth flow required

2. **Frontend** (`client/src/const.ts`):
   - `isLocalDevMode()` returns `true`
   - Login redirects are bypassed
   - Home page redirects directly to Dashboard

3. **Seed Data** (`scripts/seed-local.mjs`):
   - Creates the same `dev-user-local` user
   - Populates sample clients, invoices, expenses, etc.
   - All data is owned by the dev user

## Database Management

### Docker MySQL

```bash
# Start MySQL and phpMyAdmin
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f mysql

# Reset database (delete all data)
docker-compose down -v
docker-compose up -d
pnpm db:push
node scripts/seed-local.mjs
```

### phpMyAdmin

Access phpMyAdmin at [http://localhost:8080](http://localhost:8080) to browse and manage the database visually.

### Drizzle Studio

```bash
# Open Drizzle Studio for database management
pnpm db:studio
```

### Schema Changes

When you modify `drizzle/schema.ts`:

```bash
# Push changes to database
pnpm db:push

# Generate migration (for production)
pnpm db:generate
```

## Development Workflow

### Daily Development

```bash
# Start Docker (if not running)
docker-compose up -d

# Start dev server
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/templates.test.ts

# Run tests in watch mode
pnpm test --watch
```

### Building for Production

```bash
# Build the application
pnpm build

# Preview production build locally
pnpm preview
```

## Working with Claude Code

### Recommended Workflow

1. **Pull latest from GitHub** before starting work:

   ```bash
   git pull origin main
   ```

2. **Make changes** with Claude Code

3. **Test locally**:

   ```bash
   pnpm dev
   pnpm test
   ```

4. **Commit and push**:

   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

5. **Sync with Manus** (in the Manus chat):
   > "Sync my project with the latest changes from GitHub"

### Tips for Claude Code

- The auth bypass means you don't need to worry about OAuth setup
- All features work with the seeded test data
- Use `pnpm test` to verify changes don't break existing functionality
- The database schema is in `drizzle/schema.ts`
- API routes are in `server/routers.ts`
- Frontend pages are in `client/src/pages/`

## Troubleshooting

### "Invalid URL" Error

This happens when OAuth environment variables are missing. Make sure you have:

```env
VITE_SKIP_AUTH=true
VITE_OAUTH_PORTAL_URL=http://localhost:5173
VITE_APP_ID=local-dev-app
```

### Database Connection Failed

1. Check if MySQL is running:

   ```bash
   docker-compose ps
   ```

2. Check if the database exists:

   ```bash
   docker exec sleekinvoices-db mysql -u root -plocaldev123 -e "SHOW DATABASES;"
   ```

3. Verify your `DATABASE_URL` in `.env.local`

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Reset Everything

```bash
# Stop and remove Docker containers and volumes
docker-compose down -v

# Remove node_modules
rm -rf node_modules

# Fresh install
pnpm install

# Restart Docker
docker-compose up -d

# Wait for MySQL
sleep 10

# Push schema and seed
pnpm db:push
node scripts/seed-local.mjs
```

## Sample Data Overview

The seed script creates:

| Entity             | Count | Description                                   |
| ------------------ | ----- | --------------------------------------------- |
| User               | 1     | Dev user (dev-user-local)                     |
| Clients            | 8     | Sample companies                              |
| Products           | 8     | Services and products                         |
| Invoices           | 25    | Various statuses (draft, sent, paid, overdue) |
| Expenses           | 20    | Categorized expenses                          |
| Expense Categories | 6     | Software, Office, Travel, etc.                |
| Templates          | 4     | Invoice templates                             |
| Estimates          | 5     | Sample quotes                                 |

## File Structure

```
sleekinvoices/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── contexts/       # React contexts
│   │   └── lib/            # Utilities
│   └── public/             # Static assets
├── server/                 # Backend (Express + tRPC)
│   ├── routers.ts          # API routes
│   ├── db.ts               # Database queries
│   └── _core/              # Core utilities
├── drizzle/                # Database
│   ├── schema.ts           # Schema definition
│   └── migrations/         # SQL migrations
├── scripts/                # Development scripts
│   ├── setup-local.sh      # Setup script
│   └── seed-local.mjs      # Seed script
├── docs/                   # Documentation
├── docker-compose.yml      # Docker configuration
├── .env.local.example      # Environment template
└── package.json            # Dependencies
```

## Need Help?

- **GitHub Issues**: Report bugs or request features
- **Manus Chat**: Ask for help with development
- **Documentation**: Check the `docs/` folder for more guides
