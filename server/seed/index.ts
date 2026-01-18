import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { seedUsers } from "./generators/users";
import { seedTemplates } from "./generators/templates";
import { seedClients } from "./generators/clients";
import { seedProducts } from "./generators/products";
import { seedMetadata } from "./generators/metadata";
import {
  seedInvoices,
  seedRecurringInvoices,
  seedEstimates,
} from "./generators/invoices";
import { seedPayments } from "./generators/payments";
import { seedEmails, seedAiLogs, seedAuditLogs } from "./generators/emails";
import { seedExpenses } from "./generators/expenses";

async function checkEnvironment(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Cannot seed production database!");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
    console.error("❌ Seed only allowed on localhost!");
    console.error(`   Current DATABASE_URL: ${dbUrl}`);
    process.exit(1);
  }
}

async function clearAllTables(db: any): Promise<void> {
  console.log("🗑️  Clearing existing data...");

  const tables = [
    "auditLog",
    "aiUsageLogs",
    "reminderLogs",
    "invoiceGenerationLogs",
    "estimateLineItems",
    "recurringInvoiceLineItems",
    "invoiceCustomFieldValues",
    "invoiceViews",
    "emailLog",
    "payments",
    "invoiceLineItems",
    "invoices",
    "estimates",
    "expenses",
    "recurringInvoices",
    "clientPortalAccess",
    "clientTagAssignments",
    "batchInvoiceTemplateLineItems",
    "batchInvoiceTemplates",
    "customFields",
    "invoiceTemplates",
    "products",
    "clientTags",
    "clients",
    "expenseCategories",
    "aiCredits",
    "usageTracking",
    "reminderSettings",
    "quickbooksPaymentMapping",
    "quickbooksInvoiceMapping",
    "quickbooksCustomerMapping",
    "quickbooksSyncLog",
    "quickbooksSyncSettings",
    "quickbooksConnections",
    "paymentGateways",
    "userWallets",
    "currencies",
    "stripeWebhookEvents",
    "cryptoSubscriptionPayments",
    "users",
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DELETE FROM ${table}`));
    } catch (error: any) {
      if (!error.message.includes("doesn't exist")) {
        console.error(
          `   ⚠️  Warning: Could not clear table ${table}:`,
          error.message
        );
      }
    }
  }

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`ALTER TABLE ${table} AUTO_INCREMENT = 1`));
    } catch (error) {}
  }

  console.log("   ✅ All tables cleared\n");
}

async function seed(): Promise<void> {
  const startTime = Date.now();

  try {
    await checkEnvironment();

    console.log("🌱 Starting database seed...\n");

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    await clearAllTables(db);

    console.log("🌱 Phase 1: Seeding users and basic entities...");
    const seededUsers = await seedUsers(db);
    console.log(`   ✅ Created ${seededUsers.length} users`);

    const seededTemplates = await seedTemplates(db, seededUsers);
    console.log(`   ✅ Created ${seededTemplates.length} templates`);

    const seededProducts = await seedProducts(db, seededUsers);
    console.log(`   ✅ Created ${seededProducts.length} products`);

    console.log("\n🌱 Phase 2: Seeding clients and metadata...");
    const seededClients = await seedClients(db, seededUsers);
    console.log(`   ✅ Created ${seededClients.length} clients`);

    const metadata = await seedMetadata(db, seededUsers, seededClients);
    console.log(`   ✅ Created ${metadata.tags.length} client tags`);
    console.log(
      `   ✅ Created ${metadata.categories.length} expense categories`
    );
    console.log(`   ✅ Created ${metadata.customFields.length} custom fields`);
    console.log(
      `   ✅ Created ${metadata.batchTemplates.length} batch templates`
    );

    console.log("\n🌱 Phase 3: Seeding recurring invoices and estimates...");
    await seedRecurringInvoices(db, seededUsers, seededClients);
    console.log(`   ✅ Created recurring invoices`);

    const seededEstimates = await seedEstimates(db, seededUsers, seededClients);
    console.log(`   ✅ Created ${seededEstimates.length} estimates`);

    console.log("\n🌱 Phase 4: Seeding invoices (this may take a moment)...");
    const seededInvoices = await seedInvoices(
      db,
      seededUsers,
      seededClients,
      seededProducts,
      seededTemplates,
      metadata.customFields
    );
    console.log(`   ✅ Created ${seededInvoices.length} invoices`);

    console.log("\n🌱 Phase 5: Seeding payments...");
    await seedPayments(db, seededInvoices);
    console.log(`   ✅ Created payments and updated invoices`);

    console.log("\n🌱 Phase 6: Seeding emails, expenses, and logs...");
    await seedEmails(db, seededInvoices, seededClients);
    console.log(`   ✅ Created email logs`);

    await seedExpenses(
      db,
      seededUsers,
      seededClients,
      seededInvoices,
      metadata.categories
    );
    console.log(`   ✅ Created expenses`);

    await seedAiLogs(db, seededUsers);
    console.log(`   ✅ Created AI usage logs`);

    await seedAuditLogs(db, seededUsers);
    console.log(`   ✅ Created audit logs`);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log(`\n✅ Database seeded successfully in ${duration}s!\n`);

    console.log("📊 Summary:");
    console.log(`   • ${seededUsers.length} users`);
    console.log(`   • ${seededClients.length} clients`);
    console.log(`   • ${seededProducts.length} products`);
    console.log(`   • ${seededInvoices.length} invoices`);
    console.log(`   • ${seededEstimates.length} estimates`);
    console.log(`   • ${seededTemplates.length} templates`);
    console.log(`   • Payments, expenses, and logs\n`);

    console.log("🎉 Ready to test! Run 'pnpm dev' to start the app.\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
