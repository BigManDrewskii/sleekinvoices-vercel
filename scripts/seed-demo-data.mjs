import mysql from "mysql2/promise";
import { nanoid } from "nanoid";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const connectionConfig = {
  host: url.hostname || "localhost",
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  multipleStatements: true,
};

const demoClients = [
  {
    name: "Acme Corporation",
    email: "billing@acme.com",
    phone: "+1 (555) 123-4567",
    address: "123 Business Ave, Suite 100, New York, NY 10001",
    companyName: "Acme Corporation",
  },
  {
    name: "TechStart Inc",
    email: "finance@techstart.io",
    phone: "+1 (555) 987-6543",
    address: "456 Innovation Drive, San Francisco, CA 94105",
    companyName: "TechStart Inc",
  },
  {
    name: "Global Services Ltd",
    email: "accounts@globalservices.co.uk",
    phone: "+44 20 7123 4567",
    address: "78 Queen Street, London EC1N 8AA, UK",
    companyName: "Global Services Ltd",
  },
  {
    name: "Smith & Associates",
    email: "admin@smithlaw.com",
    phone: "+1 (555) 456-7890",
    address: "101 Legal Plaza, Chicago, IL 60601",
    companyName: "Smith & Associates",
  },
  {
    name: "Creative Studios",
    email: "hello@creativestudios.com",
    phone: "+1 (555) 321-0987",
    address: "222 Art District, Los Angeles, CA 90012",
    companyName: "Creative Studios",
  },
  {
    name: "Mountain View Properties",
    email: "rentals@mtnview.com",
    phone: "+1 (555) 789-0123",
    address: "333 Summit Road, Denver, CO 80202",
    companyName: "Mountain View Properties",
  },
  {
    name: "Pacific Northwest Coffee",
    email: "orders@pnwcoffee.com",
    phone: "+1 (555) 234-5678",
    address: "444 Roasters Way, Seattle, WA 98101",
    companyName: "Pacific Northwest Coffee",
  },
  {
    name: "Digital Dynamics Agency",
    email: "client-services@digitaldynamics.com",
    phone: "+1 (555) 876-5432",
    address: "555 Tech Boulevard, Austin, TX 78701",
    companyName: "Digital Dynamics Agency",
  },
  {
    name: "Green Leaf Organics",
    email: "sales@greenleaforganics.com",
    phone: "+1 (555) 345-6789",
    address: "666 Farm Road, Portland, OR 97201",
    companyName: "Green Leaf Organics",
  },
  {
    name: "Metro Construction Co",
    email: "billing@metroconstruction.com",
    phone: "+1 (555) 210-9876",
    address: "777 Builders Lane, Phoenix, AZ 85001",
    companyName: "Metro Construction Co",
  },
  {
    name: "Sunrise Dental Care",
    email: "office@sunrisedental.com",
    phone: "+1 (555) 654-3210",
    address: "888 Medical Center Dr, Miami, FL 33101",
    companyName: "Sunrise Dental Care",
  },
  {
    name: "Elite Fitness Center",
    email: "membership@elitefitness.com",
    phone: "+1 (555) 098-7654",
    address: "999 Gym Street, Boston, MA 02101",
    companyName: "Elite Fitness Center",
  },
];

const invoiceTemplates = [
  {
    name: "Web Development Retainer",
    description: "Monthly web development and maintenance services",
    rate: 150,
    unit: "hour",
  },
  {
    name: "SEO Consulting Package",
    description: "Monthly SEO optimization and reporting",
    rate: 2000,
    unit: "month",
  },
  {
    name: "Cloud Infrastructure Setup",
    description: "One-time cloud infrastructure configuration",
    rate: 5000,
    unit: "project",
  },
  {
    name: "Content Writing Services",
    description: "Blog posts and marketing copy",
    rate: 100,
    unit: "hour",
  },
  {
    name: "Social Media Management",
    description: "Full-service social media management",
    rate: 1500,
    unit: "month",
  },
  {
    name: "UI/UX Design Services",
    description: "User interface and experience design",
    rate: 175,
    unit: "hour",
  },
  {
    name: "Mobile App Development",
    description: "iOS and Android app development",
    rate: 180,
    unit: "hour",
  },
  {
    name: "Database Optimization",
    description: "Performance tuning and optimization",
    rate: 250,
    unit: "hour",
  },
];

const statuses = ["draft", "sent", "paid", "overdue"];
const paymentTerms = [
  "Net 15",
  "Net 30",
  "Net 60",
  "Due on receipt",
  "Due in 7 days",
];

