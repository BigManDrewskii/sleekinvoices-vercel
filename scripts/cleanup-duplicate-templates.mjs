/**
 * Cleanup Duplicate Templates Script
 *
 * This script removes duplicate invoice templates from the database,
 * keeping only one instance of each template type per user.
 *
 * For each user, it keeps the OLDEST template of each type and removes newer duplicates.
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.ts";
import { eq, and, ne } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🔍 Analyzing invoice templates...\n");

// Get all templates grouped by user and template name
const allTemplates = await db
  .select()
  .from(schema.invoiceTemplates)
  .orderBy(
    schema.invoiceTemplates.userId,
    schema.invoiceTemplates.name,
    schema.invoiceTemplates.createdAt
  );

// Group templates by user
const templatesByUser = {};
for (const template of allTemplates) {
  if (!templatesByUser[template.userId]) {
    templatesByUser[template.userId] = {};
  }
  if (!templatesByUser[template.userId][template.name]) {
    templatesByUser[template.userId][template.name] = [];
  }
  templatesByUser[template.userId][template.name].push(template);
}

// Find duplicates
let totalDuplicates = 0;
const templatesToDelete = [];

for (const [userId, templates] of Object.entries(templatesByUser)) {
  console.log(`\n👤 User ID: ${userId}`);

  for (const [name, instances] of Object.entries(templates)) {
    if (instances.length > 1) {
      console.log(
        `  📋 "${name}": ${instances.length} instances (keeping oldest, removing ${instances.length - 1})`
      );

      // Keep the first (oldest) instance, mark rest for deletion
      for (let i = 1; i < instances.length; i++) {
        templatesToDelete.push(instances[i].id);
        totalDuplicates++;
      }
    }
  }
}

console.log(`\n📊 Summary:`);
console.log(`  Total templates: ${allTemplates.length}`);
console.log(`  Duplicates to remove: ${totalDuplicates}`);
console.log(
  `  Templates after cleanup: ${allTemplates.length - totalDuplicates}`
);

if (totalDuplicates === 0) {
  console.log("\n✅ No duplicates found! Database is clean.");
  await connection.end();
  process.exit(0);
}

// Ask for confirmation
console.log(`\n⚠️  About to delete ${totalDuplicates} duplicate templates.`);
console.log("   This action cannot be undone!");
console.log("\nProceed with deletion? (yes/no)");

// Read user input
const readline = await import("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("> ", async answer => {
  if (answer.toLowerCase() !== "yes") {
    console.log("\n❌ Deletion cancelled.");
    await connection.end();
    rl.close();
    process.exit(0);
  }

  console.log("\n🗑️  Deleting duplicates...");

  // Delete duplicates in batches
  const batchSize = 50;
  let deleted = 0;

  for (let i = 0; i < templatesToDelete.length; i += batchSize) {
    const batch = templatesToDelete.slice(i, i + batchSize);

    for (const id of batch) {
      await db
        .delete(schema.invoiceTemplates)
        .where(eq(schema.invoiceTemplates.id, id));
      deleted++;
    }

    console.log(`  Deleted ${deleted}/${totalDuplicates} duplicates...`);
  }

  console.log(`\n✅ Successfully deleted ${deleted} duplicate templates!`);
  console.log("   Database cleanup complete.");

  await connection.end();
  rl.close();
  process.exit(0);
});
