import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Company/branding info
  companyName: text("companyName"),
  baseCurrency: varchar("baseCurrency", { length: 3 }).default("USD").notNull(),
  companyAddress: text("companyAddress"),
  companyPhone: varchar("companyPhone", { length: 50 }),
  logoUrl: text("logoUrl"),
  taxId: varchar("taxId", { length: 50 }), // VAT/Tax ID for invoices
  
  // Subscription info
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["free", "active", "canceled", "past_due"]).default("free").notNull(),
  subscriptionId: varchar("subscriptionId", { length: 255 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Usage tracking table for enforcing invoice limits on free tier
 * Tracks number of invoices created per user per month
 * Month format: YYYY-MM (e.g., "2026-01")
 * Counter resets automatically when new month is detected
 */
export const usageTracking = mysqlTable("usageTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  invoicesCreated: int("invoicesCreated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Unique constraint: one record per user per month
  userMonthIdx: uniqueIndex("user_month_idx").on(table.userId, table.month),
}));

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

/**
 * Client database for invoice recipients
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  companyName: text("companyName"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  
  // VAT/Tax compliance fields
  vatNumber: varchar("vatNumber", { length: 50 }), // EU VAT number (e.g., DE123456789)
  taxExempt: boolean("taxExempt").default(false).notNull(), // Tax exempt status
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Invoices table
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  
  // Invoice identification
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  
  // Status tracking - includes 'viewed' for when client first opens invoice
  status: mysqlEnum("status", ["draft", "sent", "viewed", "paid", "overdue", "canceled"]).default("draft").notNull(),
  
  // Financial details - DECIMAL(24,8) for crypto precision
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  subtotal: decimal("subtotal", { precision: 24, scale: 8 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0").notNull(),
  taxAmount: decimal("taxAmount", { precision: 24, scale: 8 }).default("0").notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).default("percentage"),
  discountValue: decimal("discountValue", { precision: 24, scale: 8 }).default("0").notNull(),
  discountAmount: decimal("discountAmount", { precision: 24, scale: 8 }).default("0").notNull(),
  total: decimal("total", { precision: 24, scale: 8 }).notNull(),
  
  // Payment tracking - DECIMAL(24,8) for crypto precision
  amountPaid: decimal("amountPaid", { precision: 24, scale: 8 }).default("0").notNull(),
  
  // Crypto payment fields
  cryptoAmount: decimal("cryptoAmount", { precision: 24, scale: 18 }), // Wei-level precision
  cryptoCurrency: varchar("cryptoCurrency", { length: 10 }), // BTC, ETH, USDC, etc.
  cryptoPaymentId: varchar("cryptoPaymentId", { length: 100 }), // NOWPayments payment ID
  cryptoPaymentUrl: text("cryptoPaymentUrl"), // NOWPayments invoice URL
  
  // Stripe payment integration
  stripePaymentLinkId: varchar("stripePaymentLinkId", { length: 255 }),
  stripePaymentLinkUrl: text("stripePaymentLinkUrl"),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  
  // Invoice details
  notes: text("notes"),
  paymentTerms: text("paymentTerms"),
  
  // Template reference (optional - uses default if not specified)
  templateId: int("templateId"),
  
  // Dates
  issueDate: timestamp("issueDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  sentAt: timestamp("sentAt"),
  paidAt: timestamp("paidAt"),
  firstViewedAt: timestamp("firstViewedAt"), // When invoice was first viewed by client
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice line items
 */
