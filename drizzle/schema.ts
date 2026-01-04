import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

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
  
  // Status tracking
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "canceled"]).default("draft").notNull(),
  
  // Financial details
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0").notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).default("percentage"),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  // Payment tracking
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0").notNull(),
  
  // Stripe payment integration
  stripePaymentLinkId: varchar("stripePaymentLinkId", { length: 255 }),
  stripePaymentLinkUrl: text("stripePaymentLinkUrl"),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  
  // Invoice details
  notes: text("notes"),
  paymentTerms: text("paymentTerms"),
  
  // Dates
  issueDate: timestamp("issueDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  sentAt: timestamp("sentAt"),
  paidAt: timestamp("paidAt"),
  
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
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
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
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).default("0").notNull(),
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
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
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
  
  // Color scheme
  primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6").notNull(), // hex color
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#64748b").notNull(),
  accentColor: varchar("accentColor", { length: 7 }).default("#10b981").notNull(),
  
  // Typography
  fontFamily: varchar("fontFamily", { length: 50 }).default("Inter").notNull(),
  fontSize: int("fontSize").default(14).notNull(),
  
  // Layout options
  logoPosition: mysqlEnum("logoPosition", ["left", "center", "right"]).default("left").notNull(),
  showCompanyAddress: boolean("showCompanyAddress").default(true).notNull(),
  showPaymentTerms: boolean("showPaymentTerms").default(true).notNull(),
  footerText: text("footerText"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = typeof invoiceTemplates.$inferInsert;

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
  
  // Financial details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
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
  
  // Tax and billable
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).default("0").notNull(),
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
  
  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["stripe", "manual", "bank_transfer", "check", "cash"]).notNull(),
  
  // Stripe integration
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  
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

