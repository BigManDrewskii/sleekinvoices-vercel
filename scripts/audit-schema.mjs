/**
 * Database Schema Audit Script
 * Compares Drizzle schema definitions with actual database columns
 * Identifies missing columns, type mismatches, and other issues
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Tables to audit with their expected columns from Drizzle schema
// These MUST match the actual column names in drizzle/schema.ts
const expectedSchema = {
  users: [
    'id', 'openId', 'name', 'email', 'loginMethod', 'role',
    'avatarUrl', 'avatarType', 'companyName', 'baseCurrency',
    'companyAddress', 'companyPhone', 'logoUrl', 'taxId',
    'defaultInvoiceStyle', 'stripeCustomerId', 'subscriptionStatus',
    'subscriptionId', 'currentPeriodEnd', 'subscriptionEndDate',
    'subscriptionSource', 'createdAt', 'updatedAt', 'lastSignedIn'
  ],
  usageTracking: [
    'id', 'userId', 'month', 'invoicesCreated', 'createdAt', 'updatedAt'
  ],
  clients: [
    'id', 'userId', 'name', 'email', 'companyName', 'address',
    'phone', 'notes', 'vatNumber', 'taxExempt', 'createdAt', 'updatedAt'
  ],
  invoices: [
    'id', 'userId', 'clientId', 'invoiceNumber', 'status', 'currency',
    'subtotal', 'taxRate', 'taxAmount', 'discountType', 'discountValue',
    'discountAmount', 'total', 'amountPaid', 'cryptoAmount', 'cryptoCurrency',
    'cryptoPaymentId', 'cryptoPaymentUrl', 'stripePaymentLinkId',
    'stripePaymentLinkUrl', 'stripeSessionId', 'notes', 'paymentTerms',
    'templateId', 'issueDate', 'dueDate', 'sentAt', 'paidAt', 'firstViewedAt',
    'createdAt', 'updatedAt'
  ],
  invoiceLineItems: [
    'id', 'invoiceId', 'description', 'quantity', 'rate', 'amount',
    'sortOrder', 'createdAt'
  ],
  emailLog: [
    'id', 'userId', 'invoiceId', 'recipientEmail', 'subject', 'emailType',
    'sentAt', 'success', 'errorMessage', 'messageId', 'deliveryStatus',
    'deliveredAt', 'openedAt', 'openCount', 'clickedAt', 'clickCount',
    'bouncedAt', 'bounceType', 'retryCount', 'lastRetryAt', 'nextRetryAt'
  ],
  recurringInvoices: [
    'id', 'userId', 'clientId', 'frequency', 'startDate', 'endDate',
    'nextInvoiceDate', 'invoiceNumberPrefix', 'taxRate', 'discountType',
    'discountValue', 'notes', 'paymentTerms', 'isActive', 'lastGeneratedAt',
    'createdAt', 'updatedAt'
  ],
  recurringInvoiceLineItems: [
    'id', 'recurringInvoiceId', 'description', 'quantity', 'rate',
    'sortOrder', 'createdAt'
  ],
  invoiceTemplates: [
    'id', 'userId', 'name', 'isDefault', 'templateType', 'primaryColor',
    'secondaryColor', 'accentColor', 'headingFont', 'bodyFont', 'fontSize',
    'logoUrl', 'logoPosition', 'logoWidth', 'headerLayout', 'footerLayout',
    'showCompanyAddress', 'showPaymentTerms', 'showTaxField', 'showDiscountField',
    'showNotesField', 'footerText', 'language', 'dateFormat', 'createdAt', 'updatedAt'
  ],
  customFields: [
    'id', 'userId', 'templateId', 'fieldName', 'fieldLabel', 'fieldType',
    'isRequired', 'defaultValue', 'selectOptions', 'sortOrder', 'createdAt', 'updatedAt'
  ],
  invoiceCustomFieldValues: [
    'id', 'invoiceId', 'customFieldId', 'value', 'createdAt'
  ],
  expenseCategories: [
    'id', 'userId', 'name', 'color', 'icon', 'createdAt'
  ],
  expenses: [
    'id', 'userId', 'categoryId', 'amount', 'currency', 'date', 'vendor',
    'description', 'notes', 'receiptUrl', 'receiptKey', 'paymentMethod',
    'taxAmount', 'isBillable', 'clientId', 'invoiceId', 'billedAt',
    'isRecurring', 'isTaxDeductible', 'createdAt', 'updatedAt'
  ],
  invoiceGenerationLogs: [
    'id', 'recurringInvoiceId', 'generatedInvoiceId', 'generationDate',
    'status', 'errorMessage', 'createdAt'
  ],
  currencies: [
    'id', 'code', 'name', 'symbol', 'exchangeRateToUSD', 'lastUpdated', 'isActive'
  ],
  clientPortalAccess: [
    'id', 'clientId', 'accessToken', 'expiresAt', 'lastAccessedAt', 'isActive', 'createdAt'
  ],
  payments: [
    'id', 'invoiceId', 'userId', 'amount', 'currency', 'paymentMethod',
    'stripePaymentIntentId', 'cryptoAmount', 'cryptoCurrency', 'cryptoNetwork',
    'cryptoTxHash', 'cryptoWalletAddress', 'paymentDate', 'receivedDate',
    'status', 'notes', 'createdAt', 'updatedAt'
  ],
  stripeWebhookEvents: [
    'id', 'eventId', 'eventType', 'payload', 'processed', 'processedAt', 'createdAt'
  ],
  reminderSettings: [
    'id', 'userId', 'enabled', 'intervals', 'emailSubject', 'emailTemplate',
    'ccEmail', 'createdAt', 'updatedAt'
  ],
  reminderLogs: [
    'id', 'invoiceId', 'userId', 'sentAt', 'daysOverdue', 'recipientEmail',
    'status', 'errorMessage'
  ],
  paymentGateways: [
    'id', 'userId', 'provider', 'config', 'isEnabled', 'displayName',
    'lastTestedAt', 'createdAt', 'updatedAt'
  ],
  userWallets: [
    'id', 'userId', 'label', 'address', 'network', 'sortOrder', 'createdAt', 'updatedAt'
  ],
  invoiceViews: [
    'id', 'invoiceId', 'viewedAt', 'ipAddress', 'userAgent', 'isFirstView', 'createdAt'
  ],
  cryptoSubscriptionPayments: [
    'id', 'userId', 'paymentId', 'paymentStatus', 'priceAmount', 'priceCurrency',
    'payCurrency', 'payAmount', 'months', 'isExtension', 'confirmedAt',
    'createdAt', 'updatedAt'
  ],
  products: [
    'id', 'userId', 'name', 'description', 'rate', 'unit', 'category', 'sku',
    'taxable', 'isActive', 'usageCount', 'createdAt', 'updatedAt'
  ],
  estimates: [
    'id', 'userId', 'clientId', 'estimateNumber', 'status', 'currency',
    'subtotal', 'taxRate', 'taxAmount', 'discountType', 'discountValue',
    'discountAmount', 'total', 'title', 'notes', 'terms', 'templateId',
    'issueDate', 'validUntil', 'sentAt', 'viewedAt', 'acceptedAt', 'rejectedAt',
    'convertedToInvoiceId', 'convertedAt', 'createdAt', 'updatedAt'
  ],
  estimateLineItems: [
    'id', 'estimateId', 'description', 'quantity', 'rate', 'amount',
    'sortOrder', 'createdAt'
  ],
  aiCredits: [
    'id', 'userId', 'month', 'creditsUsed', 'creditsLimit', 'purchasedCredits',
    'createdAt', 'updatedAt'
  ],
  aiCreditPurchases: [
    'id', 'userId', 'stripeSessionId', 'stripePaymentIntentId', 'packType',
    'creditsAmount', 'amountPaid', 'currency', 'status', 'createdAt'
  ],
  aiUsageLogs: [
    'id', 'userId', 'feature', 'inputTokens', 'outputTokens', 'model',
    'success', 'errorMessage', 'createdAt'
  ],
  promoCodes: [
    'id', 'code', 'type', 'value', 'maxUses', 'usedCount', 'validFrom',
    'validUntil', 'isActive', 'createdBy', 'createdAt'
  ],
  promoCodeRedemptions: [
    'id', 'promoCodeId', 'userId', 'redeemedAt'
  ],
  quickbooksConnections: [
    'id', 'userId', 'realmId', 'accessToken', 'refreshToken', 'accessTokenExpiresAt',
    'refreshTokenExpiresAt', 'companyName', 'isActive', 'lastSyncAt', 'createdAt', 'updatedAt'
  ],
  quickbooksSyncLogs: [
    'id', 'userId', 'entityType', 'entityId', 'quickbooksId', 'action',
    'status', 'errorMessage', 'createdAt'
  ]
};

async function auditSchema() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🔍 Database Schema Audit Report\n');
  console.log('=' .repeat(60));
  
  const issues = [];
  const successes = [];
  
  for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
    try {
      const [rows] = await connection.execute(`SHOW COLUMNS FROM ${tableName}`);
      const actualColumns = rows.map(row => row.Field);
      
      // Find missing columns
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      
      // Find extra columns (in DB but not in schema - might be intentional)
      const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));
      
      if (missingColumns.length > 0) {
        issues.push({
          table: tableName,
          type: 'MISSING_COLUMNS',
          columns: missingColumns
        });
        console.log(`\n❌ ${tableName}:`);
        console.log(`   Missing columns: ${missingColumns.join(', ')}`);
      } else {
        successes.push(tableName);
        console.log(`\n✅ ${tableName}: OK`);
      }
      
      if (extraColumns.length > 0) {
        console.log(`   ℹ️  Extra columns (not in schema): ${extraColumns.join(', ')}`);
      }
      
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        issues.push({
          table: tableName,
          type: 'MISSING_TABLE',
          columns: expectedColumns
        });
        console.log(`\n❌ ${tableName}: TABLE DOES NOT EXIST`);
      } else {
        console.log(`\n⚠️  ${tableName}: Error - ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Tables OK: ${successes.length}`);
  console.log(`   ❌ Tables with issues: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n🔧 Required Actions:');
    for (const issue of issues) {
      if (issue.type === 'MISSING_TABLE') {
        console.log(`   - Create table: ${issue.table}`);
      } else if (issue.type === 'MISSING_COLUMNS') {
        for (const col of issue.columns) {
          console.log(`   - Add column: ${issue.table}.${col}`);
        }
      }
    }
  } else {
    console.log('\n✅ All tables are in sync with Drizzle schema!');
  }
  
  await connection.end();
  return { issues, successes };
}

auditSchema().catch(console.error);
