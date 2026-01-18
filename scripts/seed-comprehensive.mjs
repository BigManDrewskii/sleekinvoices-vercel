import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function seedComprehensiveData() {
  console.log("🌱 Starting comprehensive data population...\n");

  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    const userId = 1;
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Get existing data
    const [clients] = await connection.query(
      "SELECT id FROM clients WHERE userId = ?",
      [userId]
    );
    const [expenseCategories] = await connection.query(
      "SELECT id, name FROM expenseCategories WHERE userId = ?",
      [userId]
    );

    console.log(
      `📊 Found ${clients.length} clients and ${expenseCategories.length} expense categories\n`
    );

    // ============================================
    // 1. POPULATE PRODUCTS
    // ============================================
    console.log("📦 Creating products...");

    const products = [
      {
        name: "Web Development Package",
        description:
          "Complete web development services including frontend, backend, and deployment",
        unit: "project",
        rate: 5000,
        sku: "WEB-DEV-001",
      },
      {
        name: "UI/UX Design",
        description: "User interface and user experience design services",
        unit: "hour",
        rate: 150,
        sku: "UI-UX-001",
      },
      {
        name: "Mobile App Development",
        description: "iOS and Android mobile application development",
        unit: "hour",
        rate: 180,
        sku: "MOB-001",
      },
      {
        name: "Cloud Infrastructure Setup",
        description:
          "AWS/GCP/Azure cloud infrastructure configuration and deployment",
        unit: "project",
        rate: 3500,
        sku: "CLOUD-001",
      },
      {
        name: "Database Optimization",
        description: "Database performance tuning and optimization services",
        unit: "hour",
        rate: 200,
        sku: "DB-001",
      },
      {
        name: "SEO Optimization Package",
        description: "Complete SEO audit and optimization",
        unit: "project",
        rate: 2500,
        sku: "SEO-001",
      },
      {
        name: "Content Writing Services",
        description: "Professional content writing for websites and marketing",
        unit: "hour",
        rate: 100,
        sku: "CONTENT-001",
      },
      {
        name: "Technical Consulting",
        description: "Expert technical consultation and architecture advice",
        unit: "hour",
        rate: 250,
        sku: "TECH-001",
      },
      {
        name: "Security Audit",
        description: "Comprehensive security audit and penetration testing",
        unit: "project",
        rate: 8000,
        sku: "SEC-001",
      },
      {
        name: "API Integration",
        description: "Third-party API integration and development",
        unit: "hour",
        rate: 175,
        sku: "API-001",
      },
      {
        name: "Performance Optimization",
        description: "Application performance optimization and tuning",
        unit: "project",
        rate: 4000,
        sku: "PERF-001",
      },
      {
        name: "Maintenance Retainer",
        description: "Ongoing maintenance and support services",
        unit: "month",
        rate: 1500,
        sku: "MAINT-001",
      },
      {
        name: "Training Sessions",
        description: "Technical training for your team",
        unit: "hour",
        rate: 200,
        sku: "TRAIN-001",
      },
      {
        name: "Code Review",
        description: "Thorough code review and refactoring recommendations",
        unit: "hour",
        rate: 180,
        sku: "REVIEW-001",
      },
      {
        name: "DevOps Implementation",
        description: "CI/CD pipeline setup and DevOps best practices",
        unit: "project",
        rate: 6000,
        sku: "DEVOPS-001",
      },
    ];

    for (const product of products) {
      try {
        await connection.query(
          `INSERT INTO products (userId, name, description, unit, rate, sku, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            product.name,
            product.description,
            product.unit,
            product.rate,
            product.sku,
          ]
        );
        console.log(`   ✓ Created product: ${product.name}`);
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") {
          console.error(
            `   ✗ Failed to create product ${product.name}:`,
            error.message
          );
        }
      }
    }

    // ============================================
    // 2. ADD MORE EXPENSES
    // ============================================
    console.log("\n💸 Adding more expenses...");

    const additionalExpenses = [
      {
        amount: 299.99,
        description: "Adobe Creative Cloud Subscription",
        vendor: "Adobe Inc",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 49.99,
        description: "GitHub Pro Plan",
        vendor: "GitHub",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 1200.0,
        description: "AWS Infrastructure Costs",
        vendor: "Amazon Web Services",
        category: "Software & Tools",
        paymentMethod: "bank_transfer",
        isBillable: true,
      },
      {
        amount: 89.0,
        description: "Google Workspace Business",
        vendor: "Google",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 150.0,
        description: "Office Supplies - Printer Ink",
        vendor: "Staples",
        category: "Office Supplies",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 450.0,
        description: "Marketing Campaign Ads",
        vendor: "Facebook Ads",
        category: "Marketing",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 1200.0,
        description: "Conference Registration",
        vendor: "TechConf 2026",
        category: "Professional Services",
        paymentMethod: "credit_card",
        isBillable: true,
      },
      {
        amount: 850.0,
        description: "Legal Consultation",
        vendor: "Law Firm LLP",
        category: "Professional Services",
        paymentMethod: "bank_transfer",
        isBillable: false,
      },
      {
        amount: 350.0,
        description: "Team Building Event",
        vendor: "Event Venue",
        category: "Marketing",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 180.0,
        description: "Software License - Project Management Tool",
        vendor: "Atlassian",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 2500.0,
        description: "Business Travel - Flight",
        vendor: "Delta Airlines",
        category: "Travel",
        paymentMethod: "credit_card",
        isBillable: true,
      },
      {
        amount: 450.0,
        description: "Hotel Accommodation",
        vendor: "Marriott Hotels",
        category: "Travel",
        paymentMethod: "credit_card",
        isBillable: true,
      },
      {
        amount: 150.0,
        description: "Client Dinner",
        vendor: "Restaurant",
        category: "Marketing",
        paymentMethod: "credit_card",
        isBillable: true,
      },
      {
        amount: 220.0,
        description: "Internet & Phone Service",
        vendor: "Comcast Business",
        category: "Utilities",
        paymentMethod: "bank_transfer",
        isBillable: false,
      },
      {
        amount: 180.0,
        description: "Electric Bill",
        vendor: "Local Utility Co",
        category: "Utilities",
        paymentMethod: "bank_transfer",
        isBillable: false,
      },
      {
        amount: 500.0,
        description: "Online Course - Cloud Certification",
        vendor: "Coursera",
        category: "Professional Services",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 89.0,
        description: "VPN Service Subscription",
        vendor: "NordVPN",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 350.0,
        description: "Cloud Storage - Additional Space",
        vendor: "Dropbox",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 1200.0,
        description: "Annual Software Maintenance",
        vendor: "Microsoft",
        category: "Software & Tools",
        paymentMethod: "bank_transfer",
        isBillable: false,
      },
      {
        amount: 2800.0,
        description: "Hardware - MacBook Pro for Team",
        vendor: "Apple",
        category: "Office Supplies",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 450.0,
        description: "Ergonomic Office Chairs",
        vendor: "Office Furniture Co",
        category: "Office Supplies",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 180.0,
        description: "Accounting Software Subscription",
        vendor: "QuickBooks",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 650.0,
        description: "Graphic Design Assets",
        vendor: "Adobe Stock",
        category: "Marketing",
        paymentMethod: "credit_card",
        isBillable: true,
      },
      {
        amount: 220.0,
        description: "Domain Name Renewals",
        vendor: "GoDaddy",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 1500.0,
        description: "Video Production Equipment",
        vendor: "B&H Photo",
        category: "Marketing",
        paymentMethod: "credit_card",
        isBillable: true,
      },
      {
        amount: 320.0,
        description: "Email Marketing Software",
        vendor: "Mailchimp",
        category: "Marketing",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 180.0,
        description: "Analytics Platform Subscription",
        vendor: "Google Analytics",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 450.0,
        description: "Customer Support Tools",
        vendor: "Zendesk",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 890.0,
        description: "Security Software License",
        vendor: "Norton",
        category: "Software & Tools",
        paymentMethod: "credit_card",
        isBillable: false,
      },
      {
        amount: 1200.0,
        description: "Annual Server Maintenance",
        vendor: "DataCenter Inc",
        category: "Software & Tools",
        paymentMethod: "bank_transfer",
        isBillable: false,
      },
    ];

    for (const expense of additionalExpenses) {
      const expenseDate = getRandomDate(threeMonthsAgo, now);
      const category = expenseCategories.find(c => c.name === expense.category);

      if (!category) {
        console.log(`   ⚠ Category not found: ${expense.category}`);
        continue;
      }

      // Randomly assign to a client if billable
      let clientId = null;
      if (expense.isBillable && clients.length > 0) {
        clientId = clients[Math.floor(Math.random() * clients.length)].id;
      }

      await connection.query(
        `INSERT INTO expenses (
          userId, categoryId, amount, description, date, currency, vendor, paymentMethod,
          isRecurring, taxAmount, isBillable, clientId, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, NOW(), NOW())`,
        [
          userId,
          category.id,
          expense.amount.toFixed(2),
          expense.description,
          formatDate(expenseDate),
          "USD",
          expense.vendor,
          expense.paymentMethod,
          expense.isBillable ? 1 : 0,
          clientId,
        ]
      );
    }

    console.log(`   ✓ Added ${additionalExpenses.length} expenses`);

    // ============================================
    // 3. CREATE ESTIMATES
    // ============================================
    console.log("\n📋 Creating estimates...");

    const estimateData = [
      { status: "accepted", probability: 100 },
      { status: "sent", probability: 60 },
      { status: "sent", probability: 40 },
      { status: "declined", probability: 0 },
      { status: "draft", probability: 50 },
      { status: "accepted", probability: 100 },
      { status: "expired", probability: 0 },
      { status: "sent", probability: 75 },
      { status: "accepted", probability: 100 },
      { status: "sent", probability: 80 },
      { status: "draft", probability: 50 },
      { status: "sent", probability: 70 },
      { status: "declined", probability: 0 },
      { status: "accepted", probability: 100 },
      { status: "sent", probability: 65 },
    ];

    let estimateCount = 0;
    for (const data of estimateData) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const issueDate = getRandomDate(
        threeMonthsAgo,
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      const validUntil = new Date(issueDate);
      validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

      const estimateNumber = `EST-${issueDate.getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;

      // Generate line items
      const numLineItems = Math.floor(Math.random() * 4) + 2;
      let subtotal = 0;
      const lineItems = [];

      for (let i = 0; i < numLineItems; i++) {
        const descriptions = [
          "Website Design & Development",
          "Mobile Application Development",
          "Cloud Infrastructure Setup",
          "Database Design & Implementation",
          "API Development & Integration",
          "UI/UX Design Services",
          "Security Audit & Implementation",
          "Performance Optimization",
        ];
        const desc =
          descriptions[Math.floor(Math.random() * descriptions.length)];
        const qty = Math.floor(Math.random() * 40) + 1;
        const rate = Math.floor(Math.random() * 150) + 50;
        const amount = qty * rate;
        subtotal += amount;

        lineItems.push({
          description: desc,
          quantity: qty,
          rate: amount / qty,
          amount,
        });
      }

      const taxRate = Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      const discountAmount = Math.random() > 0.7 ? total * 0.1 : 0; // 30% have discount

      const [estimateResult] = await connection.query(
        `INSERT INTO estimates (
          userId, clientId, estimateNumber, status, issueDate, validUntil,
          subtotal, taxRate, taxAmount, discountType, discountValue, discountAmount,
          total, notes, probability, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          client.id,
          estimateNumber,
          data.status,
          formatDate(issueDate),
          formatDate(validUntil),
          subtotal.toFixed(2),
          taxRate,
          taxAmount.toFixed(2),
          "percentage",
          10,
          discountAmount.toFixed(2),
          (total - discountAmount).toFixed(2),
          `This estimate is valid for 30 days. Please contact us if you have any questions.`,
          data.probability,
        ]
      );

      const estimateId = estimateResult.insertId;

      // Add line items
      for (const item of lineItems) {
        await connection.query(
          `INSERT INTO estimateLineItems (estimateId, description, quantity, rate, amount, sortOrder, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            estimateId,
            item.description,
            item.quantity,
            item.rate.toFixed(2),
            item.amount.toFixed(2),
            0,
          ]
        );
      }

      estimateCount++;
      console.log(
        `   ✓ ${estimateNumber}: ${data.status.toUpperCase()} - $${total.toFixed(2)}`
      );
    }

    console.log(`   ✓ Created ${estimateCount} estimates`);

    // ============================================
    // 4. IMPROVE CLIENT DATA
    // ============================================
    console.log("\n👥 Improving client data...");

    const clientContacts = [
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        role: "CEO",
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.j@example.com",
        role: "CTO",
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        email: "m.chen@example.com",
        role: "Engineering Manager",
      },
      {
        firstName: "Emily",
        lastName: "Williams",
        email: "emily.w@example.com",
        role: "Finance Director",
      },
      {
        firstName: "David",
        lastName: "Brown",
        email: "d.brown@example.com",
        role: "Project Manager",
      },
      {
        firstName: "Lisa",
        lastName: "Anderson",
        email: "lisa.a@example.com",
        role: "Marketing Director",
      },
      {
        firstName: "James",
        lastName: "Taylor",
        email: "j.taylor@example.com",
        role: "Operations Manager",
      },
      {
        firstName: "Amanda",
        lastName: "Martinez",
        email: "a.martinez@example.com",
        role: "Product Manager",
      },
      {
        firstName: "Robert",
        lastName: "Garcia",
        email: "r.garcia@example.com",
        role: "Technical Lead",
      },
      {
        firstName: "Jennifer",
        lastName: "Davis",
        email: "j.davis@example.com",
        role: "Account Manager",
      },
    ];

    for (const client of clients) {
      // Add 1-2 contacts per client
      const numContacts = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < numContacts; i++) {
        const contact =
          clientContacts[Math.floor(Math.random() * clientContacts.length)];

        await connection.query(
          `INSERT INTO clientContacts (clientId, firstName, lastName, email, role, isPrimary, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            client.id,
            contact.firstName,
            contact.lastName,
            `${contact.firstName.toLowerCase()}.${contact.lastName.toLowerCase()}${client.id}@example.com`,
            contact.role,
            i === 0 ? 1 : 0,
          ]
        );
      }

      // Add notes for some clients
      if (Math.random() > 0.5) {
        const notes = [
          "Prefers communication via email. Weekly status meetings on Mondays.",
          "Key decision maker: CEO. Large budget for Q1 2026 projects.",
          "Requires detailed invoices broken down by project phase.",
          "Prefers Net 60 payment terms. Long-term relationship potential.",
          "Very responsive. Approves estimates quickly.",
          "Needs advance notice for any scope changes.",
          "Prefers video calls over phone. Available 9AM-5PM PST.",
        ];
        const note = notes[Math.floor(Math.random() * notes.length)];

        await connection.query(`UPDATE clients SET notes = ? WHERE id = ?`, [
          note,
          client.id,
        ]);
      }
    }

    console.log(`   ✓ Added contacts and notes to ${clients.length} clients`);

    console.log("\n✅ Comprehensive data population complete!\n");
    console.log("📊 Summary:");
    console.log(`   • Products: ${products.length}`);
    console.log(`   • Additional Expenses: ${additionalExpenses.length}`);
    console.log(`   • Estimates: ${estimateCount}`);
    console.log(`   • Client Contacts: ${clients.length * 2} (average)`);
    console.log(
      "\n🎉 Your database is now fully populated with rich mock data!\n"
    );
  } catch (error) {
    console.error("❌ Error seeding comprehensive data:", error);
  } finally {
    await connection.end();
  }
}

seedComprehensiveData();
