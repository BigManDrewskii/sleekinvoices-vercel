import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);
const connectionConfig = {
  host: url.hostname || "localhost",
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  multipleStatements: true,
};

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

async function seedDashboardData() {
  console.log("🌱 Populating dashboard with rich mock data...\n");

  const connection = await mysql.createConnection(connectionConfig);
  const userId = 1;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  try {
    // Get existing clients
    const [clients] = await connection.query(
      "SELECT id FROM clients WHERE userId = ?",
      [userId]
    );
    console.log(`📊 Found ${clients.length} clients`);

    // Create invoices distributed over the last 6 months for better dashboard charts
    console.log(
      "\n📝 Creating time-distributed invoices for dashboard metrics..."
    );

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: monthDate.getFullYear(),
        month: monthDate.getMonth(),
        start: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        end: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
      });
    }

    let invoiceCount = 0;
    let totalRevenue = 0;
    let paidRevenue = 0;

    for (const month of months) {
      console.log(
        `\n   Month: ${month.start.toLocaleString("default", { month: "long", year: "numeric" })}`
      );

      // Create 15-25 invoices per month
      const invoicesThisMonth = Math.floor(Math.random() * 10) + 15;
      let monthRevenue = 0;
      let monthPaid = 0;

      for (let i = 0; i < invoicesThisMonth; i++) {
        const client = clients[Math.floor(Math.random() * clients.length)];
        const issueDate = getRandomDate(month.start, month.end);

        // Vary invoice amounts
        const amountRanges = [
          { min: 500, max: 2000, weight: 3 }, // Small invoices (30%)
          { min: 2000, max: 10000, weight: 2 }, // Medium invoices (20%)
          { min: 10000, max: 50000, weight: 1 }, // Large invoices (10%)
        ];

        let range = amountRanges[0];
        const totalWeight = amountRanges.reduce((sum, r) => sum + r.weight, 0);
        let random = Math.random() * totalWeight;

        for (const r of amountRanges) {
          random -= r.weight;
          if (random <= 0) {
            range = r;
            break;
          }
        }

        const subtotal = Math.floor(
          Math.random() * (range.max - range.min) + range.min
        );
        const taxRate =
          Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        // Calculate due date
        const dueDate = new Date(issueDate);
        const termsOptions = [7, 15, 30, 45, 60];
        const daysToAdd =
          termsOptions[Math.floor(Math.random() * termsOptions.length)];
        dueDate.setDate(dueDate.getDate() + daysToAdd);

        // Determine status based on date
        let status = "sent";
        let amountPaid = 0;
        let paidAt = null;

        const daysSinceIssue = Math.floor(
          (now - issueDate) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceIssue > 60) {
          // Older invoices: 70% paid, 20% overdue, 10% sent
          const rand = Math.random();
          if (rand < 0.7) {
            status = "paid";
            amountPaid = total;
            paidAt = new Date(
              issueDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
            );
          } else if (rand < 0.9) {
            status = "overdue";
          }
        } else if (daysSinceIssue > 30) {
          // Medium age: 40% paid, 30% sent, 30% overdue
          const rand = Math.random();
          if (rand < 0.4) {
            status = "paid";
            amountPaid = total;
            paidAt = new Date(
              issueDate.getTime() + Math.random() * 25 * 24 * 60 * 60 * 1000
            );
          } else if (rand < 0.7) {
            status = "overdue";
          }
        } else {
          // Recent: 20% paid, 60% sent, 10% overdue, 10% draft
          const rand = Math.random();
          if (rand < 0.2) {
            status = "paid";
            amountPaid = total;
            paidAt = new Date(
              issueDate.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000
            );
          } else if (rand < 0.9) {
            status = "sent";
          } else if (rand < 0.95) {
            status = "overdue";
          } else {
            status = "draft";
          }
        }

        const invoiceNumber = `INV-${issueDate.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

        const [invoiceResult] = await connection.query(
          `INSERT INTO invoices (
            userId, clientId, invoiceNumber, status, issueDate, dueDate, paidAt,
            subtotal, taxRate, taxAmount, discountType, discountValue, discountAmount,
            total, amountPaid, currency, paymentTerms, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            client.id,
            invoiceNumber,
            status,
            issueDate,
            dueDate,
            paidAt,
            subtotal.toFixed(2),
            taxRate,
            taxAmount.toFixed(2),
            "percentage",
            0,
            0,
            total.toFixed(2),
            amountPaid.toFixed(2),
            "USD",
            `Net ${daysToAdd}`,
          ]
        );

        const invoiceId = invoiceResult.insertId;

        // Add 1-3 line items per invoice
        const numLineItems = Math.floor(Math.random() * 3) + 1;
        const descriptions = [
          "Web Development Services",
          "UI/UX Design",
          "Project Management",
          "Technical Consulting",
          "Server Administration",
          "Database Optimization",
          "API Integration",
          "Mobile App Development",
          "Quality Assurance Testing",
          "Content Creation",
          "SEO Services",
          "Marketing Strategy",
          "Cloud Infrastructure Setup",
          "Security Audit",
          "Performance Optimization",
        ];

        for (let j = 0; j < numLineItems; j++) {
          const desc =
            descriptions[Math.floor(Math.random() * descriptions.length)];
          const lineTotal = total / numLineItems;
          const qty = Math.floor(Math.random() * 40) + 1;
          const rate = lineTotal / qty;

          await connection.query(
            `INSERT INTO invoiceLineItems (invoiceId, description, quantity, rate, amount, sortOrder, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [invoiceId, desc, qty, rate.toFixed(2), lineTotal.toFixed(2), j]
          );
        }

        // Add payment record if paid
        if (status === "paid" && paidAt) {
          await connection.query(
            `INSERT INTO payments (invoiceId, userId, amount, paymentMethod, paymentDate, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, 'completed', NOW(), NOW())`,
            [invoiceId, userId, amountPaid.toFixed(2), "bank_transfer", paidAt]
          );
        }

        invoiceCount++;
        monthRevenue += total;
        totalRevenue += total;
        if (status === "paid") {
          monthPaid += total;
          paidRevenue += total;
        }
      }

      console.log(
        `   ✓ ${invoicesThisMonth} invoices | Revenue: $${monthRevenue.toFixed(2)} | Paid: $${monthPaid.toFixed(2)}`
      );
    }

    // Create usage tracking data
    console.log("\n📈 Creating usage tracking data...");
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

      // Invoice count varies between 15-30 per month
      const invoiceCount = Math.floor(Math.random() * 15) + 15;

      await connection.query(
        `INSERT INTO usageTracking (userId, month, invoicesCreated, createdAt, updatedAt)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE invoicesCreated = VALUES(invoicesCreated)`,
        [userId, monthStr, invoiceCount]
      );

      console.log(`   ✓ ${monthStr}: ${invoiceCount} invoices`);
    }

    // Add more expenses for better expense tracking
    console.log("\n💸 Adding more expenses...");
    const [expenseCategories] = await connection.query(
      "SELECT id, name FROM expenseCategories"
    );

    if (expenseCategories.length > 0) {
      for (let i = 0; i < 20; i++) {
        const category =
          expenseCategories[
            Math.floor(Math.random() * expenseCategories.length)
          ];
        const expenseDate = getRandomDate(sixMonthsAgo, now);
        const amount = Math.floor(Math.random() * 5000) + 50;

        const vendors = [
          "Amazon Web Services",
          "Microsoft Azure",
          "Google Cloud",
          "Adobe Inc",
          "Slack Technologies",
          "Zoom Video Communications",
          "Dropbox Inc",
          "GitHub",
          "Stripe",
          "Mailchimp",
          "HubSpot",
          "Salesforce",
          "Atlassian",
          "Figma",
          "Notion",
        ];

        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const description = `${category.name} - ${new Date(expenseDate).toLocaleString("default", { month: "long" })} ${expenseDate.getFullYear()}`;

        await connection.query(
          `INSERT INTO expenses (
            userId, categoryId, amount, description, date, currency, vendor, paymentMethod,
            isRecurring, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
          [
            userId,
            category.id,
            amount.toFixed(2),
            description,
            formatDate(expenseDate),
            "USD",
            vendor,
            "credit_card",
          ]
        );
      }
      console.log(`   ✓ Added 20 expenses`);
    }

    // Create some invoice views for analytics
    console.log("\n👁️  Creating invoice view analytics...");
    const [recentInvoices] = await connection.query(
      'SELECT id FROM invoices WHERE status IN ("sent", "overdue", "paid") ORDER BY RAND() LIMIT 50'
    );

    for (const invoice of recentInvoices) {
      const viewCount = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < viewCount; i++) {
        const viewDate = getRandomDate(
          new Date(invoice.createdAt),
          new Date(
            Math.min(
              now,
              new Date(invoice.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000
            )
          )
        );

        await connection.query(
          `INSERT INTO invoiceViews (invoiceId, viewedAt, createdAt) VALUES (?, ?, NOW())`,
          [invoice.id, viewDate]
        );
      }
    }
    console.log(
      `   ✓ Added view tracking for ${recentInvoices.length} invoices`
    );

    // Update dashboard summary
    console.log("\n✅ Dashboard data population complete!\n");
    console.log("📊 Summary:");
    console.log(`   • Total invoices created: ${invoiceCount}`);
    console.log(`   • Total revenue: $${totalRevenue.toLocaleString()}`);
    console.log(`   • Paid revenue: $${paidRevenue.toLocaleString()}`);
    console.log(
      `   • Payment rate: ${((paidRevenue / totalRevenue) * 100).toFixed(1)}%`
    );
    console.log(
      `   • Average invoice value: $${(totalRevenue / invoiceCount).toFixed(2)}`
    );
    console.log(`   • Expenses tracked: 20+ expenses over 6 months`);
    console.log(`   • Invoice analytics: View tracking enabled`);
    console.log(
      "\n🎉 Your dashboard is now fully populated with rich mock data!\n"
    );
  } catch (error) {
    console.error("❌ Error seeding dashboard data:", error);
  } finally {
    await connection.end();
  }
}

seedDashboardData();
