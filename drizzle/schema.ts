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
