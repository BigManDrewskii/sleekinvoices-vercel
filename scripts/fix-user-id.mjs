import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function fixUserId() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔍 Fixing user ID mismatch...\n");

    // Find the dev-user-local user (the one used by auth bypass)
    const [devUsers] = await connection.query(
      "SELECT id, email, name, openId FROM users WHERE openId = ?",
      ["dev-user-local"]
    );

    if (devUsers.length === 0) {
      console.log("❌ dev-user-local not found. Creating...");

      const [result] = await connection.query(
        `
        INSERT INTO users (openId, email, name, loginMethod, subscriptionStatus, subscriptionEndDate)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          "dev-user-local",
          "dev@localhost.test",
          "Local Dev User",
          "dev",
          "active",
          new Date("2027-12-31"),
        ]
      );

      console.log(`✅ Created dev-user-local with ID: ${result.insertId}`);

      // Get all user IDs
      const [allUsers] = await connection.query(
        "SELECT id, openId, email FROM users ORDER BY id"
      );
      console.log("\n📋 All users:");
      allUsers.forEach(user => {
        console.log(`   ID ${user.id}: ${user.openId} (${user.email})`);
      });

      const localDevId = result.insertId;

      // Update all data to use this user ID
      console.log("\n🔄 Updating all data to use dev-user-local...");

      await connection.query(
        "UPDATE clients SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE invoices SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE products SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE expenses SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE estimates SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE recurringInvoices SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE expenseCategories SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE invoiceTemplates SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );
      await connection.query(
        "UPDATE usageTracking SET userId = ? WHERE userId != ?",
        [localDevId, localDevId]
      );

      console.log("✅ All data updated to use dev-user-local");
    } else {
      const devUser = devUsers[0];
      console.log(
        `✅ Found dev-user-local: ID=${devUser.id}, Email=${devUser.email}`
      );

      // Update all data to use this user ID
      console.log("\n🔄 Updating all data to use dev-user-local...");

      await connection.query(
        "UPDATE clients SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE invoices SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE products SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE expenses SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE estimates SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE recurringInvoices SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE expenseCategories SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE invoiceTemplates SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );
      await connection.query(
        "UPDATE usageTracking SET userId = ? WHERE userId != ?",
        [devUser.id, devUser.id]
      );

      console.log("✅ All data updated to use dev-user-local");
    }

    // Verify the data is now correct
    const [clients] = await connection.query(
      "SELECT COUNT(*) as count FROM clients"
    );
    const [clientsForUser] = await connection.query(
      "SELECT userId, COUNT(*) as count FROM clients GROUP BY userId"
    );

    console.log("\n📊 Data verification:");
    console.log(`   Total clients: ${clients[0].count}`);
    console.log("   Clients by userId:");
    clientsForUser.forEach(row => {
      console.log(`     userId ${row.userId}: ${row.count} clients`);
    });

    console.log(
      "\n✅ User ID mismatch fixed! Refresh the browser to see data.\n"
    );
  } finally {
    await connection.end();
  }
}

fixUserId();
