# Authentication & Database System Overview - Sleek Invoices

## Executive Summary

This document provides a comprehensive overview of how authentication and database systems work in the Sleek Invoices application. Both systems demonstrate production-ready architecture with security best practices, proper separation of concerns, and scalable design patterns.

---

# PART 1: AUTHENTICATION SYSTEM

## Architecture Overview

The authentication system uses **Manus OAuth** as the primary authentication provider with **JWT session tokens** for session management. It includes a development bypass mechanism (SKIP_AUTH) for local development.

### Key Components

- **OAuth Provider**: Manus (custom OAuth server)
- **Session Management**: JWT tokens with HTTP-only cookies
- **Development Bypass**: SKIP_AUTH environment variable
- **Security Layers**: CSRF protection, rate limiting, secure cookies

---

## Authentication Flow

### Production Mode Flow

```
1. User clicks "Login" → Redirects to Manus OAuth
2. User authenticates with Manus → Redirects back with authorization code
3. Backend exchanges code for access token (server-to-server)
4. Backend fetches user info from Manus API
5. User record created/updated in local database
6. JWT session token generated (1 year expiration)
7. Session token set as HTTP-only cookie
8. Frontend receives cookie and can access authenticated routes
```

### Development Mode Flow (SKIP_AUTH=true)

```
1. Request intercepted in context creation
2. Auto-authenticate as "dev-user-local"
3. No OAuth flow required
4. Dev user created if not exists
5. All authenticated routes accessible
```

**CRITICAL**: SKIP_AUTH throws error if enabled in production (security block)

---

## Core Authentication Files

### 1. Context Creation (`server/_core/context.ts`)

**Purpose**: Primary entry point for authentication

**Key Logic**:
```typescript
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  // Development bypass
  if (process.env.SKIP_AUTH === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: SKIP_AUTH is enabled in production");
    }

    // Auto-authenticate with dev user
    let devUser = await getUserByOpenId("dev-user-local");
    if (!devUser) {
      await upsertUser({
        openId: "dev-user-local",
        name: "Local Dev User",
        email: "dev@localhost.test",
        loginMethod: "dev",
        lastSignedIn: new Date(),
      });
      devUser = await getUserByOpenId("dev-user-local");
    }
    return { req: opts.req, res: opts.res, user: devUser || null };
  }

  // Regular authentication flow
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}
```

**Output**: `TrpcContext` object with user or null

---

### 2. SDK Authentication (`server/_core/sdk.ts`)

**Purpose**: Handles OAuth token exchange and JWT operations

**Key Methods**:

#### `exchangeCodeForToken(code: string)`
- Exchanges OAuth authorization code for access token
- Server-to-server communication with Manus
- Returns access token

#### `getUserInfo(accessToken: string)`
- Fetches user details from Manus API
- Returns: `{ openId, name, email }`

#### `createSessionToken(user: UserSession)`
- Generates JWT using Jose library
- Token payload: `{ openId, appId, name }`
- Expiration: 1 year
- Signed with `COOKIE_SECRET`

#### `verifySession(token: string)`
- Validates JWT signature and expiration
- Returns decoded session object
- Throws on invalid token

#### `authenticateRequest(req: Request)`
- Full authentication flow
- Extracts session cookie
- Verifies JWT
- Fetches user from database
- Syncs user if missing (auto-sync from Manus)

---

### 3. tRPC Procedures (`server/_core/trpc.ts`)

**Three procedure types**:

#### `publicProcedure`
- No authentication required
- Used for landing page, webhooks, client portal
- Context: `{ req, res, user: null | User }`

#### `protectedProcedure`
- Requires authenticated user
- Throws UNAUTHORIZED if no user
- Used for all business logic (invoices, clients, settings)
- Context: `{ req, res, user: User }`

#### `adminProcedure`
- Requires admin role
- Throws FORBIDDEN if not admin
- Used for admin operations
- Context: `{ req, res, user: User }`

**Implementation**:
```typescript
const requireUser = t.middleware(async opts => {
  const ctx = opts.ctx;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: UNAUTHED_ERR_MSG
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);
```

