import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function checkAndFixColumns() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔍 Checking emailLog table columns...\n");

    const [columns] = await connection.query("SHOW COLUMNS FROM emailLog");
    const existingColumns = columns.map(col => col.Field);

    console.log("Current columns:");
    existingColumns.forEach(col => console.log(`  - ${col}`));

    const expectedColumns = [
      "messageId",
      "deliveryStatus",
      "deliveredAt",
      "openedAt",
      "openCount",
      "clickedAt",
      "clickCount",
      "bouncedAt",
      "bounceType",
      "retryCount",
      "lastRetryAt",
      "nextRetryAt",
    ];

    const missingColumns = expectedColumns.filter(
      col => !existingColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      console.log(`\n🔧 Adding ${missingColumns.length} missing columns...\n`);

      const columnDefinitions = {
        messageId: "VARCHAR(100) NULL",
        deliveryStatus:
          "ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed') DEFAULT 'sent'",
        deliveredAt: "TIMESTAMP NULL",
        openedAt: "TIMESTAMP NULL",
        openCount: "INT DEFAULT 0",
        clickedAt: "TIMESTAMP NULL",
        clickCount: "INT DEFAULT 0",
        bouncedAt: "TIMESTAMP NULL",
        bounceType: "VARCHAR(50) NULL",
        retryCount: "INT DEFAULT 0",
        lastRetryAt: "TIMESTAMP NULL",
        nextRetryAt: "TIMESTAMP NULL",
      };

      for (const column of missingColumns) {
        try {
          await connection.query(
            `ALTER TABLE emailLog ADD COLUMN ${column} ${columnDefinitions[column]}`
          );
          console.log(`✓ Added ${column}`);
        } catch (error) {
          console.log(`✗ Failed to add ${column}: ${error.message}`);
        }
      }

      console.log("\n✅ All columns added!\n");
    } else {
      console.log("\n✅ All expected columns exist!\n");
    }
  } finally {
    await connection.end();
  }
}

checkAndFixColumns();
