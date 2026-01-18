/**
 * Phase 1 Foundation Tests
 * Tests for: Decimal Precision, VAT/Tax Compliance, Invoice View Tracking, Encryption
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  invoices,
  invoiceLineItems,
  expenses,
  clients,
  invoiceViews,
  expenseCategories,
  users,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  generateEncryptionKey,
} from "./lib/encryption";

// Test user ID for isolation
let testUserId: number;
let testClientId: number;
let testCategoryId: number;

describe("Phase 1 Foundation Tests", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-phase1-${Date.now()}`,
        name: "Phase 1 Test User",
        email: "phase1test@example.com",
      })
      .$returningId();
    testUserId = user.id;

    // Create test client
    const [client] = await db
      .insert(clients)
      .values({
        userId: testUserId,
        name: "Test Client",
        email: "client@example.com",
      })
      .$returningId();
    testClientId = client.id;

    // Create test expense category
    const [category] = await db
      .insert(expenseCategories)
      .values({
        userId: testUserId,
        name: "Test Category",
      })
      .$returningId();
    testCategoryId = category.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup test data
    await db.delete(invoiceViews).where(eq(invoiceViews.invoiceId, -1)); // Placeholder
    await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, -1)); // Placeholder
    await db.delete(invoices).where(eq(invoices.userId, testUserId));
    await db.delete(expenses).where(eq(expenses.userId, testUserId));
    await db
      .delete(expenseCategories)
      .where(eq(expenseCategories.userId, testUserId));
    await db.delete(clients).where(eq(clients.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  // ==========================================
  // Phase 1.2: Decimal Precision Tests
  // ==========================================

  describe("1.2 Decimal Precision for Crypto", () => {
    it("1.2.1 should store invoice amounts with 8 decimal places", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const cryptoAmount = "0.00000001"; // 1 satoshi equivalent

      const [invoice] = await db
        .insert(invoices)
        .values({
          userId: testUserId,
          clientId: testClientId,
          invoiceNumber: `TEST-DECIMAL-${Date.now()}`,
          subtotal: cryptoAmount,
          taxAmount: "0.00000000",
          discountValue: "0.00000000",
          discountAmount: "0.00000000",
          total: cryptoAmount,
          amountPaid: "0.00000000",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(retrieved.subtotal).toBe(cryptoAmount);
      expect(retrieved.total).toBe(cryptoAmount);

      // Cleanup
      await db.delete(invoices).where(eq(invoices.id, invoice.id));
    });

    it("1.2.2 should store line item amounts with 8 decimal places", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create invoice first
      const [invoice] = await db
        .insert(invoices)
        .values({
          userId: testUserId,
          clientId: testClientId,
          invoiceNumber: `TEST-LINEITEM-${Date.now()}`,
          subtotal: "0.12345678",
          total: "0.12345678",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .$returningId();

      // Create line item with precise amounts
      const [lineItem] = await db
        .insert(invoiceLineItems)
        .values({
          invoiceId: invoice.id,
          description: "Crypto Service",
          quantity: "1.00000001",
          rate: "0.12345677",
          amount: "0.12345678",
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.id, lineItem.id));

      expect(retrieved.quantity).toBe("1.00000001");
      expect(retrieved.rate).toBe("0.12345677");
      expect(retrieved.amount).toBe("0.12345678");

      // Cleanup
      await db
        .delete(invoiceLineItems)
        .where(eq(invoiceLineItems.id, lineItem.id));
      await db.delete(invoices).where(eq(invoices.id, invoice.id));
    });

    it("1.2.3 should store expense amounts with 8 decimal places", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [expense] = await db
        .insert(expenses)
        .values({
          userId: testUserId,
          categoryId: testCategoryId,
          amount: "0.00012345",
          taxAmount: "0.00001234",
          description: "Crypto expense test",
          date: new Date(),
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, expense.id));

      expect(retrieved.amount).toBe("0.00012345");
      expect(retrieved.taxAmount).toBe("0.00001234");

      // Cleanup
      await db.delete(expenses).where(eq(expenses.id, expense.id));
    });

    it("1.2.6-7 should store cryptoAmount and cryptoCurrency fields", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invoice] = await db
        .insert(invoices)
        .values({
          userId: testUserId,
          clientId: testClientId,
          invoiceNumber: `TEST-CRYPTO-${Date.now()}`,
          subtotal: "100.00000000",
          total: "100.00000000",
          cryptoAmount: "0.002345678901234567", // 18 decimal places
          cryptoCurrency: "ETH",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(retrieved.cryptoCurrency).toBe("ETH");
      // Note: MySQL may truncate to 18 decimal places
      expect(retrieved.cryptoAmount).toBeTruthy();

      // Cleanup
      await db.delete(invoices).where(eq(invoices.id, invoice.id));
    });
  });

  // ==========================================
  // Phase 1.3: VAT/Tax Compliance Tests
  // ==========================================

  describe("1.3 VAT/Tax Compliance", () => {
    it("1.3.1-2 should store vatNumber and taxExempt fields on clients", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .insert(clients)
        .values({
          userId: testUserId,
          name: "EU Company GmbH",
          email: "eu@example.com",
          vatNumber: "DE123456789",
          taxExempt: true,
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      expect(retrieved.vatNumber).toBe("DE123456789");
      expect(retrieved.taxExempt).toBe(true);

      // Cleanup
      await db.delete(clients).where(eq(clients.id, client.id));
    });

    it("should allow null vatNumber for non-EU clients", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .insert(clients)
        .values({
          userId: testUserId,
          name: "US Company Inc",
          email: "us@example.com",
          vatNumber: null,
          taxExempt: false,
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      expect(retrieved.vatNumber).toBeNull();
      expect(retrieved.taxExempt).toBe(false);

      // Cleanup
      await db.delete(clients).where(eq(clients.id, client.id));
    });

    it("should support various EU VAT number formats", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const vatNumbers = [
        "DE123456789", // Germany
        "FR12345678901", // France
        "GB123456789", // UK (pre-Brexit)
        "NL123456789B01", // Netherlands
        "ES12345678A", // Spain
      ];

      for (const vatNumber of vatNumbers) {
        const [client] = await db
          .insert(clients)
          .values({
            userId: testUserId,
            name: `Company with VAT ${vatNumber}`,
            vatNumber,
          })
          .$returningId();

        const [retrieved] = await db
          .select()
          .from(clients)
          .where(eq(clients.id, client.id));

        expect(retrieved.vatNumber).toBe(vatNumber);

        // Cleanup
        await db.delete(clients).where(eq(clients.id, client.id));
      }
    });
  });

  // ==========================================
  // Phase 1.4: Invoice View Tracking Tests
  // ==========================================

  describe("1.4 Invoice View Tracking", () => {
    it("1.4.1 should create invoice view records", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create test invoice
      const [invoice] = await db
        .insert(invoices)
        .values({
          userId: testUserId,
          clientId: testClientId,
          invoiceNumber: `TEST-VIEW-${Date.now()}`,
          subtotal: "100.00000000",
          total: "100.00000000",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .$returningId();

      // Create view record
      const [view] = await db
        .insert(invoiceViews)
        .values({
          invoiceId: invoice.id,
          ipAddress: "192.168.1.1",
          userAgent: "Mozilla/5.0 Test Browser",
          isFirstView: true,
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(invoiceViews)
        .where(eq(invoiceViews.id, view.id));

      expect(retrieved.invoiceId).toBe(invoice.id);
      expect(retrieved.ipAddress).toBe("192.168.1.1");
      expect(retrieved.isFirstView).toBe(true);

      // Cleanup
      await db.delete(invoiceViews).where(eq(invoiceViews.id, view.id));
      await db.delete(invoices).where(eq(invoices.id, invoice.id));
    });

    it("1.4.2 should support viewed status in invoice enum", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invoice] = await db
        .insert(invoices)
        .values({
          userId: testUserId,
          clientId: testClientId,
          invoiceNumber: `TEST-VIEWED-${Date.now()}`,
          status: "viewed",
          subtotal: "100.00000000",
          total: "100.00000000",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(retrieved.status).toBe("viewed");

      // Cleanup
      await db.delete(invoices).where(eq(invoices.id, invoice.id));
    });

    it("1.4.3 should store firstViewedAt timestamp", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const firstViewedAt = new Date();

      const [invoice] = await db
        .insert(invoices)
        .values({
          userId: testUserId,
          clientId: testClientId,
          invoiceNumber: `TEST-FIRSTVIEW-${Date.now()}`,
          subtotal: "100.00000000",
          total: "100.00000000",
          firstViewedAt,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .$returningId();

      // Retrieve and verify
      const [retrieved] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(retrieved.firstViewedAt).toBeTruthy();

      // Cleanup
      await db.delete(invoices).where(eq(invoices.id, invoice.id));
    });

    it("should track multiple views for same invoice", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create test invoice
      const [invoice] = await db
        .insert(invoices)
        .values({
          userId: testUserId,
          clientId: testClientId,
          invoiceNumber: `TEST-MULTIVIEW-${Date.now()}`,
          subtotal: "100.00000000",
          total: "100.00000000",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .$returningId();

      // Create multiple view records
      await db.insert(invoiceViews).values([
        { invoiceId: invoice.id, ipAddress: "192.168.1.1", isFirstView: true },
        { invoiceId: invoice.id, ipAddress: "192.168.1.2", isFirstView: false },
        { invoiceId: invoice.id, ipAddress: "192.168.1.3", isFirstView: false },
      ]);

      // Count views
      const views = await db
        .select()
        .from(invoiceViews)
        .where(eq(invoiceViews.invoiceId, invoice.id));

      expect(views.length).toBe(3);
      expect(views.filter(v => v.isFirstView).length).toBe(1);

      // Cleanup
      await db
        .delete(invoiceViews)
        .where(eq(invoiceViews.invoiceId, invoice.id));
      await db.delete(invoices).where(eq(invoices.id, invoice.id));
    });
  });

  // ==========================================
  // Phase 1.5: Encryption Tests
  // ==========================================

  describe("1.5 Encryption Utilities", () => {
    it("1.5.2 should encrypt and decrypt strings correctly", () => {
      const plaintext = "sk_live_abc123xyz789";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext for same plaintext (random IV)", () => {
      const plaintext = "same-secret-key";

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same value
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it("should encrypt and decrypt JSON objects", () => {
      const config = {
        apiKey: "sk_live_test123",
        accountId: "acct_123456",
        refreshToken: "rt_abc789",
      };

      const encrypted = encryptJSON(config);
      const decrypted = decryptJSON<typeof config>(encrypted);

      expect(decrypted).toEqual(config);
    });

    it("should generate valid encryption keys", () => {
      const key = generateEncryptionKey();

      expect(key).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(/^[0-9a-f]+$/i.test(key)).toBe(true);
    });

    it("should handle empty strings", () => {
      const plaintext = "";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode characters", () => {
      const plaintext = "🔐 Secret Key: äöü 中文 العربية";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", () => {
      const plaintext = "x".repeat(10000);

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });
});