function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function generateInvoiceNumber(year) {
  const num = Math.floor(Math.random() * 9999) + 1;
  return `INV-${year}-${String(num).padStart(4, "0")}`;
}

async function seedDemoData() {
  console.log("🌱 Starting demo data population...\n");

  const connection = await mysql.createConnection(connectionConfig);

  try {
    const userId = 1;
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const twoMonthsFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Get existing clients
    const [existingClients] = await connection.query("SELECT id FROM clients");
    console.log(`📊 Found ${existingClients.length} existing clients`);

    // Create clients
    console.log("\n👥 Creating clients...");
    for (const client of demoClients) {
      try {
        const [result] = await connection.query(
          "INSERT INTO clients (userId, name, email, phone, address, companyName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())",
          [
            userId,
            client.name,
            client.email,
            client.phone,
            client.address,
            client.companyName,
          ]
        );
        console.log(`   ✓ Created client: ${client.name}`);
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(
            `   ✗ Failed to create client ${client.name}:`,
            error.message
          );
        }
      }
    }

    // Get all clients
    const [clients] = await connection.query(
      "SELECT id FROM clients WHERE userId = ?",
      [userId]
    );
    console.log(`\n📝 Creating invoices for ${clients.length} clients...`);

    let invoiceCount = 0;
    for (const client of clients) {
      // Create 3-6 invoices per client
      const numInvoices = Math.floor(Math.random() * 4) + 3;

      for (let i = 0; i < numInvoices; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const issueDate = getRandomDate(threeMonthsAgo, now);
        let dueDate = new Date(issueDate);

        // Set due date based on payment terms
        const terms =
          paymentTerms[Math.floor(Math.random() * paymentTerms.length)];
        if (terms === "Net 15") dueDate.setDate(dueDate.getDate() + 15);
        else if (terms === "Net 30") dueDate.setDate(dueDate.getDate() + 30);
        else if (terms === "Net 60") dueDate.setDate(dueDate.getDate() + 60);
        else if (terms === "Due in 7 days")
          dueDate.setDate(dueDate.getDate() + 7);

        const invoiceNumber = generateInvoiceNumber(issueDate.getFullYear());

        // Generate line items
        const numLineItems = Math.floor(Math.random() * 4) + 1;
        const lineItems = [];
        let subtotal = 0;

        for (let j = 0; j < numLineItems; j++) {
          const template =
            invoiceTemplates[
              Math.floor(Math.random() * invoiceTemplates.length)
            ];
          const quantity = Math.floor(Math.random() * 40) + 1;
          const rate = template.rate + Math.floor(Math.random() * 50) - 25; // Vary rate slightly
          const amount = quantity * rate;
          subtotal += amount;

          lineItems.push({
            description: template.name,
            quantity,
            rate,
            amount,
          });
        }

        const taxRate =
          Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        // Determine paid amount based on status
        let amountPaid = 0;
        let paidAt = null;
        if (status === "paid") {
          amountPaid = total;
          paidAt = new Date(
            issueDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000
          );
        } else if (status === "sent" || status === "overdue") {
          // Partial payment chance
          if (Math.random() > 0.7) {
            amountPaid = total * (Math.random() * 0.5); // 0-50% paid
          }
        }

        const [invoiceResult] = await connection.query(
          `INSERT INTO invoices (
            userId, clientId, invoiceNumber, status, issueDate, dueDate, paidAt,
            subtotal, taxRate, taxAmount, discountType, discountValue, discountAmount,
            total, amountPaid, notes, paymentTerms, currency, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
            `Thank you for your business! Payment due within ${terms.toLowerCase()}.`,
            terms,
            "USD",
          ]
        );

        const invoiceId = invoiceResult.insertId;

        // Add line items
        for (const item of lineItems) {
          await connection.query(
            `INSERT INTO invoiceLineItems (
              invoiceId, description, quantity, rate, amount, sortOrder, createdAt
            ) VALUES (?, ?, ?, ?, ?, 0, NOW())`,
            [
              invoiceId,
              item.description,
              item.quantity,
              item.rate.toFixed(2),
              item.amount.toFixed(2),
            ]
          );
        }

        // Add payments for paid/partially paid invoices
        if (amountPaid > 0) {
          const paymentDate =
            paidAt ||
            new Date(
              issueDate.getTime() +
                Math.random() * (dueDate.getTime() - issueDate.getTime())
            );
          await connection.query(
            `INSERT INTO payments (
              invoiceId, userId, amount, paymentMethod, paymentDate, status, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, 'completed', NOW(), NOW())`,
            [
              invoiceId,
              userId,
              amountPaid.toFixed(2),
              "bank_transfer",
              paymentDate,
            ]
          );
        }

        invoiceCount++;
        console.log(
          `   ✓ ${invoiceNumber}: ${status.toUpperCase()} - $${total.toFixed(2)} (${clients.length > 5 ? demoClients.find(c => c.name.includes(client.id.toString()))?.name || "Client" : "Client"})`
        );
      }
    }

    // Create some recurring invoices
    console.log("\n🔄 Creating recurring invoices...");
    const [activeClients] = await connection.query(
      "SELECT id FROM clients LIMIT 5"
    );
    const recurringIntervals = ["weekly", "monthly", "yearly"];

    for (const client of activeClients) {
      const interval =
        recurringIntervals[
          Math.floor(Math.random() * recurringIntervals.length)
        ];
      const startDate = getRandomDate(threeMonthsAgo, now);
      let nextDate = new Date(startDate);

      if (interval === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (interval === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      const template =
        invoiceTemplates[Math.floor(Math.random() * invoiceTemplates.length)];
      const invoiceNumber = `REC-${template.name.split(" ")[0].toUpperCase()}`;

      const [recurringResult] = await connection.query(
        `INSERT INTO recurringInvoices (
          userId, clientId, frequency, startDate, nextInvoiceDate,
          invoiceNumberPrefix, taxRate, notes, paymentTerms, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          userId,
          client.id,
          interval,
          formatDate(startDate),
          formatDate(nextDate),
          invoiceNumber,
          Math.floor(Math.random() * 10),
          `Recurring invoice for ${template.name.toLowerCase()}`,
          "Net 30",
        ]
      );

      console.log(
        `   ✓ Created recurring invoice: ${template.name} (${interval})`
      );
    }

    // Create expense categories
    console.log("\n💰 Creating expense categories...");
    const categories = [
      { name: "Software & Tools", color: "#3B82F6", icon: "laptop" },
      { name: "Office Supplies", color: "#10B981", icon: "package" },
      { name: "Marketing", color: "#F59E0B", icon: "megaphone" },
      { name: "Travel", color: "#EF4444", icon: "airplane" },
      { name: "Professional Services", color: "#8B5CF6", icon: "briefcase" },
      { name: "Utilities", color: "#EC4899", icon: "zap" },
    ];

    for (const category of categories) {
      try {
        await connection.query(
          "INSERT INTO expenseCategories (userId, name, color, icon, createdAt) VALUES (?, ?, ?, ?, NOW())",
          [userId, category.name, category.color, category.icon]
        );
        console.log(`   ✓ Created category: ${category.name}`);
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(
            `   ✗ Failed to create category ${category.name}:`,
            error.message
          );
        }
      }
    }

    // Create some expenses
    console.log("\n💸 Creating expenses...");
    const [expenseCategories] = await connection.query(
      "SELECT id, name FROM expenseCategories LIMIT 4"
    );
    const expenses = [
      {
        amount: 99.0,
        description: "Adobe Creative Cloud",
        vendor: "Adobe Inc",
      },
      { amount: 49.0, description: "GitHub Pro Account", vendor: "GitHub" },
      { amount: 299.0, description: "Google Workspace", vendor: "Google" },
      { amount: 150.0, description: "Office supplies", vendor: "Staples" },
      {
        amount: 2500.0,
        description: "Conference attendance",
        vendor: "TechConf 2026",
      },
      {
        amount: 89.0,
        description: "Internet & Phone",
        vendor: "Comcast Business",
      },
    ];

    for (let i = 0; i < expenses.length; i++) {
      const expense = expenses[i];
      const category = expenseCategories[i % expenseCategories.length];
      const expenseDate = getRandomDate(threeMonthsAgo, now);

      await connection.query(
        `INSERT INTO expenses (
          userId, categoryId, amount, description, date, currency, vendor, paymentMethod, isRecurring, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          userId,
          category.id,
          expense.amount.toFixed(2),
          expense.description,
          formatDate(expenseDate),
          "USD",
          expense.vendor,
          "credit_card",
        ]
      );

      console.log(
        `   ✓ Created expense: ${expense.description} - $${expense.amount.toFixed(2)}`
      );
    }

    console.log("\n✨ Demo data population complete!\n");
    console.log("📊 Summary:");
    console.log(`   • Clients: ${demoClients.length}`);
    console.log(`   • Invoices: ${invoiceCount}`);
    console.log(`   • Recurring invoices: ${activeClients.length}`);
    console.log(`   • Expense categories: ${categories.length}`);
    console.log(`   • Expenses: ${expenses.length}`);
    console.log("\n🎉 Your database is now populated with demo data!\n");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
  } finally {
    await connection.end();
  }
}

seedDemoData();
