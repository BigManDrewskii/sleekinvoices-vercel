import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function seedMoreEmails() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n📧 Adding more email variety (reminders & receipts)...\n");

    const userId = 1;

    // Get existing invoices
    const [invoices] = await connection.query(
      "SELECT id, invoiceNumber, createdAt FROM invoices WHERE userId = ? LIMIT 50",
      [userId]
    );

    const [clients] = await connection.query(
      "SELECT email FROM clients WHERE userId = ? LIMIT 20",
      [userId]
    );

    let emailCount = 0;

    // Add reminder emails for older invoices
    for (const invoice of invoices) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const invoiceDate = new Date(invoice.createdAt);
      const daysSinceCreation = Math.floor(
        (Date.now() - invoiceDate) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > 14) {
        // Add 1-3 reminders per invoice
        const numReminders = Math.floor(Math.random() * 3) + 1;
        const reminderDays = [14, 21, 30];

        for (let i = 0; i < numReminders && i < reminderDays.length; i++) {
          if (reminderDays[i] <= daysSinceCreation) {
            const reminderDate = new Date(
              invoiceDate.getTime() + reminderDays[i] * 24 * 60 * 60 * 1000
            );

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
                Math.random() > 0.1, // 90% success rate
                null,
              ]
            );
            emailCount++;
          }
        }
      }
    }

    console.log(`Added ${emailCount} reminder emails`);

    // Add receipt emails for some invoices
    let receiptCount = 0;
    for (const invoice of invoices.slice(0, 30)) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const invoiceDate = new Date(invoice.createdAt);
      const daysSinceCreation = Math.floor(
        (Date.now() - invoiceDate) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > 5) {
        const paymentDays =
          Math.floor(Math.random() * Math.min(daysSinceCreation, 45)) + 1;
        const paymentDate = new Date(
          invoiceDate.getTime() + paymentDays * 24 * 60 * 60 * 1000
        );

        if (paymentDate < new Date()) {
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
    }

    console.log(`Added ${receiptCount} receipt emails`);

    // Get total count
    const [total] = await connection.query(
      "SELECT COUNT(*) as count FROM emailLog WHERE userId = ?",
      [userId]
    );

    console.log(`\n✅ Total emails in database: ${total[0].count}\n`);

    // Show breakdown
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

seedMoreEmails();
