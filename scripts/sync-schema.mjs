/**
 * Database Schema Sync Script
 * Adds missing columns to sync database with Drizzle schema definitions
 * Safe to run multiple times - checks if columns exist before adding
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function syncSchema() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🔄 Database Schema Sync\n');
  console.log('=' .repeat(60));
  
  const migrations = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Helper to check if column exists
  async function columnExists(table, column) {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return rows[0].count > 0;
  }

  // Helper to add column if not exists
  async function addColumnIfNotExists(table, column, definition, after = null) {
    const exists = await columnExists(table, column);
    if (exists) {
      console.log(`  ⏭️  ${table}.${column} - already exists`);
      skipCount++;
      return;
    }
    
    let sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`;
    if (after) {
      sql += ` AFTER ${after}`;
    }
    
    try {
      await connection.execute(sql);
      console.log(`  ✅ ${table}.${column} - added`);
      migrations.push({ table, column, status: 'added' });
      successCount++;
    } catch (error) {
      console.log(`  ❌ ${table}.${column} - error: ${error.message}`);
      migrations.push({ table, column, status: 'error', error: error.message });
      errorCount++;
    }
  }

  // ============================================================================
  // INVOICES TABLE
  // ============================================================================
  console.log('\n📋 invoices:');
  await addColumnIfNotExists('invoices', 'paidAt', 'TIMESTAMP NULL', 'sentAt');
  await addColumnIfNotExists('invoices', 'firstViewedAt', 'TIMESTAMP NULL', 'paidAt');
  await addColumnIfNotExists('invoices', 'amountPaid', 'DECIMAL(24,8) NOT NULL DEFAULT 0', 'total');
  await addColumnIfNotExists('invoices', 'cryptoAmount', 'DECIMAL(24,18) NULL', 'amountPaid');
  await addColumnIfNotExists('invoices', 'cryptoCurrency', 'VARCHAR(10) NULL', 'cryptoAmount');
  await addColumnIfNotExists('invoices', 'cryptoPaymentId', 'VARCHAR(100) NULL', 'cryptoCurrency');
  await addColumnIfNotExists('invoices', 'cryptoPaymentUrl', 'TEXT NULL', 'cryptoPaymentId');
  await addColumnIfNotExists('invoices', 'stripePaymentLinkId', 'VARCHAR(255) NULL', 'cryptoPaymentUrl');
  await addColumnIfNotExists('invoices', 'stripePaymentLinkUrl', 'TEXT NULL', 'stripePaymentLinkId');
  await addColumnIfNotExists('invoices', 'stripeSessionId', 'VARCHAR(255) NULL', 'stripePaymentLinkUrl');
  await addColumnIfNotExists('invoices', 'paymentTerms', 'TEXT NULL', 'notes');

  // ============================================================================
  // INVOICE TEMPLATES TABLE
  // ============================================================================
  console.log('\n🎨 invoiceTemplates:');
  await addColumnIfNotExists('invoiceTemplates', 'templateType', "ENUM('sleek','modern','classic','minimal','bold','professional','creative') NOT NULL DEFAULT 'sleek'", 'isDefault');
  await addColumnIfNotExists('invoiceTemplates', 'accentColor', "VARCHAR(7) NOT NULL DEFAULT '#10b981'", 'secondaryColor');
  await addColumnIfNotExists('invoiceTemplates', 'headingFont', "VARCHAR(50) NOT NULL DEFAULT 'Inter'", 'accentColor');
  await addColumnIfNotExists('invoiceTemplates', 'bodyFont', "VARCHAR(50) NOT NULL DEFAULT 'Inter'", 'headingFont');
  await addColumnIfNotExists('invoiceTemplates', 'fontSize', 'INT NOT NULL DEFAULT 14', 'bodyFont');
  await addColumnIfNotExists('invoiceTemplates', 'logoWidth', 'INT NOT NULL DEFAULT 150', 'logoPosition');
  await addColumnIfNotExists('invoiceTemplates', 'headerLayout', "ENUM('standard','centered','split') NOT NULL DEFAULT 'standard'", 'logoWidth');
  await addColumnIfNotExists('invoiceTemplates', 'footerLayout', "ENUM('simple','detailed','minimal') NOT NULL DEFAULT 'simple'", 'headerLayout');
  await addColumnIfNotExists('invoiceTemplates', 'showTaxField', 'BOOLEAN NOT NULL DEFAULT TRUE', 'showPaymentTerms');
  await addColumnIfNotExists('invoiceTemplates', 'showDiscountField', 'BOOLEAN NOT NULL DEFAULT TRUE', 'showTaxField');
  await addColumnIfNotExists('invoiceTemplates', 'showNotesField', 'BOOLEAN NOT NULL DEFAULT TRUE', 'showDiscountField');
  await addColumnIfNotExists('invoiceTemplates', 'language', "VARCHAR(10) NOT NULL DEFAULT 'en'", 'footerText');
  await addColumnIfNotExists('invoiceTemplates', 'dateFormat', "VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY'", 'language');

  // ============================================================================
  // PRODUCTS TABLE
  // ============================================================================
  console.log('\n📦 products:');
  await addColumnIfNotExists('products', 'rate', 'DECIMAL(24,8) NOT NULL DEFAULT 0', 'description');
  await addColumnIfNotExists('products', 'unit', "VARCHAR(50) DEFAULT 'unit'", 'rate');
  await addColumnIfNotExists('products', 'category', 'VARCHAR(100) NULL', 'unit');
  await addColumnIfNotExists('products', 'taxable', 'BOOLEAN NOT NULL DEFAULT TRUE', 'sku');
  await addColumnIfNotExists('products', 'usageCount', 'INT NOT NULL DEFAULT 0', 'isActive');

  // ============================================================================
  // PAYMENTS TABLE
  // ============================================================================
  console.log('\n💳 payments:');
  await addColumnIfNotExists('payments', 'stripePaymentIntentId', 'VARCHAR(255) NULL', 'paymentMethod');
  await addColumnIfNotExists('payments', 'cryptoAmount', 'DECIMAL(24,18) NULL', 'stripePaymentIntentId');
  await addColumnIfNotExists('payments', 'cryptoCurrency', 'VARCHAR(10) NULL', 'cryptoAmount');
  await addColumnIfNotExists('payments', 'cryptoNetwork', 'VARCHAR(20) NULL', 'cryptoCurrency');
  await addColumnIfNotExists('payments', 'cryptoTxHash', 'VARCHAR(100) NULL', 'cryptoNetwork');
  await addColumnIfNotExists('payments', 'cryptoWalletAddress', 'VARCHAR(100) NULL', 'cryptoTxHash');
  await addColumnIfNotExists('payments', 'receivedDate', 'TIMESTAMP NULL', 'paymentDate');
  await addColumnIfNotExists('payments', 'status', "ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'completed'", 'receivedDate');

  // ============================================================================
  // EMAIL LOG TABLE
  // ============================================================================
  console.log('\n📧 emailLog:');
  await addColumnIfNotExists('emailLog', 'emailType', "ENUM('invoice','reminder','receipt') NOT NULL DEFAULT 'invoice'", 'subject');
  await addColumnIfNotExists('emailLog', 'success', 'BOOLEAN NOT NULL DEFAULT TRUE', 'sentAt');
  await addColumnIfNotExists('emailLog', 'messageId', 'VARCHAR(100) NULL', 'errorMessage');
  await addColumnIfNotExists('emailLog', 'deliveryStatus', "ENUM('sent','delivered','opened','clicked','bounced','complained','failed') DEFAULT 'sent'", 'messageId');
  await addColumnIfNotExists('emailLog', 'deliveredAt', 'TIMESTAMP NULL', 'deliveryStatus');
  await addColumnIfNotExists('emailLog', 'openedAt', 'TIMESTAMP NULL', 'deliveredAt');
  await addColumnIfNotExists('emailLog', 'openCount', 'INT DEFAULT 0', 'openedAt');
  await addColumnIfNotExists('emailLog', 'clickedAt', 'TIMESTAMP NULL', 'openCount');
  await addColumnIfNotExists('emailLog', 'clickCount', 'INT DEFAULT 0', 'clickedAt');
  await addColumnIfNotExists('emailLog', 'bouncedAt', 'TIMESTAMP NULL', 'clickCount');
  await addColumnIfNotExists('emailLog', 'bounceType', 'VARCHAR(50) NULL', 'bouncedAt');
  await addColumnIfNotExists('emailLog', 'retryCount', 'INT DEFAULT 0', 'bounceType');
  await addColumnIfNotExists('emailLog', 'lastRetryAt', 'TIMESTAMP NULL', 'retryCount');
  await addColumnIfNotExists('emailLog', 'nextRetryAt', 'TIMESTAMP NULL', 'lastRetryAt');

  // ============================================================================
  // REMINDER SETTINGS TABLE
  // ============================================================================
  console.log('\n⏰ reminderSettings:');
  await addColumnIfNotExists('reminderSettings', 'emailTemplate', 'TEXT NOT NULL DEFAULT ""', 'emailSubject');
  await addColumnIfNotExists('reminderSettings', 'ccEmail', 'VARCHAR(320) NULL', 'emailTemplate');

  // ============================================================================
  // REMINDER LOGS TABLE
  // ============================================================================
  console.log('\n📝 reminderLogs:');
  await addColumnIfNotExists('reminderLogs', 'recipientEmail', 'VARCHAR(320) NOT NULL DEFAULT ""', 'daysOverdue');

  // ============================================================================
  // ESTIMATES TABLE
  // ============================================================================
  console.log('\n📄 estimates:');
  await addColumnIfNotExists('estimates', 'title', 'VARCHAR(255) NULL', 'total');
  await addColumnIfNotExists('estimates', 'terms', 'TEXT NULL', 'notes');
  await addColumnIfNotExists('estimates', 'viewedAt', 'TIMESTAMP NULL', 'sentAt');
  await addColumnIfNotExists('estimates', 'acceptedAt', 'TIMESTAMP NULL', 'viewedAt');
  await addColumnIfNotExists('estimates', 'rejectedAt', 'TIMESTAMP NULL', 'acceptedAt');

  // ============================================================================
  // AI CREDITS TABLE
  // ============================================================================
  console.log('\n🤖 aiCredits:');
  await addColumnIfNotExists('aiCredits', 'purchasedCredits', 'INT NOT NULL DEFAULT 0', 'creditsLimit');

  // ============================================================================
  // EXPENSE CATEGORIES TABLE
  // ============================================================================
  console.log('\n📁 expenseCategories:');
  await addColumnIfNotExists('expenseCategories', 'icon', "VARCHAR(50) NOT NULL DEFAULT 'receipt'", 'color');

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Columns added: ${successCount}`);
  console.log(`   ⏭️  Columns skipped (already exist): ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some migrations failed. Review errors above.');
  } else {
    console.log('\n✅ Schema sync complete!');
  }

  await connection.end();
  return { migrations, successCount, skipCount, errorCount };
}

syncSchema().catch(console.error);
