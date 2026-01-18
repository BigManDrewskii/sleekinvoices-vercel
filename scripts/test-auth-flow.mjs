import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function testAuthFlow() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔍 Testing auth bypass and client data flow...\n");

    // Check if dev user exists
    const [users] = await connection.query(
      "SELECT id, email, name FROM users WHERE email = ?",
      ["dev@sleekinvoices.local"]
    );

    if (users.length === 0) {
      console.log("❌ Dev user not found! Creating dev user...");

      const [result] = await connection.query(
        `
        INSERT INTO users (email, name, openId, subscriptionStatus, subscriptionEndDate)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          "dev@sleekinvoices.local",
          "Dev User",
          "dev-user-bypass",
          "active",
          new Date("2027-12-31"),
        ]
      );

      console.log(`✅ Created dev user with ID: ${result.insertId}`);
    } else {
      console.log(
        `✅ Dev user found: ID=${users[0].id}, Email=${users[0].email}`
      );
    }

    // Get the dev user ID
    const [devUser] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      ["dev@sleekinvoices.local"]
    );
    const userId = devUser[0].id;

    // Check clients for this user
    const [clients] = await connection.query(
      "SELECT id, name, email FROM clients WHERE userId = ?",
      [userId]
    );
    console.log(`\n📊 Clients for userId=${userId}: ${clients.length} total`);

    if (clients.length > 0) {
      console.log("\nSample clients:");
      clients.slice(0, 5).forEach(client => {
        console.log(`   - ${client.name} (${client.email})`);
      });
    }

    // Check if there are clients with a different userId
    const [otherClients] = await connection.query(
      "SELECT userId, COUNT(*) as count FROM clients GROUP BY userId"
    );
    console.log(`\n📋 Clients by userId:`);
    otherClients.forEach(row => {
      console.log(`   userId ${row.userId}: ${row.count} clients`);
    });

    // If we have clients with a different userId, update them to match dev user
    if (
      otherClients.length > 0 &&
      otherClients.some(row => row.userId !== userId)
    ) {
      console.log(
        `\n⚠️  Found clients with different userId. Updating to match dev user...`
      );

      await connection.query(
        "UPDATE clients SET userId = ? WHERE userId != ?",
        [userId, userId]
      );
      console.log("✅ Updated all clients to use dev user ID");

      // Verify the update
      const [updated] = await connection.query(
        "SELECT COUNT(*) as count FROM clients WHERE userId = ?",
        [userId]
      );
      console.log(
        `   Now have ${updated[0].count} clients for userId=${userId}`
      );
    }

    // Do the same for other related tables
    const tables = [
      "invoices",
      "products",
      "expenses",
      "estimates",
      "recurringInvoices",
      "expenseCategories",
      "invoiceTemplates",
    ];

    console.log("\n🔄 Updating all data to use dev user ID...\n");

    for (const table of tables) {
      try {
        const [result] = await connection.query(
          `
          UPDATE ${table} SET userId = ? WHERE userId != ?
        `,
          [userId, userId]
        );

        if (result.affectedRows > 0) {
          console.log(`   ${table}: Updated ${result.affectedRows} rows`);
        }
      } catch (error) {
        // Table might not have userId column or doesn't exist
        // Ignore
      }
    }

    console.log("\n✅ All data now properly associated with dev user!\n");
  } finally {
    await connection.end();
  }
}

testAuthFlow();
