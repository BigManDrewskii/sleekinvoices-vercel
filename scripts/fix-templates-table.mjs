import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function fixTemplatesTable() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔍 Checking invoiceTemplates columns...\n");

    const [columns] = await connection.query(
      "SHOW COLUMNS FROM invoiceTemplates"
    );
    const existingColumns = columns.map(col => col.Field);

    console.log("Current columns:");
    existingColumns.forEach(col => console.log(`  - ${col}`));

    const expectedColumns = {
      templateType:
        "ENUM('sleek', 'classic', 'modern', 'minimal') DEFAULT 'sleek'",
      primaryColor: "VARCHAR(7) DEFAULT '#3b82f6'",
      secondaryColor: "VARCHAR(7) DEFAULT '#6366f1'",
      accentColor: "VARCHAR(7) DEFAULT '#10b981'",
      headingFont: "VARCHAR(50) DEFAULT 'Inter'",
      bodyFont: "VARCHAR(50) DEFAULT 'Inter'",
      fontSize: "INT DEFAULT 14",
      logoUrl: "TEXT",
      logoPosition: "ENUM('left', 'center', 'right') DEFAULT 'left'",
      logoWidth: "INT DEFAULT 200",
      headerLayout: "ENUM('standard', 'minimal', 'bold') DEFAULT 'standard'",
      footerLayout:
        "ENUM('standard', 'minimal', 'detailed') DEFAULT 'standard'",
      showCompanyAddress: "BOOLEAN DEFAULT TRUE NOT NULL",
      showPaymentTerms: "BOOLEAN DEFAULT TRUE NOT NULL",
      showTaxField: "BOOLEAN DEFAULT TRUE NOT NULL",
      showDiscountField: "BOOLEAN DEFAULT TRUE NOT NULL",
      showNotesField: "BOOLEAN DEFAULT TRUE NOT NULL",
      footerText: "TEXT",
      language: "VARCHAR(5) DEFAULT 'en'",
      dateFormat: "VARCHAR(20) DEFAULT 'MM/DD/YYYY'",
    };

    const missingColumns = Object.keys(expectedColumns).filter(
      col => !existingColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      console.log(`\n🔧 Adding ${missingColumns.length} missing columns...\n`);

      for (const column of missingColumns) {
        try {
          await connection.query(
            `ALTER TABLE invoiceTemplates ADD COLUMN ${column} ${expectedColumns[column]}`
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

    // Check if there's a template for userId 1
    const [templates] = await connection.query(
      "SELECT COUNT(*) as count FROM invoiceTemplates WHERE userId = 1"
    );
    if (templates[0].count === 0) {
      console.log("Creating default template for userId 1...\n");
      await connection.query(`
        INSERT INTO invoiceTemplates (userId, name, isDefault, templateType)
        VALUES (1, 'Sleek - Default', TRUE, 'sleek')
      `);
      console.log("✅ Default template created\n");
    } else {
      console.log(`✅ Found ${templates[0].count} template(s) for userId 1\n`);
    }
  } finally {
    await connection.end();
  }
}

fixTemplatesTable();
