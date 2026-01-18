import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function seedHistoricalEmails() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n📧 Adding historical reminder and receipt emails...\n");

    const userId = 1;

    // Get invoices and clients
    const [invoices] = await connection.query(
      "SELECT id, invoiceNumber FROM invoices WHERE userId = ?",
      [userId]
    );

    const [clients] = await connection.query(
      "SELECT email FROM clients WHERE userId = ?",
      [userId]
    );

    let reminderCount = 0;
    let receiptCount = 0;

    // Helper to generate random dates in the past 6 months
    function randomDate(start, end) {
      return new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const now = new Date();

    // Add 80 reminder emails spread across the last 6 months
    for (let i = 0; i < 80; i++) {
      const invoice = invoices[Math.floor(Math.random() * invoices.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const reminderDate = randomDate(sixMonthsAgo, now);

      const subjects = [
        `Reminder: Invoice ${invoice.invoiceNumber} is due soon`,
        `Payment reminder for invoice ${invoice.invoiceNumber}`,
        `Friendly reminder: Invoice ${invoice.invoiceNumber} pending`,
        `Invoice ${invoice.invoiceNumber} - Payment overdue`,
      ];

      await connection.query(
        `INSERT INTO emailLog (userId, invoiceId, recipientEmail, subject, emailType, sentAt, success, errorMessage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          invoice.id,
          client.email,
          subjects[Math.floor(Math.random() * subjects.length)],
          "reminder",
          reminderDate,
          Math.random() > 0.08, // 92% success rate
          null,
        ]
      );
      reminderCount++;

      if (reminderCount % 20 === 0) {
        console.log(`  Added ${reminderCount} reminders...`);
      }
    }

    console.log(`\n✅ Added ${reminderCount} reminder emails`);

    // Add 60 receipt emails spread across the last 6 months
    for (let i = 0; i < 60; i++) {
      const invoice = invoices[Math.floor(Math.random() * invoices.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const paymentDate = randomDate(sixMonthsAgo, now);

      const subjects = [
        `Payment received for invoice ${invoice.invoiceNumber}`,
        `Receipt: Invoice ${invoice.invoiceNumber} paid`,
        `Payment confirmation - Invoice ${invoice.invoiceNumber}`,
        `Thank you for your payment - ${invoice.invoiceNumber}`,
      ];

      await connection.query(
        `INSERT INTO emailLog (userId, invoiceId, recipientEmail, subject, emailType, sentAt, success, errorMessage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          invoice.id,
          client.email,
          subjects[Math.floor(Math.random() * subjects.length)],
          "receipt",
          paymentDate,
          Math.random() > 0.02, // 98% success rate
          null,
        ]
      );
      receiptCount++;

      if (receiptCount % 20 === 0) {
        console.log(`  Added ${receiptCount} receipts...`);
      }
    }

    console.log(`✅ Added ${receiptCount} receipt emails`);

    // Get total count and breakdown
    const [total] = await connection.query(
      "SELECT COUNT(*) as count FROM emailLog WHERE userId = ?",
      [userId]
    );

    console.log(`\n✅ Total emails in database: ${total[0].count}\n`);

    const [stats] = await connection.query(
      `
      SELECT emailType, success, COUNT(*) as count
      FROM emailLog
      WHERE userId = ?
      GROUP BY emailType, success
      ORDER BY emailType, success
    `,
      [userId]
    );

    console.log("📊 Email Statistics:\n");
    console.log("Type        | Status    | Count");
    console.log("------------|-----------|------");
    for (const stat of stats) {
      const type = stat.emailType.padEnd(11);
      const status = (stat.success ? "Success" : "Failed").padEnd(10);
      console.log(`${type} | ${status} | ${stat.count}`);
    }
    console.log("");
  } finally {
    await connection.end();
  }
}

seedHistoricalEmails();