---

## Security Measures

### 1. CSRF Protection (`server/_core/csrf.ts`)

**Pattern**: Custom header validation (not double-submit cookie)

**Protected Methods**: POST, PUT, PATCH, DELETE
**Exempt Paths**: Webhooks, health checks

**Implementation**:
```typescript
app.use("/api/trpc", csrfProtection);

// Middleware checks for custom header
if (PROTECTED_METHODS.includes(req.method)) {
  if (req.headers["x-csrf-protection"] !== "1") {
    return res.status(403).json({ error: "CSRF protection failed" });
  }
}
```

**Why This Works**:
- Cross-origin requests cannot set custom headers without CORS
- Browsers enforce same-origin policy for custom headers
- Webhooks exempt (they verify request signatures instead)

---

### 2. Rate Limiting (`server/_core/rateLimit.ts`)

**Three tiers of protection**:

| Tier | Limit | Use Case |
|------|-------|----------|
| **Strict** | 10 req/min | OAuth, payments |
| **Standard** | 100 req/15min | General API |
| **Lenient** | 200 req/15min | Read-only operations |

**Implementation**:
```typescript
app.use("/api/trpc", standardRateLimit);
app.use("/api/stripe/webhook", strictRateLimit);
app.use("/api/oauth", strictRateLimit);
```

**Storage**: In-memory (simple implementation)

---

### 3. Cookie Security (`server/_core/cookies.ts`)

**Cookie Configuration**:
```typescript
{
  name: "app_session_id",
  value: jwtToken,
  options: {
    httpOnly: true,        // Prevents JavaScript access
    secure: true,          // HTTPS only
    sameSite: "none",      // Required for cross-origin
    path: "/",             // Entire domain
    maxAge: ONE_YEAR_MS    // 1 year expiration
  }
}
```

