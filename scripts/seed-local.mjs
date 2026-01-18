#!/usr/bin/env node
/**
 * SleekInvoices Local Development Seed Script
 *
 * This script populates the local database with realistic test data
 * for all features. Run after setting up the database with:
 *
 *   node scripts/seed-local.mjs
 *
 * Prerequisites:
 *   - Docker MySQL container running (docker-compose up -d)
 *   - Database schema pushed (pnpm db:push)
 */

import mysql from "mysql2/promise";

// Configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "sleekinvoices",
  password: process.env.DB_PASSWORD || "localdev123",
  database: process.env.DB_NAME || "sleekinvoices_dev",
};

// Helper to generate random dates
const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

const formatDate = date => date.toISOString().slice(0, 19).replace("T", " ");

// Sample data
const SAMPLE_CLIENTS = [
  {
    name: "Acme Corporation",
    email: "billing@acme.com",
    companyName: "Acme Corp",
    address: "123 Business Ave, New York, NY 10001",
    phone: "+1 (555) 123-4567",
  },
  {
    name: "TechStart Inc",
    email: "accounts@techstart.io",
    companyName: "TechStart Inc",
    address: "456 Innovation Blvd, San Francisco, CA 94105",
    phone: "+1 (555) 234-5678",
  },
  {
    name: "Global Ventures",
    email: "finance@globalventures.com",
    companyName: "Global Ventures LLC",
    address: "789 Enterprise Way, Austin, TX 78701",
    phone: "+1 (555) 345-6789",
  },
  {
    name: "Creative Agency",
    email: "hello@creativeagency.co",
    companyName: "Creative Agency Co",
    address: "321 Design District, Los Angeles, CA 90001",
    phone: "+1 (555) 456-7890",
  },
  {
    name: "DataFlow Systems",
    email: "ap@dataflow.systems",
    companyName: "DataFlow Systems",
    address: "654 Tech Park, Seattle, WA 98101",
    phone: "+1 (555) 567-8901",
  },
  {
    name: "Green Energy Co",
    email: "invoices@greenenergy.co",
    companyName: "Green Energy Corporation",
    address: "987 Sustainable Lane, Denver, CO 80201",
    phone: "+1 (555) 678-9012",
  },
  {
    name: "Retail Plus",
    email: "accounting@retailplus.com",
    companyName: "Retail Plus Inc",
    address: "147 Commerce St, Chicago, IL 60601",
    phone: "+1 (555) 789-0123",
  },
  {
    name: "HealthTech Solutions",
    email: "billing@healthtech.io",
    companyName: "HealthTech Solutions",
    address: "258 Medical Center Dr, Boston, MA 02101",
    phone: "+1 (555) 890-1234",
  },
];

const SAMPLE_PRODUCTS = [
  {
    name: "Web Development",
    description: "Full-stack web development services",
    rate: "150.00",
    unit: "hour",
    category: "Development",
  },
  {
    name: "UI/UX Design",
    description: "User interface and experience design",
    rate: "125.00",
    unit: "hour",
    category: "Design",
  },
  {
    name: "Consulting",
    description: "Technical consulting and advisory",
    rate: "200.00",
    unit: "hour",
    category: "Consulting",
  },
  {
    name: "Project Management",
    description: "Project planning and coordination",
    rate: "100.00",
    unit: "hour",
    category: "Management",
  },
  {
    name: "Monthly Retainer",
    description: "Monthly support and maintenance retainer",
    rate: "2500.00",
    unit: "month",
    category: "Retainer",
  },
  {
    name: "Logo Design",
    description: "Custom logo design package",
    rate: "500.00",
    unit: "project",
    category: "Design",
  },
  {
    name: "SEO Audit",
    description: "Comprehensive SEO analysis and recommendations",
    rate: "750.00",
    unit: "project",
    category: "Marketing",
  },
  {
    name: "API Integration",
    description: "Third-party API integration services",
    rate: "175.00",
    unit: "hour",
    category: "Development",
  },
];

const EXPENSE_CATEGORIES = [
  { name: "Software & Tools", color: "#3b82f6", icon: "laptop" },
  { name: "Office Supplies", color: "#10b981", icon: "package" },
  { name: "Travel", color: "#f59e0b", icon: "plane" },
  { name: "Marketing", color: "#8b5cf6", icon: "megaphone" },
  { name: "Professional Services", color: "#ec4899", icon: "briefcase" },
  { name: "Utilities", color: "#6366f1", icon: "zap" },
];

