import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function seedEmailHistory() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n📧 Seeding email history...\n");

    const userId = 1;

    // Get clients and their invoices
    const [clients] = await connection.query(
      "SELECT id, email, name FROM clients WHERE userId = ? LIMIT 30",
      [userId]
    );

    const [invoices] = await connection.query(
      "SELECT id, invoiceNumber, createdAt, total FROM invoices WHERE userId = ? LIMIT 100",
      [userId]
    );

    console.log(
      `Found ${clients.length} clients and ${invoices.length} invoices`
    );

    // Email templates
    const emailSubjects = {
      invoice: [
        "Invoice {number} from SleekInvoices",
        "Your invoice {number} is ready",
        "Invoice {number} - Payment due {date}",
        "New Invoice: {number} - {company}",
      ],
      reminder: [
        "Reminder: Invoice {number} is due soon",
        "Payment reminder for invoice {number}",
        "Friendly reminder: Invoice {number} pending",
        "Invoice {number} - Payment overdue",
      ],
      receipt: [
        "Payment received for invoice {number}",
        "Receipt: Invoice {number} paid",
        "Payment confirmation - Invoice {number}",
        "Thank you for your payment - {number}",
      ],
    };

    let emailCount = 0;

    // Generate email history for each invoice
    for (const invoice of invoices) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const invoiceDate = new Date(invoice.createdAt);
      const daysSinceCreation = Math.floor(
        (Date.now() - invoiceDate) / (1000 * 60 * 60 * 24)
      );

      // 1. Initial invoice email (sent when invoice was created)
      const initialSubject = emailSubjects.invoice[
        Math.floor(Math.random() * emailSubjects.invoice.length)
      ].replace("{number}", invoice.invoiceNumber);

      await insertEmailLog(connection, {
        userId,
        invoiceId: invoice.id,
        recipientEmail: client.email,
        subject: initialSubject,
        emailType: "invoice",
        sentAt: new Date(invoiceDate.getTime() + Math.random() * 3600000), // Within 1 hour of creation
        success: Math.random() > 0.05, // 95% success rate
        deliveryStatus: getRandomDeliveryStatus("invoice"),
      });
      emailCount++;

      // 2. Reminder emails (some invoices get reminders)
      if (daysSinceCreation > 7 && Math.random() > 0.3) {
        const reminderDays = [7, 14, 30];
        const numReminders = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numReminders; i++) {
          if (reminderDays[i] <= daysSinceCreation) {
            const reminderDate = new Date(
              invoiceDate.getTime() + reminderDays[i] * 24 * 60 * 60 * 1000
            );
            const reminderSubject = emailSubjects.reminder[
              Math.floor(Math.random() * emailSubjects.reminder.length)
            ].replace("{number}", invoice.invoiceNumber);

            await insertEmailLog(connection, {
              userId,
              invoiceId: invoice.id,
              recipientEmail: client.email,
              subject: reminderSubject,
              emailType: "reminder",
              sentAt: reminderDate,
              success: Math.random() > 0.08, // 92% success rate
              deliveryStatus: getRandomDeliveryStatus("reminder"),
            });
            emailCount++;
          }
        }
      }

      // 3. Receipt emails (some invoices get payment receipts)
      if (Math.random() > 0.4) {
        const paymentDays = Math.floor(Math.random() * daysSinceCreation) + 1;
        const paymentDate = new Date(
          invoiceDate.getTime() + paymentDays * 24 * 60 * 60 * 1000
        );

        if (paymentDate < new Date()) {
          const receiptSubject = emailSubjects.receipt[
            Math.floor(Math.random() * emailSubjects.receipt.length)
          ].replace("{number}", invoice.invoiceNumber);

          await insertEmailLog(connection, {
            userId,
            invoiceId: invoice.id,
            recipientEmail: client.email,
            subject: receiptSubject,
            emailType: "receipt",
            sentAt: paymentDate,
            success: Math.random() > 0.02, // 98% success rate
            deliveryStatus: getRandomDeliveryStatus("receipt"),
          });
          emailCount++;
        }
      }
    }

    console.log(`\n✅ Seeded ${emailCount} email history records\n`);

    // Show statistics
    const [stats] = await connection.query(
      `
      SELECT
        emailType,
        success,
        COUNT(*) as count
      FROM emailLog
      WHERE userId = ?
      GROUP BY emailType, success
      ORDER BY emailType, success
    `,
      [userId]
    );

    console.log("\n📊 Email Statistics:\n");
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

async function insertEmailLog(connection, data) {
  const {
    userId,
    invoiceId,
    recipientEmail,
    subject,
    emailType,
    sentAt,
    success,
    deliveryStatus,
  } = data;

  // Calculate error message based on delivery status
  let errorMessage = null;

  if (!success) {
    if (deliveryStatus === "bounced") {
      errorMessage = [
        "Mailbox full",
        "Invalid recipient",
        "Domain not found",
        "Message too large",
        "Recipient server not responding",
      ][Math.floor(Math.random() * 5)];
    } else if (deliveryStatus === "failed") {
      errorMessage = [
        "Connection timeout",
        "SMTP error",
        "Authentication failed",
        "Rate limit exceeded",
      ][Math.floor(Math.random() * 4)];
    }
  }

  const sentTime = sentAt instanceof Date ? sentAt : new Date(sentAt);

  await connection.query(
    `INSERT INTO emailLog (
      userId, invoiceId, recipientEmail, subject, emailType,
      sentAt, success, errorMessage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      invoiceId,
      recipientEmail,
      subject,
      emailType,
      sentTime,
      success,
      errorMessage,
    ]
  );
}

function getRandomDeliveryStatus(emailType) {
  const statuses = {
    invoice: ["sent", "delivered", "opened", "clicked", "bounced", "failed"],
    reminder: ["sent", "delivered", "opened", "bounced"],
    receipt: ["sent", "delivered", "opened", "clicked"],
  };

  const weights = {
    invoice: [0.05, 0.15, 0.45, 0.25, 0.07, 0.03],
    reminder: [0.1, 0.25, 0.55, 0.1],
    receipt: [0.05, 0.2, 0.6, 0.15],
  };

  const statusList = statuses[emailType];
  const weightList = weights[emailType];

  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < statusList.length; i++) {
    cumulative += weightList[i];
    if (random <= cumulative) {
      return statusList[i];
    }
  }

  return statusList[0];
}

seedEmailHistory();