**Security Properties**:
- **HTTP-only**: Cannot be accessed via `document.cookie`
- **Secure**: Only transmitted over HTTPS
- **SameSite=none**: Required for cross-origin OAuth
- **Path=/**: Available to entire application

---

### 4. Security Headers

**Request Flow**:
```
1. Request → CSRF protection check
2. Request → Rate limiting
3. Request → tRPC with context creation
4. Context → Authentication verification
5. Procedure → User validation
6. Response → Data or error
```

**Additional Measures**:
- Input validation with Zod schemas
- SQL injection protection via Drizzle ORM
- XSS protection via React escaping
- Webhook signature verification (Stripe, Resend, NOWPayments)

---

## Frontend Authentication

### useAuth Hook (`client/src/_core/hooks/useAuth.ts`)

**Purpose**: Provides authentication state and utilities

**Usage**:
```typescript
const { user, loading, isAuthenticated, logout } = useAuth({
  redirectOnUnauthenticated: true,
  redirectPath: getLoginUrl()
});
```

**Features**:
- **Queries**: `trpc.auth.me` for user info
- **Mutations**: `trpc.auth.logout` for logout
- **Redirect Logic**: Auto-redirects to login when unauthenticated
- **Dev Mode**: No redirect in local development

**Implementation**:
```typescript
const { data: user, isLoading } = trpc.auth.me.useQuery();
const logoutMutation = trpc.auth.logout.useMutation();

const isAuthenticated = !!user;

useEffect(() => {
  if (!loading && !isAuthenticated && redirectOnUnauthenticated) {
    window.location.href = redirectPath;
  }
}, [loading, isAuthenticated, redirectOnUnauthenticated]);
```

---

## Session Management

### JWT Token Structure

**Payload**:
```typescript
{
  openId: string,      // Manus user ID
  appId: string,       // Application ID
  name: string         // User name
}
```

**Claims**:
- **iss**: Issuer (application)
- **sub**: Subject (user openId)
- **exp**: Expiration (1 year)
- **iat**: Issued at

**Storage**: HTTP-only cookie (`app_session_id`)

---

### User Synchronization

**On First Login**:
1. User fetched from Manus
2. Record created in local database
3. All fields populated (openId, email, name, loginMethod)

**On Subsequent Logins**:
1. JWT verified
2. User fetched from local database
3. `lastSignedIn` timestamp updated

**Auto-Sync**:
- If user missing from local DB, fetch from Manus
- Ensures consistency between OAuth and local DB

---

## Protected Routes Implementation

### Example: Client Router

```typescript
export const clientsRouter = router({
  // Protected: Requires authentication
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email()
    }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user is guaranteed to exist
      return db.createClient(input, ctx.user.id);
    }),

  // Protected: List user's clients
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getClientsByUserId(ctx.user.id);
    }),

  // Public: No authentication required
  publicInfo: publicProcedure
    .query(async () => {
      return { featureFlags: {...} };
    })
});
```

**Key Points**:
- `protectedProcedure` guarantees `ctx.user` exists
- `publicProcedure` allows anonymous access
- Type-safe access to user context

---

## Environment Configuration

### Required Environment Variables

**Authentication**:
```
OAUTH_SERVER_URL=https://oauth.manus.com
APP_ID=sleek-invoices
COOKIE_SECRET=your-secret-key
```

**Development Bypass**:
```
SKIP_AUTH=true
NODE_ENV=development
```

**Security Note**:
- `SKIP_AUTH=true` throws error in production
- Critical security block in context creation

---

## Error Handling

### Authentication Errors

| Error | Code | Description |
|-------|------|-------------|
| **UNAUTHORIZED** | 401 | Missing/invalid session |
| **FORBIDDEN** | 403 | Admin access required |
| **INTERNAL_ERROR** | 500 | Authentication service down |

### Error Messages

**Standard Error**:
```typescript
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "You must be logged in to access this resource"
});
```

**Custom Messages**:
- "You must be logged in to access this resource"
- "Admin access required"
- "Invalid or expired session"

---

# PART 2: DATABASE LAYER

## Architecture Overview

The database layer uses **Drizzle ORM** with **MySQL (TiDB compatible)**. It follows a disciplined architecture with complete separation of concerns - all database logic is isolated in `/server/db/` modules, not inline in API routers.

### Key Components

- **ORM**: Drizzle ORM v0.44.5
- **Database**: MySQL/TiDB
- **Driver**: mysql2 v3.15.0
- **Connection Pooling**: Built-in mysql2 pooling
- **Type Safety**: Full TypeScript inference from schema

---

## Database Connection Management

### Connection Singleton (`server/db/connection.ts`)

**Purpose**: Manages database connection pool with lazy initialization

**Implementation**:
```typescript
let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    // Parse DATABASE_URL
    const url = new URL(process.env.DATABASE_URL);

    const connectionConfig = {
      host: url.hostname || "localhost",
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      multipleStatements: false,      // Security: prevent SQL injection
      supportBigNumbers: true,        // Handle DECIMAL type
      bigNumberStrings: false,
      ssl: { rejectUnauthorized: true } // Production SSL
    };

    // Create connection pool
    _pool = mysql.createPool(connectionConfig);

    // Initialize Drizzle ORM
    _db = drizzle(_pool);
  }

  return _db;
}
```

**Key Features**:
- **Lazy initialization**: Connection created on first use
- **Connection pooling**: Automatic via mysql2
- **Singleton pattern**: Single connection pool for application lifetime
- **Graceful degradation**: Returns null if DATABASE_URL not set
- **SSL enabled**: Secure connections in production

**Configuration**:
```
DATABASE_URL=mysql://user:password@localhost:3306/sleekinvoices_dev
```

---

## Drizzle ORM Schema

### Schema Organization (`drizzle/schema.ts`)

**Structure**: 43 tables organized by domain

**Core Tables**:

#### User Management (5 tables)
```typescript
// Core user table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user"),
  avatarUrl: text("avatarUrl"),
  avatarType: mysqlEnum("avatarType", ["initials", "boring", "upload"]),
  companyName: text("companyName"),
  baseCurrency: varchar("baseCurrency", { length: 3 }).default("USD"),
  logoUrl: text("logoUrl"),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["free", "active", "canceled", "past_due"]),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Usage tracking for free tier limits
export const usageTracking = mysqlTable("usageTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  invoicesCreated: int("invoicesCreated").default(0).notNull(),
});

// AI credits system
export const aiCredits = mysqlTable("aiCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  creditsRemaining: int("creditsRemaining").default(5).notNull(),
  creditsPurchased: int("creditsPurchased").default(0).notNull(),
});
```

#### Business Entities (10 tables)
```typescript
// Clients
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  vatNumber: varchar("vatNumber", { length: 50 }),
  taxExempt: boolean("taxExempt").default(false).notNull(),
  // ...
});

// Invoices
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "paid", "overdue", "void"]),
  subtotal: decimal("subtotal", { precision: 24, scale: 8 }),
  tax: decimal("tax", { precision: 24, scale: 8 }),
  total: decimal("total", { precision: 24, scale: 8 }),
  amountPaid: decimal("amountPaid", { precision: 24, scale: 8 }),
  cryptoAddress: varchar("cryptoAddress", { length: 255 }), // For crypto payments
  cryptoPaymentEnabled: boolean("cryptoPaymentEnabled").default(false),
  // ...
});

// Invoice line items
export const invoiceLineItems = mysqlTable("invoiceLineItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 24, scale: 8 }),
  unitPrice: decimal("unitPrice", { precision: 24, scale: 8 }),
  taxRate: decimal("taxRate", { precision: 24, scale: 8 }),
  total: decimal("total", { precision: 24, scale: 8 }),
  // ...
});
```

#### Financial Precision
- **All money fields**: `DECIMAL(24,8)`
- **Reasoning**:
  - Crypto currencies: Up to 18 decimals (ETH)
  - Traditional currencies: 2 decimals
  - Tax calculations: High precision needed
  - Prevents floating-point errors

---

## Query Patterns

### Architecture Principle

**ALL database operations in `/server/db/` modules - NO inline SQL in routers**

### Domain-Driven Module Structure

**22 domain-specific modules**:
```
server/db/
├── connection.ts          # Connection singleton
├── types.ts               # Complex type definitions
├── users.ts               # User management
├── clients.ts             # Client CRUD
├── invoices.ts            # Invoice operations
├── line-items.ts          # Line item operations
├── payments.ts            # Payment tracking
├── analytics.ts           # Business intelligence
├── email-log.ts           # Email delivery
├── reminders.ts           # Reminder system
├── templates.ts           # Template management
├── recurring-invoices.ts  # Recurring automation
├── expenses.ts            # Expense tracking
├── products.ts            # Product catalog
├── estimates.ts           # Quote management
├── currencies.ts          # Multi-currency
├── client-portal.ts       # Client access
├── webhooks.ts            # Third-party sync
├── custom-fields.ts       # User-defined fields
├── batch-templates.ts     # Batch invoicing
├── audit.ts               # Audit logging
├── crypto-payments.ts     # Crypto subscriptions
└── ...
```

---

### Standard Query Pattern

**CRUD Operations**:
```typescript
export async function createClient(client: InsertClient): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert
  const result = await db.insert(clients).values(client);
  const insertedId = Number(result[0].insertId);

  // Fetch created record
  const created = await db
    .select()
    .from(clients)
    .where(eq(clients.id, insertedId))
    .limit(1);

  return created[0]!;
}

export async function getClientsByUserId(userId: number): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt));
}

export async function updateClient(id: number, updates: Partial<InsertClient>): Promise<Client> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(clients)
    .set(updates)
    .where(eq(clients.id, id));

  return getClientById(id);
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(clients)
    .where(eq(clients.id, id));
}
```

---

### Advanced Query Pattern (with Joins)

**Invoice List with Payments**:
```typescript
export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      // Invoice fields
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      total: invoices.total,
      amountPaid: invoices.amountPaid,
      createdAt: invoices.createdAt,
      dueDate: invoices.dueDate,

      // Client fields (joined)
      clientName: clients.name,
      clientEmail: clients.email,

      // Aggregated payment total
      totalPaid: sql`COALESCE(
        SUM(CASE WHEN ${payments.status} = 'completed' THEN ${payments.amount} ELSE 0 END),
        0
      )`.mapWith(v => String(v)),

      // QuickBooks sync status
      qbInvoiceId: quickbooksInvoiceMapping.qbInvoiceId,
      qbLastSyncedAt: quickbooksInvoiceMapping.lastSyncedAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .leftJoin(quickbooksInvoiceMapping, eq(invoices.id, quickbooksInvoiceMapping.invoiceId))
    .where(eq(invoices.userId, userId))
    .groupBy(invoices.id, clients.name, clients.email, quickbooksInvoiceMapping.qbInvoiceId)
    .orderBy(desc(invoices.createdAt));

  return results;
}
```

**Key Features**:
- **Multiple joins**: Clients, payments, QuickBooks mapping
- **Aggregations**: SUM of completed payments
- **Type-safe**: All fields typed correctly
- **Optimized**: Single query with proper indexes

---

### Business Logic Queries

**Usage Limit Check**:
```typescript
export async function canUserCreateInvoice(userId: number, subscriptionStatus: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Pro users bypass all limits
  if (subscriptionStatus === "active") {
    return true;
  }

  // Get current month usage
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const usage = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.month, currentMonth)
      )
    )
    .limit(1);

  const invoicesCreated = usage[0]?.invoicesCreated || 0;

  // Free tier limit: 3 invoices/month
  return invoicesCreated < 3;
}
```

**AI Credit Management**:
```typescript
export async function decrementAICredits(userId: number, creditsUsed: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get current credits
  const creditRecord = await db
    .select()
    .from(aiCredits)
    .where(
      and(
        eq(aiCredits.userId, userId),
        eq(aiCredits.month, currentMonth)
      )
    )
    .limit(1);

  if (!creditRecord[0]) return false;

  const remaining = creditRecord[0].creditsRemaining;

  // Check if sufficient credits
  if (remaining < creditsUsed) {
    return false;
  }

  // Decrement credits
  await db
    .update(aiCredits)
    .set({ creditsRemaining: remaining - creditsUsed })
    .where(eq(aiCredits.id, creditRecord[0].id));

  // Log usage
  await db.insert(aiUsageLogs).values({
    userId,
    month: currentMonth,
    creditsUsed,
    timestamp: new Date()
  });

  return true;
}
```

---

## Type Safety & Schema Inference

### Drizzle Type Inference

**Schema Types**:
```typescript
// Infer from schema
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
```

**Usage in Functions**:
```typescript
export async function createClient(client: InsertClient): Promise<Client> {
  // Fully type-safe - all fields validated
  const db = await getDb();
  const result = await db.insert(clients).values(client);
  // ...
}
```

**Benefits**:
- **Compile-time validation**: TypeScript checks all queries
- **Autocompletion**: IDE suggests all available fields
- **Refactoring safety**: Changing schema updates all types
- **No manual types**: Eliminates type drift

---

## Migration Management

### Migration Workflow

**Database Commands**:
```bash
# Generate and run migrations
pnpm db:push

# Development seeding
pnpm seed

# Schema audit (check for inconsistencies)
pnpm db:audit

# Schema sync (development)
pnpm db:sync

# Reset user data (careful!)
pnpm db:reset
```

### Migration Structure

**Organization**:
```
drizzle/
├── schema.ts              # All table definitions
├── 0000_*.sql             # Initial schema migrations
└── migrations/
    ├── 0010_*.sql         # Feature migrations
    ├── 0013_ai_credits.sql
    ├── 0014_batch_invoice_templates.sql
    ├── 0015_email_delivery_tracking.sql
    ├── 0016_audit_log.sql
    ├── 0017_user_avatar.sql
    ├── 0018_email_retry_tracking.sql
    └── 0019_ai_credit_purchases.sql
```

### Recent Migration Examples

**AI Credit System** (0013_ai_credits.sql):
```sql
CREATE TABLE IF NOT EXISTS aiCredits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  month VARCHAR(7) NOT NULL,
  creditsRemaining INT DEFAULT 5 NOT NULL,
  creditsPurchased INT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY user_month_idx (userId, month),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aiUsageLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  month VARCHAR(7) NOT NULL,
  feature VARCHAR(50) NOT NULL,
  tokensUsed INT DEFAULT 0,
  creditsUsed INT DEFAULT 1,
  success BOOLEAN DEFAULT TRUE,
  errorMessage TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_month (userId, month),
  INDEX idx_feature (feature)
);
```

**Key Features**:
- **Foreign key constraints**: Proper referential integrity
- **Indexes**: Optimized for common queries
- **Cascade deletes**: Clean data cleanup
- **Unique constraints**: Prevent duplicate records

---

## Performance Optimization

### Connection Pooling

**Automatic via mysql2**:
```typescript
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "sleekinvoices",
  connectionLimit: 10,        // Max concurrent connections
  queueLimit: 0,              // Unlimited queue
  waitForConnections: true    // Wait for available connection
});
```

**Benefits**:
- Reuses connections instead of creating new ones
- Limits database load
- Improves query performance
- Handles connection failures gracefully

---

### Query Optimization

**Indexing Strategy**:
```sql
-- Foreign key indexes (automatic)
CREATE INDEX idx_invoices_userId ON invoices(userId);
CREATE INDEX idx_invoices_clientId ON invoices(clientId);

-- Composite indexes for common queries
CREATE INDEX idx_invoices_user_status ON invoices(userId, status);
CREATE INDEX idx_usage_user_month ON usageTracking(userId, month);

-- Unique indexes for lookups
CREATE UNIQUE INDEX idx_invoice_number ON invoices(userId, invoiceNumber);
```

**Query Patterns**:
- Use `select()` with specific fields (not `select(*)`)
- Apply `where()` clauses before joins
- Use `limit()` for single-record queries
- Aggregate with SQL functions, not in JavaScript

---

### Decimal.js for Financial Calculations

**CRITICAL**: Always use Decimal.js for money math

```typescript
import Decimal from "decimal.js";

// WRONG: Floating-point errors
const total = quantity * unitPrice * (1 + taxRate);
// Result: 10.199999999999999

// CORRECT: Precise calculation
const quantity = new Decimal("2");
const unitPrice = new Decimal("5.00");
const taxRate = new Decimal("0.10");

const subtotal = quantity.times(unitPrice);              // 10.00
const tax = subtotal.times(taxRate);                     // 1.00
const total = subtotal.plus(tax);                        // 11.00
const rounded = total.toDecimalPlaces(2);                // 11.00
```

**Usage in Database Layer**:
```typescript
export async function calculateInvoiceTotal(lineItems: InsertInvoiceLineItem[]) {
  let total = new Decimal(0);

  for (const item of lineItems) {
    const quantity = new Decimal(item.quantity);
    const unitPrice = new Decimal(item.unitPrice);
    const taxRate = new Decimal(item.taxRate || 0);

    const lineTotal = quantity.times(unitPrice);
    const lineTax = lineTotal.times(taxRate);
    const lineTotalWithTax = lineTotal.plus(lineTax);

    total = total.plus(lineTotalWithTax);
  }

  return total.toDecimalPlaces(2).toString();
}
```

---

## Integration with tRPC

### tRPC Router Usage

**Router Definition**:
```typescript
export const invoicesRouter = router({
  // Create invoice
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      lineItems: z.array(lineItemSchema),
      dueDate: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Business logic in db layer
      return db.createInvoice(input, ctx.user.id);
    }),

  // List invoices
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "sent", "paid", "overdue"]).optional()
    }))
    .query(async ({ ctx, input }) => {
      return db.getInvoicesByUserId(ctx.user.id, input.status);
    }),

  // Get single invoice
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const invoice = await db.getInvoiceById(input.id, ctx.user.id);
      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found"
        });
      }
      return invoice;
    })
});
```

**Key Principles**:
- **Validation**: Zod schemas validate input
- **Authorization**: `protectedProcedure` guarantees user
- **Business logic**: Delegated to db layer
- **Error handling**: Consistent error messages

---

## Key Architectural Strengths

### 1. Separation of Concerns

```
Request → tRPC Router → Validation → Database Layer → Response
         (API Layer)   (Zod)        (Business Logic)  (Data)
```

**Benefits**:
- Clean architecture boundaries
- Easy to test business logic
- Swappable database layer
- Clear responsibility separation

---

### 2. Type Safety

**End-to-end type safety**:
```
Schema → Types → Functions → tRPC → Frontend
 (Drizzle)  (TypeScript)  (db.ts)   (routers)
```

**Benefits**:
- Compile-time error detection
- No runtime type mismatches
- Excellent IDE support
- Safe refactoring

---

### 3. Scalability

**Connection Pooling**:
- Handles concurrent requests efficiently
- Prevents connection exhaustion
- Automatic connection reuse

**Query Optimization**:
- Proper indexes on foreign keys
- Efficient join patterns
- Aggregate functions in SQL

**Caching Ready**:
- Clear query boundaries
- Immutable data structures
- Easy to add caching layer

---

### 4. Maintainability

**Domain-Driven Organization**:
- 22 domain-specific modules
- Clear module boundaries
- Easy to locate functionality

**Consistent Patterns**:
- All queries follow same pattern
- Standard CRUD operations
- Predictable function signatures

**Comprehensive Testing**:
- Isolated business logic
- Easy to mock database
- Testable without full stack

---

### 5. Compliance & Audit

**Audit Logging**:
```typescript
export async function logAuditEvent(
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  details: Record<string, any>
) {
  const db = await getDb();
  await db.insert(auditLog).values({
    userId,
    action,
    entityType,
    entityId,
    details: JSON.stringify(details),
    timestamp: new Date(),
    ipAddress: "", // Captured from request
    userAgent: "" // Captured from request
  });
}
```

**Usage Tracking**:
- Free tier limits enforced
- AI credit consumption tracked
- Email delivery logged
- All user actions auditable

---

# SUMMARY

## Authentication System

✅ **Production-Ready**:
- Manus OAuth with secure JWT sessions
- Comprehensive security (CSRF, rate limiting, secure cookies)
- Development bypass (SKIP_AUTH) with production safety block

✅ **Security Layers**:
- CSRF protection via custom headers
- Rate limiting (3 tiers)
- HTTP-only, secure cookies
- Input validation with Zod
- Webhook signature verification

✅ **Developer Experience**:
- Simple `useAuth()` hook
- Type-safe user context
- Clear public vs protected procedures
- Auto-redirect for unauthenticated users

---

## Database Layer

✅ **Architecture**:
- Clean separation: API → Database layer
- All queries in `/server/db/` modules
- Type-safe with Drizzle ORM
- Connection pooling for scalability

✅ **Schema Design**:
- 43 tables organized by domain
- DECIMAL(24,8) for financial precision
- Proper foreign keys and indexes
- Audit logging for compliance

✅ **Performance**:
- Optimized queries with joins
- Connection pooling
- Proper indexing strategy
- Efficient aggregations

✅ **Developer Experience**:
- Type inference from schema
- Consistent query patterns
- Domain-driven module organization
- Easy to test and maintain

---

## Critical Files Reference

**Authentication**:
- `server/_core/context.ts` - Context creation (auth entry point)
- `server/_core/sdk.ts` - OAuth & JWT operations
- `server/_core/trpc.ts` - Protected/public procedures
- `server/_core/csrf.ts` - CSRF protection
- `server/_core/rateLimit.ts` - Rate limiting
- `client/src/_core/hooks/useAuth.ts` - Frontend auth hook

**Database**:
- `drizzle/schema.ts` - All 43 table definitions
- `server/db/connection.ts` - Connection singleton
- `server/db/users.ts` - User management
- `server/db/clients.ts` - Client operations
- `server/db/invoices.ts` - Invoice operations
- `server/db/analytics.ts` - Business intelligence

**Environment Configuration**:
- `.env.local.example` - All environment variables
- `DATABASE_URL` - MySQL connection string
- `SKIP_AUTH` - Development bypass
- `COOKIE_SECRET` - JWT signing secret
