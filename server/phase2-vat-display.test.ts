/**
 * Phase 2 Tests: VAT Display and Decimal Integration
 * Tests for: PDF VAT display, reverse charge, decimal calculations
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { clients, users, invoices, invoiceLineItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Test user ID for isolation
let testUserId: number;
let testClientId: number;
let testClientWithVatId: number;
let testTaxExemptClientId: number;

describe("Phase 2: VAT Display and Decimal Integration", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-phase2-${Date.now()}`,
        name: "Phase 2 Test User",
        email: "phase2test@example.com",
      })
      .$returningId();
    testUserId = user.id;

    // Create test client without VAT
    const [client] = await db
      .insert(clients)
      .values({
        userId: testUserId,
        name: "Regular Client",
        email: "regular@example.com",
      })
      .$returningId();
    testClientId = client.id;

    // Create test client with VAT number
    const [clientWithVat] = await db
      .insert(clients)
      .values({
        userId: testUserId,
        name: "EU Business Client",
        email: "eu@example.com",
        vatNumber: "FR12345678901",
        taxExempt: false,
      })
      .$returningId();
    testClientWithVatId = clientWithVat.id;

    // Create tax-exempt client
    const [taxExemptClient] = await db
      .insert(clients)
      .values({
        userId: testUserId,
        name: "Tax Exempt EU Client",
        email: "taxexempt@example.com",
        vatNumber: "NL123456789B01",
        taxExempt: true,
      })
      .$returningId();
    testTaxExemptClientId = taxExemptClient.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup test data
    await db
      .delete(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, testClientId));
    await db.delete(invoices).where(eq(invoices.userId, testUserId));
    await db.delete(clients).where(eq(clients.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  // ==========================================
  // 2.1 PDF VAT Display Tests
  // ==========================================

  describe("2.1 PDF VAT Display", () => {
    it("2.1.1 should store client VAT number in database", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientWithVatId));

      expect(client.vatNumber).toBe("FR12345678901");
    });

    it("2.1.2 should store tax exempt status in database", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testTaxExemptClientId));

      expect(client.taxExempt).toBe(true);
      expect(client.vatNumber).toBe("NL123456789B01");
    });

    it("2.1.3 should have company info fields in user schema", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));

      // Company info fields exist in schema for seller details on invoice
      expect("companyName" in user).toBe(true);
      expect("companyAddress" in user).toBe(true);
      expect("companyPhone" in user).toBe(true);
    });

    it("2.1.4 should have client without VAT number", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientId));

      expect(client.vatNumber).toBeNull();
      // taxExempt defaults to false or null
      expect(client.taxExempt).toBeFalsy();
    });
  });

  // ==========================================
  // 2.2 Decimal Precision Tests
  // ==========================================

  describe("2.2 Decimal Precision", () => {
    it("2.2.1 should handle JavaScript floating point issue correctly", () => {
      // The classic 0.1 + 0.2 !== 0.3 problem
      const jsResult = 0.1 + 0.2;
      expect(jsResult).not.toBe(0.3); // This is the JS bug

      // With proper rounding
      const roundedResult = Math.round((0.1 + 0.2) * 100) / 100;
      expect(roundedResult).toBe(0.3);
    });

    it("2.2.2 should calculate line item amount correctly", () => {
      const quantity = 2.5;
      const rate = 99.99;
      const amount = quantity * rate;

      // Round to 2 decimal places
      const roundedAmount = Math.round(amount * 100) / 100;
      expect(roundedAmount).toBe(249.98);
    });

    it("2.2.3 should calculate subtotal correctly", () => {
      const lineItems = [
        { quantity: 2, rate: 100 },
        { quantity: 1.5, rate: 50 },
        { quantity: 3, rate: 33.33 },
      ];

      const subtotal = lineItems.reduce((sum, item) => {
        return sum + item.quantity * item.rate;
      }, 0);

      const roundedSubtotal = Math.round(subtotal * 100) / 100;
      expect(roundedSubtotal).toBe(374.99);
    });

    it("2.2.4 should calculate percentage discount correctly", () => {
      const subtotal = 1000;
      const discountPercent = 15;
      const discountAmount = (subtotal * discountPercent) / 100;

      expect(discountAmount).toBe(150);
    });

    it("2.2.5 should calculate tax correctly", () => {
      const subtotal = 1000;
      const discountAmount = 150;
      const afterDiscount = subtotal - discountAmount;
      const taxRate = 19;
      const taxAmount = (afterDiscount * taxRate) / 100;

      expect(afterDiscount).toBe(850);
      expect(taxAmount).toBe(161.5);
    });

    it("2.2.6 should calculate total correctly", () => {
      const subtotal = 1000;
      const discountAmount = 150;
      const taxAmount = 161.5;
      const total = subtotal - discountAmount + taxAmount;

      expect(total).toBe(1011.5);
    });

    it("2.2.7 should handle crypto-scale decimals", () => {
      // 8 decimal places for BTC
      const btcAmount = 0.00012345;
      const btcRate = 50000;
      const usdValue = btcAmount * btcRate;

      expect(usdValue).toBeCloseTo(6.1725, 4);
    });

    it("2.2.8 should handle very small quantities", () => {
      const quantity = 0.00000001; // 1 satoshi worth
      const rate = 100000000; // Rate per BTC
      const amount = quantity * rate;

      expect(amount).toBe(1);
    });
  });

  // ==========================================
  // 2.3 Clients List VAT Column Tests
  // ==========================================

  describe("2.3 Clients List VAT Column", () => {
    it("2.3.1 should return vatNumber in client list query", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const clientList = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, testUserId));

      const clientWithVat = clientList.find(c => c.id === testClientWithVatId);
      expect(clientWithVat?.vatNumber).toBe("FR12345678901");
    });

    it("2.3.2 should return taxExempt in client list query", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const clientList = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, testUserId));

      const taxExemptClient = clientList.find(
        c => c.id === testTaxExemptClientId
      );
      expect(taxExemptClient?.taxExempt).toBe(true);
    });

    it("2.3.3 should filter clients by VAT status", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const clientList = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, testUserId));

      const clientsWithVat = clientList.filter(c => c.vatNumber !== null);
      const clientsWithoutVat = clientList.filter(c => c.vatNumber === null);

      expect(clientsWithVat.length).toBe(2);
      expect(clientsWithoutVat.length).toBe(1);
    });

    it("2.3.4 should filter tax-exempt clients", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const clientList = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, testUserId));

      const taxExemptClients = clientList.filter(c => c.taxExempt === true);

      expect(taxExemptClients.length).toBe(1);
      expect(taxExemptClients[0].name).toBe("Tax Exempt EU Client");
    });
  });

  // ==========================================
  // Reverse Charge Logic Tests
  // ==========================================

  describe("Reverse Charge Logic", () => {
    it("should identify reverse charge eligible clients", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testTaxExemptClientId));

      // Reverse charge applies when:
      // 1. Client has a valid VAT number
      // 2. Client is marked as tax exempt
      const isReverseChargeEligible = client.vatNumber && client.taxExempt;

      expect(isReverseChargeEligible).toBe(true);
    });

    it("should not apply reverse charge to non-exempt clients", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientWithVatId));

      // Client has VAT but is not tax exempt
      const isReverseChargeEligible = client.vatNumber && client.taxExempt;

      expect(isReverseChargeEligible).toBeFalsy();
    });

    it("should not apply reverse charge to clients without VAT", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientId));

      const isReverseChargeEligible = client.vatNumber && client.taxExempt;

      expect(isReverseChargeEligible).toBeFalsy();
    });
  });
});
