import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function showAllEmailTypes() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    // Get samples of each type
    const [invoices] = await connection.query(`
      SELECT * FROM emailLog
      WHERE userId = 1 AND emailType = 'invoice'
      ORDER BY RAND()
      LIMIT 3
    `);

    const [reminders] = await connection.query(`
      SELECT * FROM emailLog
      WHERE userId = 1 AND emailType = 'reminder'
      ORDER BY RAND()
      LIMIT 3
    `);

    const [receipts] = await connection.query(`
      SELECT * FROM emailLog
      WHERE userId = 1 AND emailType = 'receipt'
      ORDER BY RAND()
      LIMIT 3
    `);

    console.log("\n📧 Email History - Sample of Each Type:\n");

    console.log("=== INVOICE EMAILS ===\n");
    invoices.forEach(email => {
      console.log(`To: ${email.recipientEmail}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`Sent: ${email.sentAt.toISOString().split("T")[0]}`);
      console.log(
        `Status: ${email.success ? "✓ Success" : "✗ Failed"}${email.errorMessage ? ` (${email.errorMessage})` : ""}\n`
      );
    });

    console.log("=== REMINDER EMAILS ===\n");
    reminders.forEach(email => {
      console.log(`To: ${email.recipientEmail}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`Sent: ${email.sentAt.toISOString().split("T")[0]}`);
      console.log(
        `Status: ${email.success ? "✓ Success" : "✗ Failed"}${email.errorMessage ? ` (${email.errorMessage})` : ""}\n`
      );
    });

    console.log("=== RECEIPT EMAILS ===\n");
    receipts.forEach(email => {
      console.log(`To: ${email.recipientEmail}`);
      console.log(`Subject: ${email.subject}`);
      console.log(`Sent: ${email.sentAt.toISOString().split("T")[0]}`);
      console.log(
        `Status: ${email.success ? "✓ Success" : "✗ Failed"}${email.errorMessage ? ` (${email.errorMessage})` : ""}\n`
      );
    });
  } finally {
    await connection.end();
  }
}

showAllEmailTypes();
