import mysql from "mysql2/promise";

const DATABASE_URL =
  "mysql://sleekinvoices:localdev123@localhost:3306/sleekinvoices_dev";
const url = new URL(DATABASE_URL);

async function testClientsAPI() {
  const connection = await mysql.createConnection({
    host: url.hostname || "localhost",
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  });

  try {
    console.log("\n🔍 Testing clients data...\n");

    // Check if clients exist
    const [clients] = await connection.query(
      "SELECT * FROM clients WHERE userId = 1 LIMIT 5"
    );
    console.log(`Found ${clients.length} clients for userId=1`);

    if (clients.length > 0) {
      console.log("\nSample clients:");
      clients.forEach(client => {
        console.log(
          `   ID: ${client.id}, Name: ${client.name}, Email: ${client.email}`
        );
      });
    }

    // Check client contacts
    const [contacts] = await connection.query(
      "SELECT clientId, COUNT(*) as count FROM clientContacts GROUP BY clientId LIMIT 5"
    );
    console.log(`\nFound contacts for ${contacts.length} clients`);

    // Test the exact query that might be used by the API
    const [allClients] = await connection.query(`
      SELECT
        c.*,
        COUNT(DISTINCT cc.id) as contactCount
      FROM clients c
      LEFT JOIN clientContacts cc ON c.id = cc.clientId
      WHERE c.userId = 1
      GROUP BY c.id
      ORDER BY c.name
      LIMIT 10
    `);

    console.log(`\nAPI query returns ${allClients.length} clients`);

    if (allClients.length === 0) {
      console.log("\n⚠️  WARNING: No clients found for userId=1!");
      console.log("Checking all users...");

      const [users] = await connection.query(
        "SELECT id, email FROM users LIMIT 5"
      );
      console.log("\nUsers in database:");
      users.forEach(user => {
        console.log(`   ID: ${user.id}, Email: ${user.email}`);
      });

      const [allClientsAnyUser] = await connection.query(
        "SELECT userId, COUNT(*) as count FROM clients GROUP BY userId"
      );
      console.log("\nClients by userId:");
      allClientsAnyUser.forEach(row => {
        console.log(`   userId: ${row.userId}, count: ${row.count}`);
      });
    }

    console.log("\n");
  } finally {
    await connection.end();
  }
}

testClientsAPI();
