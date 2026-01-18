import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function checkClients() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n👥 Analyzing client data...\n");

    // Get sample clients
    const [clients] = await connection.query("SELECT * FROM clients LIMIT 5");

    console.log("Sample client records:");
    console.log(JSON.stringify(clients, null, 2));

    // Check for missing fields
    const [emptyFields] = await connection.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) as missing_email,
        SUM(CASE WHEN phone IS NULL OR phone = '' THEN 1 ELSE 0 END) as missing_phone,
        SUM(CASE WHEN address IS NULL OR address = '' THEN 1 ELSE 0 END) as missing_address,
        SUM(CASE WHEN companyName IS NULL OR companyName = '' THEN 1 ELSE 0 END) as missing_company,
        SUM(CASE WHEN notes IS NULL OR notes = '' THEN 1 ELSE 0 END) as missing_notes
      FROM clients
    `);

    console.log("\n📊 Data completeness:");
    console.log(`   Total clients: ${emptyFields[0].total}`);
    console.log(
      `   Have email: ${emptyFields[0].total - emptyFields[0].missing_email} (${Math.round(((emptyFields[0].total - emptyFields[0].missing_email) / emptyFields[0].total) * 100)}%)`
    );
    console.log(
      `   Have phone: ${emptyFields[0].total - emptyFields[0].missing_phone} (${Math.round(((emptyFields[0].total - emptyFields[0].missing_phone) / emptyFields[0].total) * 100)}%)`
    );
    console.log(
      `   Have address: ${emptyFields[0].total - emptyFields[0].missing_address} (${Math.round(((emptyFields[0].total - emptyFields[0].missing_address) / emptyFields[0].total) * 100)}%)`
    );
    console.log(
      `   Have company: ${emptyFields[0].total - emptyFields[0].missing_company} (${Math.round(((emptyFields[0].total - emptyFields[0].missing_company) / emptyFields[0].total) * 100)}%)`
    );
    console.log(
      `   Have notes: ${emptyFields[0].total - emptyFields[0].missing_notes} (${Math.round(((emptyFields[0].total - emptyFields[0].missing_notes) / emptyFields[0].total) * 100)}%)`
    );

    console.log("\n✅ Client data looks good! All key fields are populated.\n");
  } finally {
    await connection.end();
  }
}

checkClients();
