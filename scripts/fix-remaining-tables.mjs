import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function fixRemainingTables() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔧 Fixing remaining table issues...\n");

    // 1. Create quickbooksConnections table if it doesn't exist
    const [qbTables] = await connection.query(
      "SHOW TABLES LIKE 'quickbooksConnections'"
    );
    if (qbTables.length === 0) {
      console.log("Creating quickbooksConnections table...");
      await connection.query(`
        CREATE TABLE quickbooksConnections (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          realmId VARCHAR(50),
          companyName VARCHAR(255),
          accessToken TEXT,
          refreshToken TEXT,
          tokenExpiresAt TIMESTAMP NULL,
          refreshTokenExpiresAt TIMESTAMP NULL,
          isActive BOOLEAN DEFAULT FALSE NOT NULL,
          environment ENUM('sandbox', 'production') DEFAULT 'sandbox',
          lastSyncAt TIMESTAMP NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          INDEX idx_userId (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log("✅ quickbooksConnections table created\n");
    } else {
      console.log("✅ quickbooksConnections table exists\n");
    }

    // 2. Check estimates table for missing columns
    console.log("Checking estimates table columns...");
    const [estimateColumns] = await connection.query(
      "SHOW COLUMNS FROM estimates"
    );
    const estimateColumnNames = estimateColumns.map(col => col.Field);

    const requiredEstimateColumns = {
      convertedToInvoiceId: "INT NULL",
    };

    const missingEstimateColumns = Object.keys(requiredEstimateColumns).filter(
      col => !estimateColumnNames.includes(col)
    );

    if (missingEstimateColumns.length > 0) {
      console.log(
        `Adding ${missingEstimateColumns.length} missing columns to estimates...`
      );
      for (const column of missingEstimateColumns) {
        try {
          await connection.query(
            `ALTER TABLE estimates ADD COLUMN ${column} ${requiredEstimateColumns[column]}`
          );
          console.log(`  ✓ Added ${column}`);
        } catch (error) {
          console.log(`  ✗ Failed to add ${column}: ${error.message}`);
        }
      }
      console.log("");
    } else {
      console.log("✅ estimates table has all required columns\n");
    }

    console.log("✅ All remaining issues fixed!\n");
  } finally {
    await connection.end();
  }
}

fixRemainingTables();
