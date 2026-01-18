import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function checkEstimatesSchema() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔍 Checking estimates table schema...\n");

    const [columns] = await connection.query("SHOW COLUMNS FROM estimates");
    console.log("Current columns:");
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    console.log("");

    // Try the actual query that's failing
    console.log("Testing the failing query...\n");
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
      console.log(`✅ Query succeeded! Found ${result.length} estimates`);
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
      console.log(`Error code: ${error.code}`);

      // Check if createdAt column exists
      const hasCreatedAt = columns.some(col => col.Field === "createdAt");
      if (!hasCreatedAt) {
        console.log(
          '\n⚠️  Missing "createdAt" column - this is needed for ORDER BY'
        );
      }
    }

    console.log("");
  } finally {
    await connection.end();
  }
}

checkEstimatesSchema();
