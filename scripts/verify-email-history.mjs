import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function verifyEmailHistory() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    const [emails] = await connection.query(`
      SELECT
        id,
        invoiceId,
        recipientEmail,
        subject,
        emailType,
        sentAt,
        success,
        errorMessage
      FROM emailLog
      WHERE userId = 1
      ORDER BY sentAt DESC
      LIMIT 10
    `);

    console.log("\n📧 Recent Email History (Sample):\n");
    emails.forEach(email => {
      console.log(`ID: ${email.id}`);
      console.log(`  Invoice: ${email.invoiceId}`);
      console.log(`  To: ${email.recipientEmail}`);
      console.log(`  Subject: ${email.subject}`);
      console.log(`  Type: ${email.emailType}`);
      console.log(`  Sent: ${email.sentAt.toISOString()}`);
      console.log(`  Status: ${email.success ? "✓ Success" : "✗ Failed"}`);
      if (email.errorMessage) {
        console.log(`  Error: ${email.errorMessage}`);
      }
      console.log("");
    });

    const [total] = await connection.query(
      "SELECT COUNT(*) as count FROM emailLog WHERE userId = 1"
    );
    console.log(`Total emails in database: ${total[0].count}\n`);
  } finally {
    await connection.end();
  }
}

verifyEmailHistory();