const INVOICE_TEMPLATES = [
  {
    name: "Sleek Dark",
    templateType: "sleek",
    primaryColor: "#5f6fff",
    secondaryColor: "#252f33",
    accentColor: "#10b981",
    isDefault: true,
  },
  {
    name: "Modern Blue",
    templateType: "modern",
    primaryColor: "#3b82f6",
    secondaryColor: "#1e293b",
    accentColor: "#22c55e",
    isDefault: false,
  },
  {
    name: "Classic Professional",
    templateType: "classic",
    primaryColor: "#1f2937",
    secondaryColor: "#f3f4f6",
    accentColor: "#2563eb",
    isDefault: false,
  },
  {
    name: "Minimal Clean",
    templateType: "minimal",
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    accentColor: "#6366f1",
    isDefault: false,
  },
];

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    // 1. Create dev user
    console.log("👤 Creating development user...");
    const [userResult] = await connection.execute(`
      INSERT INTO users (openId, name, email, loginMethod, role, companyName, baseCurrency, companyAddress, companyPhone, subscriptionStatus)
      VALUES ('dev-user-local', 'Local Dev User', 'dev@localhost', 'dev', 'admin', 'Dev Company LLC', 'USD', '123 Dev Street, Code City, CA 90210', '+1 (555) 000-0000', 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    const userId = userResult.insertId || 1;
    console.log(`   ✓ User created with ID: ${userId}\n`);

    // 2. Create clients
    console.log("👥 Creating sample clients...");
    const clientIds = [];
    for (const client of SAMPLE_CLIENTS) {
      const [result] = await connection.execute(
        `
        INSERT INTO clients (userId, name, email, companyName, address, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
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
    console.log(`   ✓ Created ${clientIds.length} clients\n`);

    // 3. Create products
    console.log("📦 Creating sample products...");
    for (const product of SAMPLE_PRODUCTS) {
      await connection.execute(
        `
        INSERT INTO products (userId, name, description, rate, unit, category, taxable, isActive)
        VALUES (?, ?, ?, ?, ?, ?, true, true)
      `,
        [
          userId,
          product.name,
          product.description,
          product.rate,
          product.unit,
          product.category,
        ]
      );
    }
    console.log(`   ✓ Created ${SAMPLE_PRODUCTS.length} products\n`);

    // 4. Create expense categories
    console.log("📂 Creating expense categories...");
    const categoryIds = [];
    for (const category of EXPENSE_CATEGORIES) {
      const [result] = await connection.execute(
        `
        INSERT INTO expenseCategories (userId, name, color, icon)
        VALUES (?, ?, ?, ?)
      `,
        [userId, category.name, category.color, category.icon]
      );
      categoryIds.push(result.insertId);
    }
    console.log(`   ✓ Created ${categoryIds.length} expense categories\n`);

    // 5. Create invoice templates
    console.log("🎨 Creating invoice templates...");
    for (const template of INVOICE_TEMPLATES) {
      await connection.execute(
        `
        INSERT INTO invoiceTemplates (userId, name, templateType, primaryColor, secondaryColor, accentColor, isDefault, headerLayout, footerLayout)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'standard', 'simple')
      `,
        [
          userId,
          template.name,
          template.templateType,
          template.primaryColor,
          template.secondaryColor,
          template.accentColor,
          template.isDefault,
        ]
      );
    }
    console.log(`   ✓ Created ${INVOICE_TEMPLATES.length} templates\n`);

    // 6. Create invoices with various statuses
    console.log("📄 Creating sample invoices...");
    const now = new Date();
    const statuses = ["draft", "sent", "viewed", "paid", "overdue"];
    let invoiceCount = 0;

    for (let i = 0; i < 25; i++) {
      const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const issueDate = randomDate(
        new Date(now.getFullYear(), now.getMonth() - 3, 1),
        now
      );
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);

      const subtotal = (Math.random() * 5000 + 500).toFixed(2);
      const taxRate = "10.00";
      const taxAmount = (parseFloat(subtotal) * 0.1).toFixed(2);
      const total = (parseFloat(subtotal) + parseFloat(taxAmount)).toFixed(2);
      const amountPaid = status === "paid" ? total : "0.00";

      const invoiceNumber = `INV-${now.getFullYear()}-${String(i + 1).padStart(4, "0")}`;

      const [invoiceResult] = await connection.execute(
        `
        INSERT INTO invoices (userId, clientId, invoiceNumber, status, currency, subtotal, taxRate, taxAmount, total, amountPaid, issueDate, dueDate, notes)
        VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, 'Thank you for your business!')
      `,
        [
          userId,
          clientId,
          invoiceNumber,
          status,
          subtotal,
          taxRate,
          taxAmount,
          total,
          amountPaid,
          formatDate(issueDate),
          formatDate(dueDate),
        ]
      );

      const invoiceId = invoiceResult.insertId;

      // Add 1-4 line items per invoice
      const lineItemCount = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < lineItemCount; j++) {
        const product =
          SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
        const quantity = (Math.random() * 20 + 1).toFixed(2);
        const rate = product.rate;
        const amount = (parseFloat(quantity) * parseFloat(rate)).toFixed(2);

        await connection.execute(
          `
          INSERT INTO invoiceLineItems (invoiceId, description, quantity, rate, amount, sortOrder)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [
            invoiceId,
            `${product.name} - ${product.description}`,
            quantity,
            rate,
            amount,
            j,
          ]
        );
      }

      invoiceCount++;
    }
    console.log(`   ✓ Created ${invoiceCount} invoices with line items\n`);

    // 7. Create expenses
    console.log("💰 Creating sample expenses...");
    const vendors = [
      "Adobe",
      "AWS",
      "Google",
      "Microsoft",
      "Zoom",
      "Slack",
      "Figma",
      "GitHub",
    ];
    let expenseCount = 0;

    for (let i = 0; i < 20; i++) {
      const categoryId =
        categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const amount = (Math.random() * 500 + 10).toFixed(2);
      const date = randomDate(
        new Date(now.getFullYear(), now.getMonth() - 3, 1),
        now
      );

      await connection.execute(
        `
        INSERT INTO expenses (userId, categoryId, amount, currency, date, vendor, description, isTaxDeductible)
        VALUES (?, ?, ?, 'USD', ?, ?, ?, true)
      `,
        [
          userId,
          categoryId,
          amount,
          formatDate(date),
          vendor,
          `${vendor} subscription/service`,
        ]
      );

      expenseCount++;
    }
    console.log(`   ✓ Created ${expenseCount} expenses\n`);

    // 8. Create usage tracking for current month
    console.log("📊 Creating usage tracking...");
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await connection.execute(
      `
      INSERT INTO usageTracking (userId, month, invoicesCreated)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE invoicesCreated = VALUES(invoicesCreated)
    `,
      [userId, currentMonth, invoiceCount]
    );
    console.log(`   ✓ Usage tracking set for ${currentMonth}\n`);

    // 9. Create reminder settings
    console.log("⏰ Creating reminder settings...");
    await connection.execute(
      `
      INSERT INTO reminderSettings (userId, enabled, intervals, emailTemplate)
      VALUES (?, 1, '[3, 7, 14]', 'Dear {{clientName}},\\n\\nThis is a friendly reminder that invoice {{invoiceNumber}} for {{total}} is now {{daysOverdue}} days overdue.\\n\\nPlease arrange payment at your earliest convenience.\\n\\nBest regards,\\n{{companyName}}')
      ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)
    `,
      [userId]
    );
    console.log(`   ✓ Reminder settings configured\n`);

    // 10. Create sample estimates
    console.log("📋 Creating sample estimates...");
    for (let i = 0; i < 5; i++) {
      const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
      const status = ["draft", "sent", "accepted"][
        Math.floor(Math.random() * 3)
      ];
      const issueDate = randomDate(
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
        now
      );
      const validUntil = new Date(issueDate);
      validUntil.setDate(validUntil.getDate() + 30);

      const subtotal = (Math.random() * 10000 + 1000).toFixed(2);
      const taxRate = "10.00";
      const taxAmount = (parseFloat(subtotal) * 0.1).toFixed(2);
      const total = (parseFloat(subtotal) + parseFloat(taxAmount)).toFixed(2);

      const estimateNumber = `EST-${now.getFullYear()}-${String(i + 1).padStart(4, "0")}`;

      await connection.execute(
        `
        INSERT INTO estimates (userId, clientId, estimateNumber, status, currency, subtotal, taxRate, taxAmount, total, issueDate, validUntil, notes)
        VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, 'This estimate is valid for 30 days.')
      `,
        [
          userId,
          clientId,
          estimateNumber,
          status,
          subtotal,
          taxRate,
          taxAmount,
          total,
          formatDate(issueDate),
          formatDate(validUntil),
        ]
      );
    }
    console.log(`   ✓ Created 5 estimates\n`);

    console.log("✅ Database seeding completed successfully!\n");
    console.log("📝 Summary:");
    console.log(`   • 1 development user (dev-user-local)`);
    console.log(`   • ${clientIds.length} clients`);
    console.log(`   • ${SAMPLE_PRODUCTS.length} products`);
    console.log(`   • ${categoryIds.length} expense categories`);
    console.log(`   • ${INVOICE_TEMPLATES.length} invoice templates`);
    console.log(`   • ${invoiceCount} invoices`);
    console.log(`   • ${expenseCount} expenses`);
    console.log(`   • 5 estimates`);
    console.log("\n🚀 You can now start the dev server with: pnpm dev\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch(console.error);
