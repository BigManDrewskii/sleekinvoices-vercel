import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function createAllMissingTables() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    multipleStatements: true,
  });

  try {
    console.log("\n🔨 Creating all missing database tables...\n");

    // Create emailLog table
    console.log("Creating emailLog table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS emailLog (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        invoiceId INT NOT NULL,
        recipientEmail VARCHAR(320) NOT NULL,
        subject TEXT NOT NULL,
        emailType ENUM('invoice', 'reminder', 'receipt') NOT NULL,
        sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        success BOOLEAN DEFAULT TRUE NOT NULL,
        errorMessage TEXT,
        messageId VARCHAR(100),
        deliveryStatus ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed') DEFAULT 'sent',
        deliveredAt TIMESTAMP NULL,
        openedAt TIMESTAMP NULL,
        openCount INT DEFAULT 0,
        clickedAt TIMESTAMP NULL,
        clickCount INT DEFAULT 0,
        bouncedAt TIMESTAMP NULL,
        bounceType VARCHAR(50),
        retryCount INT DEFAULT 0,
        lastRetryAt TIMESTAMP NULL,
        nextRetryAt TIMESTAMP NULL,
        INDEX idx_userId (userId),
        INDEX idx_invoiceId (invoiceId),
        INDEX idx_sentAt (sentAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("   ✓ emailLog table created");

    // Add missing columns to payments table if needed
    console.log("\nChecking payments table for missing columns...");
    const [paymentColumns] = await connection.query(
      "SHOW COLUMNS FROM payments"
    );
    const paymentColumnNames = paymentColumns.map(col => col.Field);

    const requiredPaymentColumns = [
      {
        name: "stripePaymentIntentId",
        sql: "stripePaymentIntentId VARCHAR(255)",
      },
      { name: "cryptoAmount", sql: "cryptoAmount DECIMAL(24,8)" },
      { name: "cryptoCurrency", sql: "cryptoCurrency VARCHAR(10)" },
      { name: "cryptoNetwork", sql: "cryptoNetwork VARCHAR(50)" },
      { name: "cryptoTxHash", sql: "cryptoTxHash TEXT" },
      { name: "cryptoWalletAddress", sql: "cryptoWalletAddress TEXT" },
    ];

    for (const col of requiredPaymentColumns) {
      if (!paymentColumnNames.includes(col.name)) {
        try {
          await connection.query(
            `ALTER TABLE payments ADD COLUMN ${col.sql} NULL`
          );
          console.log(`   ✓ Added ${col.name} to payments`);
        } catch (error) {
          console.log(`   ⚠️  Could not add ${col.name}: ${error.message}`);
        }
      }
    }

    // Add missing columns to invoices table if needed
    console.log("\nChecking invoices table for missing columns...");
    const [invoiceColumns] = await connection.query(
      "SHOW COLUMNS FROM invoices"
    );
    const invoiceColumnNames = invoiceColumns.map(col => col.Field);

    const requiredInvoiceColumns = [
      { name: "stripePaymentLinkId", sql: "stripePaymentLinkId VARCHAR(255)" },
      { name: "stripePaymentLinkUrl", sql: "stripePaymentLinkUrl TEXT" },
      { name: "stripeSessionId", sql: "stripeSessionId VARCHAR(255)" },
      { name: "sentAt", sql: "sentAt TIMESTAMP NULL" },
    ];

    for (const col of requiredInvoiceColumns) {
      if (!invoiceColumnNames.includes(col.name)) {
        try {
          await connection.query(
            `ALTER TABLE invoices ADD COLUMN ${col.sql} NULL`
          );
          console.log(`   ✓ Added ${col.name} to invoices`);
        } catch (error) {
          console.log(`   ⚠️  Could not add ${col.name}: ${error.message}`);
        }
      }
    }

    console.log("\n✅ All missing tables and columns created!\n");
  } finally {
    await connection.end();
  }
}

createAllMissingTables();
