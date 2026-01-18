import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function seedAllEmailTypes() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n📧 Adding reminder and receipt emails...\n");

    const userId = 1;
    const now = new Date();

    // Get some invoices and clients
    const [invoices] = await connection.query(
      "SELECT id, invoiceNumber, createdAt FROM invoices WHERE userId = ? LIMIT 50",
      [userId]
    );

    const [clients] = await connection.query(
      "SELECT email FROM clients WHERE userId = ?",
      [userId]
    );

    let reminderCount = 0;
    let receiptCount = 0;

    // Add 60 reminder emails
    for (let i = 0; i < 60; i++) {
      const invoice = invoices[Math.floor(Math.random() * invoices.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const invoiceDate = new Date(invoice.createdAt);

      // Create reminders at various intervals (7, 14, 21, 30 days after invoice)
      const reminderDays = [7, 14, 21, 30][Math.floor(Math.random() * 4)];
      const reminderDate = new Date(
        invoiceDate.getTime() + reminderDays * 24 * 60 * 60 * 1000
      );

      // Only add if reminder date is in the past
      if (reminderDate < now) {
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
      }
    }

    console.log(`Added ${reminderCount} reminder emails`);

    // Add 40 receipt emails
    for (let i = 0; i < 40; i++) {
      const invoice = invoices[Math.floor(Math.random() * invoices.length)];
      const client = clients[Math.floor(Math.random() * clients.length)];
      const invoiceDate = new Date(invoice.createdAt);

      // Create receipts at various intervals (1-45 days after invoice)
      const paymentDays = Math.floor(Math.random() * 45) + 1;
      const paymentDate = new Date(
        invoiceDate.getTime() + paymentDays * 24 * 60 * 60 * 1000
      );

      // Only add if payment date is in the past
      if (paymentDate < now) {
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
      }
    }

    console.log(`Added ${receiptCount} receipt emails`);

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

seedAllEmailTypes();
