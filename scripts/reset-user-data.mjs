/**
 * User Data Reset Script
 * Clears all user-generated data while preserving the user account
 * Used for testing empty-state UI/UX behavior
 * 
 * Usage: node scripts/reset-user-data.mjs [--user-id=N] [--confirm]
 * 
 * WARNING: This will permanently delete:
 * - All invoices and line items
 * - All estimates and line items
 * - All clients
 * - All products
 * - All expenses and categories
 * - All payments
 * - All email logs
 * - All recurring invoices
 * - All templates (except system defaults)
 * 
 * User account and subscription data will be preserved.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Parse command line arguments
const args = process.argv.slice(2);
let targetUserId = null;
let confirmed = false;

for (const arg of args) {
  if (arg.startsWith('--user-id=')) {
    targetUserId = parseInt(arg.split('=')[1], 10);
  }
  if (arg === '--confirm') {
    confirmed = true;
  }
}

async function promptConfirmation(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function resetUserData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('🗑️  User Data Reset Script\n');
  console.log('=' .repeat(60));

  try {
    // Get user ID
    let userId = targetUserId;
    if (!userId) {
      const [users] = await connection.execute('SELECT id, name, email FROM users ORDER BY id LIMIT 1');
      if (users.length === 0) {
        console.log('❌ No users found in database.');
        return;
      }
      userId = users[0].id;
      console.log(`\n👤 Target user: ${users[0].name} (${users[0].email})`);
    }
    console.log(`   User ID: ${userId}\n`);

    // Count existing data
    const counts = {};
    const tables = [
      { name: 'invoices', label: 'Invoices' },
      { name: 'invoiceLineItems', label: 'Invoice Line Items', join: 'invoices', joinCol: 'invoiceId' },
      { name: 'estimates', label: 'Estimates' },
      { name: 'estimateLineItems', label: 'Estimate Line Items', join: 'estimates', joinCol: 'estimateId' },
      { name: 'clients', label: 'Clients' },
      { name: 'products', label: 'Products' },
      { name: 'expenses', label: 'Expenses' },
      { name: 'expenseCategories', label: 'Expense Categories' },
      { name: 'payments', label: 'Payments' },
      { name: 'emailLog', label: 'Email Logs' },
      { name: 'reminderLogs', label: 'Reminder Logs' },
      { name: 'recurringInvoices', label: 'Recurring Invoices' },
      { name: 'recurringInvoiceLineItems', label: 'Recurring Invoice Line Items', join: 'recurringInvoices', joinCol: 'recurringInvoiceId' },
      { name: 'invoiceTemplates', label: 'Invoice Templates' },
      { name: 'invoiceViews', label: 'Invoice Views', join: 'invoices', joinCol: 'invoiceId' },
    ];

    console.log('📊 Current data counts:');
    for (const table of tables) {
      try {
        let query;
        if (table.join) {
          query = `SELECT COUNT(*) as count FROM ${table.name} t 
                   JOIN ${table.join} j ON t.${table.joinCol} = j.id 
                   WHERE j.userId = ?`;
        } else {
          query = `SELECT COUNT(*) as count FROM ${table.name} WHERE userId = ?`;
        }
        const [rows] = await connection.execute(query, [userId]);
        counts[table.name] = rows[0].count;
        if (rows[0].count > 0) {
          console.log(`   • ${table.label}: ${rows[0].count}`);
        }
      } catch (e) {
        // Table might not exist or have different structure
        counts[table.name] = 0;
      }
    }

    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n   Total records to delete: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('\n✅ No data to delete. User data is already empty.');
      return;
    }

    // Confirmation
    if (!confirmed) {
      console.log('\n⚠️  WARNING: This action cannot be undone!');
      const proceed = await promptConfirmation('\nAre you sure you want to delete all user data? (y/N): ');
      if (!proceed) {
        console.log('\n❌ Operation cancelled.');
        return;
      }
    }

    console.log('\n🗑️  Deleting data...');

    // Delete in correct order (child tables first due to foreign key constraints)
    const deleteOrder = [
      // Line items first
      { table: 'invoiceLineItems', join: 'invoices', joinCol: 'invoiceId' },
      { table: 'estimateLineItems', join: 'estimates', joinCol: 'estimateId' },
      { table: 'recurringInvoiceLineItems', join: 'recurringInvoices', joinCol: 'recurringInvoiceId' },
      { table: 'invoiceViews', join: 'invoices', joinCol: 'invoiceId' },
      { table: 'invoiceCustomFieldValues', join: 'invoices', joinCol: 'invoiceId' },
      
      // Logs and tracking
      { table: 'emailLog', direct: true },
      { table: 'reminderLogs', direct: true },
      { table: 'payments', direct: true },
      { table: 'invoiceGenerationLogs', join: 'recurringInvoices', joinCol: 'recurringInvoiceId' },
      
      // Main entities
      { table: 'invoices', direct: true },
      { table: 'estimates', direct: true },
      { table: 'recurringInvoices', direct: true },
      { table: 'expenses', direct: true },
      { table: 'expenseCategories', direct: true },
      { table: 'products', direct: true },
      { table: 'clients', direct: true },
      { table: 'invoiceTemplates', direct: true },
      { table: 'customFields', direct: true },
      
      // Settings (optional - keep user preferences)
      // { table: 'reminderSettings', direct: true },
    ];

    let deletedTotal = 0;
    for (const item of deleteOrder) {
      try {
        let query;
        if (item.direct) {
          query = `DELETE FROM ${item.table} WHERE userId = ?`;
        } else {
          query = `DELETE t FROM ${item.table} t 
                   JOIN ${item.join} j ON t.${item.joinCol} = j.id 
                   WHERE j.userId = ?`;
        }
        const [result] = await connection.execute(query, [userId]);
        if (result.affectedRows > 0) {
          console.log(`   ✅ ${item.table}: ${result.affectedRows} deleted`);
          deletedTotal += result.affectedRows;
        }
      } catch (e) {
        // Ignore errors for tables that don't exist
        if (!e.message.includes("doesn't exist")) {
          console.log(`   ⚠️  ${item.table}: ${e.message}`);
        }
      }
    }

    // Reset usage tracking
    try {
      await connection.execute('DELETE FROM usageTracking WHERE userId = ?', [userId]);
      console.log('   ✅ usageTracking: reset');
    } catch (e) {}

    // Reset AI credits
    try {
      await connection.execute('DELETE FROM aiCredits WHERE userId = ?', [userId]);
      console.log('   ✅ aiCredits: reset');
    } catch (e) {}

    console.log('\n' + '=' .repeat(60));
    console.log(`\n✅ User data reset complete!`);
    console.log(`   Total records deleted: ${deletedTotal}`);
    console.log('\n📝 Preserved:');
    console.log('   • User account and profile');
    console.log('   • Subscription status');
    console.log('   • Reminder settings (preferences)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

resetUserData().catch(console.error);
