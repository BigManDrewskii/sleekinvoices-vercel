import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function checkTemplatesTable() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔍 Checking invoiceTemplates table...\n");

    // Check if table exists
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'invoiceTemplates'"
    );
    if (tables.length === 0) {
      console.log("❌ invoiceTemplates table does not exist");
      console.log("\n🔧 Creating invoiceTemplates table...\n");

      await connection.query(`
        CREATE TABLE invoiceTemplates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          isDefault BOOLEAN DEFAULT FALSE NOT NULL,
          templateType ENUM('sleek', 'classic', 'modern', 'minimal') DEFAULT 'sleek',
          primaryColor VARCHAR(7) DEFAULT '#3b82f6',
          secondaryColor VARCHAR(7) DEFAULT '#6366f1',
          accentColor VARCHAR(7) DEFAULT '#10b981',
          headingFont VARCHAR(50) DEFAULT 'Inter',
          bodyFont VARCHAR(50) DEFAULT 'Inter',
          fontSize INT DEFAULT 14,
          logoUrl TEXT,
          logoPosition ENUM('left', 'center', 'right') DEFAULT 'left',
          logoWidth INT DEFAULT 200,
          headerLayout ENUM('standard', 'minimal', 'bold') DEFAULT 'standard',
          footerLayout ENUM('standard', 'minimal', 'detailed') DEFAULT 'standard',
          showCompanyAddress BOOLEAN DEFAULT TRUE NOT NULL,
          showPaymentTerms BOOLEAN DEFAULT TRUE NOT NULL,
          showTaxField BOOLEAN DEFAULT TRUE NOT NULL,
          showDiscountField BOOLEAN DEFAULT TRUE NOT NULL,
          showNotesField BOOLEAN DEFAULT TRUE NOT NULL,
          footerText TEXT,
          language VARCHAR(5) DEFAULT 'en',
          dateFormat VARCHAR(20) DEFAULT 'MM/DD/YYYY',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          INDEX idx_userId (userId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      console.log("✅ invoiceTemplates table created\n");

      // Insert default template
      await connection.query(`
        INSERT INTO invoiceTemplates (userId, name, isDefault, templateType)
        VALUES (1, 'Sleek - Default', TRUE, 'sleek')
      `);

      console.log("✅ Default template created\n");
    } else {
      console.log("✅ invoiceTemplates table exists");

      // Check if there's a template for userId 1
      const [templates] = await connection.query(
        "SELECT COUNT(*) as count FROM invoiceTemplates WHERE userId = 1"
      );
      if (templates[0].count === 0) {
        console.log(
          "⚠️  No template found for userId 1, creating default...\n"
        );
        await connection.query(`
          INSERT INTO invoiceTemplates (userId, name, isDefault, templateType)
          VALUES (1, 'Sleek - Default', TRUE, 'sleek')
        `);
        console.log("✅ Default template created\n");
      } else {
        console.log(
          `✅ Found ${templates[0].count} template(s) for userId 1\n`
        );
      }
    }
  } finally {
    await connection.end();
  }
}

checkTemplatesTable();
