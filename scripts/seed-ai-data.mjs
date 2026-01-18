import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function seedAIData() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🤖 Seeding AI and client tags data...\n");

    const userId = 1;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Create AI credits for current month (Pro user gets 50 credits)
    console.log("💰 Creating AI credits for current month...");
    await connection.query(
      `
      INSERT INTO aiCredits (userId, month, creditsUsed, creditsLimit, purchasedCredits)
      VALUES (?, ?, 0, 50, 0)
      ON DUPLICATE KEY UPDATE creditsLimit = 50
    `,
      [userId, currentMonth]
    );
    console.log("   ✓ Created AI credits record (50 credits available)");

    // Create client tags
    console.log("\n🏷️  Creating client tags...");
    const tags = [
      { name: "VIP", color: "#f59e0b", description: "High-value clients" },
      {
        name: "Enterprise",
        color: "#8b5cf6",
        description: "Enterprise-level clients",
      },
      { name: "Startup", color: "#10b981", description: "Startup clients" },
      {
        name: "Long-term",
        color: "#3b82f6",
        description: "Long-term relationships",
      },
      {
        name: "New",
        color: "#ec4899",
        description: "Recently acquired clients",
      },
      {
        name: "At Risk",
        color: "#ef4444",
        description: "Clients at risk of churning",
      },
    ];

    for (const tag of tags) {
      try {
        await connection.query(
          `INSERT INTO clientTags (userId, name, color, description) VALUES (?, ?, ?, ?)`,
          [userId, tag.name, tag.color, tag.description]
        );
        console.log(`   ✓ Created tag: ${tag.name}`);
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(
            `   ✗ Failed to create tag ${tag.name}:`,
            error.message
          );
        }
      }
    }

    // Assign tags to some clients
    console.log("\n🔗 Assigning tags to clients...");
    const [clients] = await connection.query(
      "SELECT id FROM clients WHERE userId = ? LIMIT 20",
      [userId]
    );
    const [tagRecords] = await connection.query(
      "SELECT id, name FROM clientTags WHERE userId = ?",
      [userId]
    );

    for (const client of clients) {
      // Assign 1-3 random tags to each client
      const numTags = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numTags; i++) {
        const tag = tagRecords[Math.floor(Math.random() * tagRecords.length)];

        try {
          await connection.query(
            `INSERT INTO clientTagAssignments (clientId, tagId) VALUES (?, ?)`,
            [client.id, tag.id]
          );
        } catch (error) {
          // Duplicate assignment is ok
          if (error.code !== "ER_DUP_ENTRY") {
            console.error(`   ✗ Failed to assign tag:`, error.message);
          }
        }
      }
    }

    console.log(`   ✓ Assigned tags to ${clients.length} clients`);

    console.log("\n✅ AI and client tags data seeded successfully!\n");
  } finally {
    await connection.end();
  }
}

seedAIData();
