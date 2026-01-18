import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function checkColumns() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    const [columns] = await connection.query("SHOW COLUMNS FROM emailLog");
    console.log("\nemailLog table columns:\n");
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    console.log("\n");
  } finally {
    await connection.end();
  }
}

checkColumns();