export const invoiceLineItems = mysqlTable("invoiceLineItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 24, scale: 8 }).notNull(), // DECIMAL(24,8) for crypto precision
  rate: decimal("rate", { precision: 24, scale: 8 }).notNull(), // DECIMAL(24,8) for crypto precision
  amount: decimal("amount", { precision: 24, scale: 8 }).notNull(), // DECIMAL(24,8) for crypto precision
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

/**
 * Email log for tracking sent invoices
 */
export const emailLog = mysqlTable("emailLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: text("subject").notNull(),
  emailType: mysqlEnum("emailType", ["invoice", "reminder", "receipt"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  success: boolean("success").default(true).notNull(),
  errorMessage: text("errorMessage"),
});

export type EmailLog = typeof emailLog.$inferSelect;
export type InsertEmailLog = typeof emailLog.$inferInsert;

/**
 * Recurring invoices for automated invoice generation
 */
export const recurringInvoices = mysqlTable("recurringInvoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId").notNull(),
  
  // Recurrence settings
  frequency: mysqlEnum("frequency", ["weekly", "monthly", "yearly"]).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"), // nullable - null means no end date
  nextInvoiceDate: timestamp("nextInvoiceDate").notNull(),
  
  // Invoice template data
  invoiceNumberPrefix: varchar("invoiceNumberPrefix", { length: 50 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0").notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).default("percentage"),
  discountValue: decimal("discountValue", { precision: 24, scale: 8 }).default("0").notNull(), // DECIMAL(24,8) for crypto precision
  notes: text("notes"),
  paymentTerms: text("paymentTerms"),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  lastGeneratedAt: timestamp("lastGeneratedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecurringInvoice = typeof recurringInvoices.$inferSelect;
export type InsertRecurringInvoice = typeof recurringInvoices.$inferInsert;

/**
 * Line items template for recurring invoices
 */
export const recurringInvoiceLineItems = mysqlTable("recurringInvoiceLineItems", {
  id: int("id").autoincrement().primaryKey(),
  recurringInvoiceId: int("recurringInvoiceId").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 24, scale: 8 }).notNull(), // DECIMAL(24,8) for crypto precision
  rate: decimal("rate", { precision: 24, scale: 8 }).notNull(), // DECIMAL(24,8) for crypto precision
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RecurringInvoiceLineItem = typeof recurringInvoiceLineItems.$inferSelect;
export type InsertRecurringInvoiceLineItem = typeof recurringInvoiceLineItems.$inferInsert;

/**
 * Custom invoice templates for branding
 */
export const invoiceTemplates = mysqlTable("invoiceTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  
  // Template layout type
  templateType: mysqlEnum("templateType", ["sleek", "modern", "classic", "minimal", "bold", "professional", "creative"]).default("sleek").notNull(),
  
  // Color scheme
  primaryColor: varchar("primaryColor", { length: 7 }).default("#5f6fff").notNull(), // hex color
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#252f33").notNull(),
  accentColor: varchar("accentColor", { length: 7 }).default("#10b981").notNull(),
  
  // Typography - separate fonts for headings and body
  headingFont: varchar("headingFont", { length: 50 }).default("Inter").notNull(),
  bodyFont: varchar("bodyFont", { length: 50 }).default("Inter").notNull(),
  fontSize: int("fontSize").default(14).notNull(),
  
  // Logo customization
  logoUrl: text("logoUrl"),
  logoPosition: mysqlEnum("logoPosition", ["left", "center", "right"]).default("left").notNull(),
  logoWidth: int("logoWidth").default(150).notNull(), // pixels
  
  // Layout structure
  headerLayout: mysqlEnum("headerLayout", ["standard", "centered", "split"]).default("standard").notNull(),
  footerLayout: mysqlEnum("footerLayout", ["simple", "detailed", "minimal"]).default("simple").notNull(),
  
  // Field visibility controls
  showCompanyAddress: boolean("showCompanyAddress").default(true).notNull(),
  showPaymentTerms: boolean("showPaymentTerms").default(true).notNull(),
  showTaxField: boolean("showTaxField").default(true).notNull(),
  showDiscountField: boolean("showDiscountField").default(true).notNull(),
  showNotesField: boolean("showNotesField").default(true).notNull(),
  
  // Footer customization
  footerText: text("footerText"),
  
  // Language and currency
  language: varchar("language", { length: 10 }).default("en").notNull(),
  dateFormat: varchar("dateFormat", { length: 20 }).default("MM/DD/YYYY").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = typeof invoiceTemplates.$inferInsert;

/**
 * Custom fields for invoices - user-defined fields
 */
export const customFields = mysqlTable("customFields", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  templateId: int("templateId"), // nullable - if null, applies to all templates
  
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  fieldLabel: varchar("fieldLabel", { length: 100 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "number", "date", "select"]).default("text").notNull(),
  isRequired: boolean("isRequired").default(false).notNull(),
  defaultValue: text("defaultValue"),
  selectOptions: text("selectOptions"), // JSON array for select type
  sortOrder: int("sortOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomField = typeof customFields.$inferSelect;
export type InsertCustomField = typeof customFields.$inferInsert;

/**
 * Custom field values for specific invoices
 */
export const invoiceCustomFieldValues = mysqlTable("invoiceCustomFieldValues", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  customFieldId: int("customFieldId").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceCustomFieldValue = typeof invoiceCustomFieldValues.$inferSelect;
export type InsertInvoiceCustomFieldValue = typeof invoiceCustomFieldValues.$inferInsert;

/**
 * Expense categories for organization
 */
export const expenseCategories = mysqlTable("expenseCategories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#64748b").notNull(), // hex color
  icon: varchar("icon", { length: 50 }).default("receipt").notNull(), // lucide icon name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = typeof expenseCategories.$inferInsert;

/**
 * Expenses for profit/loss tracking
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  
  // Financial details - DECIMAL(24,8) for crypto precision
  amount: decimal("amount", { precision: 24, scale: 8 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  date: timestamp("date").notNull(),
  
  // Expense details
  vendor: varchar("vendor", { length: 255 }),
  description: text("description").notNull(),
  notes: text("notes"),
  
  // Receipt and payment
  receiptUrl: text("receiptUrl"),
  receiptKey: text("receiptKey"), // S3 key for deletion
  paymentMethod: mysqlEnum("paymentMethod", [
    "cash",
    "credit_card",
    "debit_card",
    "bank_transfer",
    "check",
    "other",
  ]),
  
  // Tax and billable - DECIMAL(24,8) for crypto precision
  taxAmount: decimal("taxAmount", { precision: 24, scale: 8 }).default("0").notNull(),
  isBillable: boolean("isBillable").default(false).notNull(),
  clientId: int("clientId"), // If billable, which client
  invoiceId: int("invoiceId"), // If billed, which invoice
  
  // Recurring flag
  isRecurring: boolean("isRecurring").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Invoice generation logs for tracking automated recurring invoice generation
 */
export const invoiceGenerationLogs = mysqlTable("invoiceGenerationLogs", {
  id: int("id").autoincrement().primaryKey(),
  recurringInvoiceId: int("recurringInvoiceId").notNull(),
  generatedInvoiceId: int("generatedInvoiceId"),
  generationDate: timestamp("generationDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceGenerationLog = typeof invoiceGenerationLogs.$inferSelect;
export type InsertInvoiceGenerationLog = typeof invoiceGenerationLogs.$inferInsert;

/**
 * Currencies table for multi-currency support
 */
export const currencies = mysqlTable("currencies", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(), // USD, EUR, GBP, etc.
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  exchangeRateToUSD: varchar("exchangeRateToUSD", { length: 20 }).notNull(), // Store as string for precision
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
});

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = typeof currencies.$inferInsert;

/**
 * Client portal access tokens for secure client invoice viewing
 */
export const clientPortalAccess = mysqlTable("clientPortalAccess", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  accessToken: varchar("accessToken", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = revoked
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientPortalAccess = typeof clientPortalAccess.$inferSelect;
export type InsertClientPortalAccess = typeof clientPortalAccess.$inferInsert;

/**
 * Payments table for tracking all invoice payments
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  userId: int("userId").notNull(),
  
  // Payment details - DECIMAL(24,8) for crypto precision
  amount: decimal("amount", { precision: 24, scale: 8 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["stripe", "manual", "bank_transfer", "check", "cash", "crypto"]).notNull(),
  
  // Stripe integration
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  
  // Crypto payment details
  cryptoAmount: decimal("cryptoAmount", { precision: 24, scale: 18 }), // 18 decimals for ETH precision
  cryptoCurrency: varchar("cryptoCurrency", { length: 10 }), // BTC, ETH, USDT, etc.
  cryptoNetwork: varchar("cryptoNetwork", { length: 20 }), // mainnet, polygon, arbitrum, etc.
  cryptoTxHash: varchar("cryptoTxHash", { length: 100 }), // Transaction hash for verification
  cryptoWalletAddress: varchar("cryptoWalletAddress", { length: 100 }), // Receiving wallet address
  
  // Dates
  paymentDate: timestamp("paymentDate").notNull(), // When payment was made
  receivedDate: timestamp("receivedDate"), // When payment was received (for checks, bank transfers)
  
  // Status
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("completed").notNull(),
  
  // Additional info
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Stripe webhook events log for debugging and audit
 */
export const stripeWebhookEvents = mysqlTable("stripeWebhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 255 }).notNull().unique(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  payload: text("payload").notNull(), // JSON string
  processed: int("processed").default(0).notNull(), // 1 = processed, 0 = pending
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;

/**
 * Reminder settings for automated email reminders
 */
export const reminderSettings = mysqlTable("reminderSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // One setting per user
  enabled: int("enabled").default(1).notNull(), // 1 = enabled, 0 = disabled
  intervals: text("intervals").notNull(), // JSON array: [3, 7, 14]
  emailTemplate: text("emailTemplate").notNull(), // Customizable template with placeholders
  ccEmail: varchar("ccEmail", { length: 320 }), // Optional CC address
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReminderSettings = typeof reminderSettings.$inferSelect;
export type InsertReminderSettings = typeof reminderSettings.$inferInsert;

/**
 * Reminder logs for tracking sent reminders
 */
export const reminderLogs = mysqlTable("reminderLogs", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  userId: int("userId").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  daysOverdue: int("daysOverdue").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
});

export type ReminderLog = typeof reminderLogs.$inferSelect;
export type InsertReminderLog = typeof reminderLogs.$inferInsert;


/**
 * Payment gateways configuration for user-connected payment providers
 * Supports Stripe Connect, Coinbase Commerce, and manual wallets
 */
export const paymentGateways = mysqlTable("paymentGateways", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Provider type
  provider: mysqlEnum("provider", ["stripe_connect", "coinbase_commerce"]).notNull(),
  
  // Encrypted configuration (JSON string with provider-specific data)
  // For stripe_connect: { accountId, accessToken, refreshToken }
  // For coinbase_commerce: { apiKey }
  config: text("config").notNull(),
  
  // Status
  isEnabled: boolean("isEnabled").default(true).notNull(),
  
  // Metadata
  displayName: varchar("displayName", { length: 100 }), // User-friendly name
  lastTestedAt: timestamp("lastTestedAt"), // Last successful connection test
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // One provider per user (can have both Stripe and Coinbase, but not two Stripes)
  userProviderIdx: uniqueIndex("user_provider_idx").on(table.userId, table.provider),
}));

export type PaymentGateway = typeof paymentGateways.$inferSelect;
export type InsertPaymentGateway = typeof paymentGateways.$inferInsert;

/**
 * User wallet addresses for manual crypto payments
 * Users can add up to 3 wallets for different networks
 */
export const userWallets = mysqlTable("userWallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Wallet identification
  label: varchar("label", { length: 100 }).notNull(), // e.g., "My ETH Wallet", "BTC Address"
  address: varchar("address", { length: 255 }).notNull(), // Wallet address
  
  // Network/blockchain
  network: mysqlEnum("network", ["ethereum", "polygon", "bitcoin", "bsc", "arbitrum", "optimism"]).notNull(),
  
  // Display order
  sortOrder: int("sortOrder").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = typeof userWallets.$inferInsert;


/**
 * Invoice view tracking for analytics and notifications
 * Tracks every time a client views an invoice via the public link
 */
export const invoiceViews = mysqlTable("invoiceViews", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  
  // View metadata
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv6 compatible
  userAgent: text("userAgent"),
  
  // First view tracking
  isFirstView: boolean("isFirstView").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceView = typeof invoiceViews.$inferSelect;
export type InsertInvoiceView = typeof invoiceViews.$inferInsert;


/**
 * Crypto subscription payments table
 * Tracks NOWPayments payments for Pro subscription upgrades
 */
export const cryptoSubscriptionPayments = mysqlTable("cryptoSubscriptionPayments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // NOWPayments payment info
  paymentId: varchar("paymentId", { length: 255 }).notNull().unique(),
  paymentStatus: varchar("paymentStatus", { length: 50 }).notNull(),
  
  // Amount info
  priceAmount: decimal("priceAmount", { precision: 10, scale: 2 }).notNull(),
  priceCurrency: varchar("priceCurrency", { length: 10 }).notNull(),
  payCurrency: varchar("payCurrency", { length: 10 }).notNull(),
  payAmount: decimal("payAmount", { precision: 24, scale: 8 }).notNull(),
  
  // Tracking
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CryptoSubscriptionPayment = typeof cryptoSubscriptionPayments.$inferSelect;
export type InsertCryptoSubscriptionPayment = typeof cryptoSubscriptionPayments.$inferInsert;
