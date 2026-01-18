import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function checkDates() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    const [invoices] = await connection.query(`
      SELECT id, invoiceNumber, createdAt
      FROM invoices
      WHERE userId = 1
      ORDER BY createdAt DESC
      LIMIT 10
    `);

    console.log("\n📅 Recent Invoice Dates:\n");
    const now = new Date();
    invoices.forEach(inv => {
      const invDate = new Date(inv.createdAt);
      const daysAgo = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
      console.log(
        `${inv.invoiceNumber}: ${invDate.toISOString()} (${daysAgo} days ago)`
      );
    });
    console.log("");
  } finally {
    await connection.end();
  }
}

checkDates();
