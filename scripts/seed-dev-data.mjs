/**
 * Development Seed Script
 * Creates structured mock data for testing purposes
 *
 * Usage: node scripts/seed-dev-data.mjs [--user-id=N]
 *
 * This script creates:
 * - 5 clients with varied details
 * - 10 products/services
 * - 15 invoices (mix of draft, sent, paid, overdue)
 * - 5 estimates (mix of statuses)
 * - 20 expenses across categories
 * - 5 expense categories
 * - Invoice templates
 * - Recurring invoice setup
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

// Parse command line arguments
const args = process.argv.slice(2);
let targetUserId = null;
for (const arg of args) {
  if (arg.startsWith("--user-id=")) {
    targetUserId = parseInt(arg.split("=")[1], 10);
  }
}

// Helper functions
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max, decimals = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function randomDate(startDays, endDays) {
  const now = new Date();
  const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function futureDate(days) {
  const now = new Date();
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function generateInvoiceNumber(prefix, index) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(index).padStart(4, "0")}`;
}

// Sample data
const clientData = [
  {
    name: "Acme Corporation",
    email: "billing@acme.com",
    companyName: "Acme Corp",
    address: "123 Business Ave, New York, NY 10001",
    phone: "+1-555-0101",
  },
  {
    name: "TechStart Inc",
    email: "accounts@techstart.io",
    companyName: "TechStart Inc",
    address: "456 Innovation Blvd, San Francisco, CA 94102",
    phone: "+1-555-0102",
  },
  {
    name: "Global Designs LLC",
    email: "finance@globaldesigns.co",
    companyName: "Global Designs LLC",
    address: "789 Creative St, Austin, TX 78701",
    phone: "+1-555-0103",
  },
  {
    name: "Summit Consulting",
    email: "ap@summitconsulting.com",
    companyName: "Summit Consulting Group",
    address: "321 Advisory Lane, Chicago, IL 60601",
    phone: "+1-555-0104",
  },
  {
    name: "Riverside Media",
    email: "invoices@riversidemedia.net",
    companyName: "Riverside Media Group",
    address: "654 Content Way, Los Angeles, CA 90001",
    phone: "+1-555-0105",
  },
];

const productData = [
  {
    name: "Web Development",
    description: "Full-stack web development services",
    rate: "150.00",
    unit: "hour",
  },
  {
    name: "UI/UX Design",
    description: "User interface and experience design",
    rate: "125.00",
    unit: "hour",
  },
  {
    name: "Mobile App Development",
    description: "iOS and Android app development",
    rate: "175.00",
    unit: "hour",
  },
  {
    name: "SEO Optimization",
    description: "Search engine optimization services",
    rate: "500.00",
    unit: "project",
  },
  {
    name: "Content Writing",
    description: "Professional content creation",
    rate: "75.00",
    unit: "hour",
  },
  {
    name: "Logo Design",
    description: "Brand logo design package",
    rate: "800.00",
    unit: "project",
  },
  {
    name: "Social Media Management",
    description: "Monthly social media management",
    rate: "1500.00",
    unit: "month",
  },
  {
    name: "Consulting Session",
    description: "Business strategy consulting",
    rate: "200.00",
    unit: "hour",
  },
  {
    name: "Email Marketing Setup",
    description: "Email campaign setup and automation",
    rate: "350.00",
    unit: "project",
  },
  {
    name: "Maintenance Retainer",
    description: "Monthly website maintenance",
    rate: "500.00",
    unit: "month",
  },
];

const expenseCategoryData = [
  { name: "Software & Tools", color: "#3b82f6", icon: "laptop" },
  { name: "Office Supplies", color: "#10b981", icon: "package" },
  { name: "Travel & Transport", color: "#f59e0b", icon: "plane" },
  { name: "Marketing & Ads", color: "#ec4899", icon: "megaphone" },
  { name: "Professional Services", color: "#8b5cf6", icon: "briefcase" },
];

const expenseVendors = [
  "Adobe Creative Cloud",
  "AWS",
  "Google Workspace",
  "Figma",
  "Notion",
  "Office Depot",
  "Staples",
  "Amazon Business",
  "United Airlines",
  "Uber",
  "Hilton Hotels",
  "Google Ads",
  "Facebook Ads",
  "LinkedIn Ads",
  "Legal Firm LLC",
  "Accounting Partners",
  "Insurance Co",
];

async function seedDevData() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  console.log("🌱 Development Data Seed Script\n");
  console.log("=".repeat(60));

  try {
    // Get user ID
    let userId = targetUserId;
    if (!userId) {
      const [users] = await connection.execute(
        "SELECT id FROM users ORDER BY id LIMIT 1"
      );
      if (users.length === 0) {
        console.log(
          "❌ No users found in database. Please create a user first."
        );
        return;
      }
      userId = users[0].id;
    }
    console.log(`\n👤 Seeding data for user ID: ${userId}\n`);

    // Check if user already has data
    const [existingClients] = await connection.execute(
      "SELECT COUNT(*) as count FROM clients WHERE userId = ?",
      [userId]
    );
    if (existingClients[0].count > 0) {
      console.log(
        "⚠️  User already has data. Use --force to overwrite (not implemented)."
      );
      console.log("   Or use reset-dev-data.mjs to clear data first.\n");
    }

    // ========================================================================
    // CLIENTS
    // ========================================================================
    console.log("📇 Creating clients...");
    const clientIds = [];
    for (const client of clientData) {
      const [result] = await connection.execute(
        `INSERT INTO clients (userId, name, email, companyName, address, phone, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          client.name,
          client.email,
          client.companyName,
          client.address,
          client.phone,
        ]
      );
      clientIds.push(result.insertId);
    }
    console.log(`   ✅ Created ${clientIds.length} clients`);

    // ========================================================================
    // PRODUCTS
    // ========================================================================
    console.log("📦 Creating products...");
    const productIds = [];
    for (const product of productData) {
      const [result] = await connection.execute(
        `INSERT INTO products (userId, name, description, rate, unit, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [userId, product.name, product.description, product.rate, product.unit]
      );
      productIds.push(result.insertId);
    }
    console.log(`   ✅ Created ${productIds.length} products`);

    // ========================================================================
    // EXPENSE CATEGORIES
    // ========================================================================
    console.log("📁 Creating expense categories...");
    const categoryIds = [];
    for (const category of expenseCategoryData) {
      const [result] = await connection.execute(
        `INSERT INTO expenseCategories (userId, name, color, icon, createdAt)
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, category.name, category.color, category.icon]
      );
      categoryIds.push(result.insertId);
    }
    console.log(`   ✅ Created ${categoryIds.length} expense categories`);

    // ========================================================================
    // INVOICES
    // ========================================================================
    console.log("📋 Creating invoices...");
    const invoiceStatuses = [
      "draft",
      "sent",
      "sent",
      "paid",
      "paid",
      "paid",
      "overdue",
      "overdue",
    ];
    const invoiceIds = [];

    for (let i = 1; i <= 15; i++) {
      const clientId = clientIds[randomBetween(0, clientIds.length - 1)];
      const status =
        invoiceStatuses[randomBetween(0, invoiceStatuses.length - 1)];
      const issueDate = randomDate(90, 0);
      const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const subtotal = randomDecimal(500, 5000);
      const taxRate = randomBetween(0, 1) ? "10.00" : "0.00";
      const taxAmount = (
        (parseFloat(subtotal) * parseFloat(taxRate)) /
        100
      ).toFixed(2);
      const total = (parseFloat(subtotal) + parseFloat(taxAmount)).toFixed(2);

      let paidAt = null;
      let amountPaid = "0.00";
      if (status === "paid") {
        paidAt = formatDate(
          new Date(
            dueDate.getTime() - randomBetween(1, 20) * 24 * 60 * 60 * 1000
          )
        );
        amountPaid = total;
      }

      const [result] = await connection.execute(
        `INSERT INTO invoices (userId, clientId, invoiceNumber, status, currency, subtotal, taxRate, taxAmount, 
         discountType, discountValue, discountAmount, total, amountPaid, issueDate, dueDate, paidAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, 'percentage', '0', '0', ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          clientId,
          generateInvoiceNumber("INV", i),
          status,
          subtotal,
          taxRate,
          taxAmount,
          total,
          amountPaid,
          formatDate(issueDate),
          formatDate(dueDate),
          paidAt,
        ]
      );
      invoiceIds.push(result.insertId);

      // Add line items
      const numItems = randomBetween(1, 4);
      for (let j = 0; j < numItems; j++) {
        const product = productData[randomBetween(0, productData.length - 1)];
        const quantity = randomBetween(1, 10);
        const rate = product.rate;
        const amount = (quantity * parseFloat(rate)).toFixed(2);

        await connection.execute(
          `INSERT INTO invoiceLineItems (invoiceId, description, quantity, rate, amount, sortOrder, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [result.insertId, product.name, quantity, rate, amount, j]
        );
      }
    }
    console.log(`   ✅ Created ${invoiceIds.length} invoices with line items`);

    // ========================================================================
    // ESTIMATES
    // ========================================================================
    console.log("📄 Creating estimates...");
    const estimateStatuses = [
      "draft",
      "sent",
      "accepted",
      "rejected",
      "expired",
    ];

    for (let i = 1; i <= 5; i++) {
      const clientId = clientIds[randomBetween(0, clientIds.length - 1)];
      const status = estimateStatuses[i - 1];
      const issueDate = randomDate(60, 0);
      const validUntil = new Date(
        issueDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const subtotal = randomDecimal(1000, 10000);
      const taxRate = "10.00";
      const taxAmount = (parseFloat(subtotal) * 0.1).toFixed(2);
      const total = (parseFloat(subtotal) + parseFloat(taxAmount)).toFixed(2);

      const [result] = await connection.execute(
        `INSERT INTO estimates (userId, clientId, estimateNumber, status, currency, subtotal, taxRate, taxAmount,
         discountType, discountValue, discountAmount, total, title, issueDate, validUntil, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, 'percentage', '0', '0', ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          clientId,
          generateInvoiceNumber("EST", i),
          status,
          subtotal,
          taxRate,
          taxAmount,
          total,
          `Project Proposal ${i}`,
          formatDate(issueDate),
          formatDate(validUntil),
        ]
      );

      // Add line items
      const numItems = randomBetween(2, 5);
      for (let j = 0; j < numItems; j++) {
        const product = productData[randomBetween(0, productData.length - 1)];
        const quantity = randomBetween(5, 20);
        const rate = product.rate;
        const amount = (quantity * parseFloat(rate)).toFixed(2);

        await connection.execute(
          `INSERT INTO estimateLineItems (estimateId, description, quantity, rate, amount, sortOrder, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [result.insertId, product.name, quantity, rate, amount, j]
        );
      }
    }
    console.log(`   ✅ Created 5 estimates with line items`);

    // ========================================================================
    // EXPENSES
    // ========================================================================
    console.log("💸 Creating expenses...");
    const paymentMethods = [
      "credit_card",
      "debit_card",
      "bank_transfer",
      "cash",
    ];

    for (let i = 0; i < 20; i++) {
      const categoryId = categoryIds[randomBetween(0, categoryIds.length - 1)];
      const vendor =
        expenseVendors[randomBetween(0, expenseVendors.length - 1)];
      const amount = randomDecimal(20, 500);
      const date = randomDate(90, 0);
      const paymentMethod =
        paymentMethods[randomBetween(0, paymentMethods.length - 1)];
      const isBillable = randomBetween(0, 3) === 0; // 25% billable
      const clientId = isBillable
        ? clientIds[randomBetween(0, clientIds.length - 1)]
        : null;

      await connection.execute(
        `INSERT INTO expenses (userId, categoryId, amount, currency, date, description, vendor, paymentMethod,
         taxAmount, isBillable, clientId, isTaxDeductible, createdAt, updatedAt)
         VALUES (?, ?, ?, 'USD', ?, ?, ?, ?, '0', ?, ?, TRUE, NOW(), NOW())`,
        [
          userId,
          categoryId,
          amount,
          formatDate(date),
          `${vendor} - Monthly subscription`,
          vendor,
          paymentMethod,
          isBillable,
          clientId,
        ]
      );
    }
    console.log(`   ✅ Created 20 expenses`);

    // ========================================================================
    // PAYMENTS (for paid invoices)
    // ========================================================================
    console.log("💳 Creating payment records...");
    const [paidInvoices] = await connection.execute(
      `SELECT id, total, paidAt FROM invoices WHERE userId = ? AND status = 'paid'`,
      [userId]
    );

    for (const invoice of paidInvoices) {
      await connection.execute(
        `INSERT INTO payments (invoiceId, userId, amount, currency, paymentMethod, paymentDate, status, createdAt, updatedAt)
         VALUES (?, ?, ?, 'USD', 'stripe', ?, 'completed', NOW(), NOW())`,
        [invoice.id, userId, invoice.total, invoice.paidAt]
      );
    }
    console.log(`   ✅ Created ${paidInvoices.length} payment records`);

    // ========================================================================
    // Summary
    // ========================================================================
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Development data seeded successfully!\n");
    console.log("📊 Summary:");
    console.log(`   • ${clientIds.length} clients`);
    console.log(`   • ${productIds.length} products`);
    console.log(`   • ${categoryIds.length} expense categories`);
    console.log(`   • ${invoiceIds.length} invoices`);
    console.log(`   • 5 estimates`);
    console.log(`   • 20 expenses`);
    console.log(`   • ${paidInvoices.length} payments`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDevData().catch(console.error);
