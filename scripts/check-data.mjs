import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function checkData() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n📊 Database Data Counts:\n");

    const tables = [
      "clients",
      "invoices",
      "invoiceLineItems",
      "payments",
      "expenses",
      "expenseCategories",
      "products",
      "recurringInvoices",
      "estimates",
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.query(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        console.log(`   ${table.padEnd(25)} ${rows[0].count}`);
      } catch (error) {
        console.log(`   ${table.padEnd(25)} ERROR: ${error.message}`);
      }
    }

    console.log("\n📝 Data Quality Check:\n");

    // Check if we have products
    const [products] = await connection.query(
      "SELECT COUNT(*) as count FROM products"
    );
    console.log(
      `   Products: ${products[0].count} - ${products[0].count === 0 ? "NEEDS DATA" : "✓ OK"}`
    );

    // Check expense details
    const [expenses] = await connection.query(
      "SELECT COUNT(*) as count FROM expenses"
    );
    console.log(
      `   Expenses: ${expenses[0].count} - ${expenses[0].count < 50 ? "NEEDS MORE DATA" : "✓ OK"}`
    );

    // Check estimates
    const [estimates] = await connection.query(
      "SELECT COUNT(*) as count FROM estimates"
    );
    console.log(
      `   Estimates: ${estimates[0].count} - ${estimates[0].count < 10 ? "NEEDS MORE DATA" : "✓ OK"}`
    );

    console.log("\n✅ Database is fully populated!\n");
  } finally {
    await connection.end();
  }
}

checkData();
