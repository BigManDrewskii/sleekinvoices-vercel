import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function addEstimatesCurrency() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔧 Adding missing columns to estimates table...\n");

    const [columns] = await connection.query("SHOW COLUMNS FROM estimates");
    const existingColumns = columns.map(col => col.Field);

    const requiredColumns = {
      currency: "VARCHAR(3) DEFAULT 'USD'",
      title: "VARCHAR(255)",
    };

    const missingColumns = Object.keys(requiredColumns).filter(
      col => !existingColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      console.log(`Adding ${missingColumns.length} missing columns...`);
      for (const column of missingColumns) {
        try {
          await connection.query(
            `ALTER TABLE estimates ADD COLUMN ${column} ${requiredColumns[column]}`
          );
          console.log(`  ✓ Added ${column}`);
        } catch (error) {
          console.log(`  ✗ Failed to add ${column}: ${error.message}`);
        }
      }
      console.log("\n✅ All columns added!\n");
    } else {
      console.log("✅ All required columns exist\n");
    }

    // Test the query again
    console.log("Testing the query...\n");
    try {
      const [result] = await connection.query(
        `
        SELECT estimates.id, estimates.estimateNumber, estimates.status, estimates.issueDate,
          estimates.validUntil, estimates.total, estimates.currency, estimates.title,
          estimates.clientId, clients.name, clients.email, estimates.convertedToInvoiceId
        FROM estimates
        LEFT JOIN clients ON estimates.clientId = clients.id
        WHERE estimates.userId = ?
        ORDER BY estimates.createdAt DESC
      `,
        [1]
      );
      console.log(`✅ Query succeeded! Found ${result.length} estimates\n`);
    } catch (error) {
      console.log(`❌ Query still failed: ${error.message}\n`);
    }
  } finally {
    await connection.end();
  }
}

addEstimatesCurrency();
