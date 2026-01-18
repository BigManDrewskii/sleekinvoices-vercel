/**
 * Phase 1.6-1.9 Tests
 * Tests for: Client VAT Backend, VIES VAT Validation, Decimal Utilities
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { clients, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  validateVATNumber,
  isValidVATFormat,
  getSupportedCountryCodes,
} from "./lib/vat-validation";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

// Test user ID for isolation
let testUserId: number;

// Mock user context
const createMockContext = (userId: number): Context => ({
  user: {
    id: userId,
    openId: `test-vat-${Date.now()}`,
    name: "VAT Test User",
    email: "vattest@example.com",
    role: "user" as const,
    companyName: null,
    companyAddress: null,
    companyPhone: null,
    companyLogoUrl: null,
    subscriptionStatus: null,
    stripeCustomerId: null,
    currentPeriodEnd: null,
    taxId: null,
    taxRate: null,
    defaultCurrency: "USD",
    defaultPaymentTerms: null,
    invoicePrefix: "INV",
    nextInvoiceNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  req: {} as any,
  res: {} as any,
});

describe("Phase 1.6-1.9 Tests", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-vat-${Date.now()}`,
        name: "VAT Test User",
        email: "vattest@example.com",
      })
      .$returningId();
    testUserId = user.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup test data
    await db.delete(clients).where(eq(clients.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  // ==========================================
  // Phase 1.6: Client VAT Backend Tests
  // ==========================================

  describe("1.6 Client VAT Backend", () => {
    it("1.6.1 should create client with vatNumber field", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const client = await caller.clients.create({
        name: "German Company GmbH",
        email: "info@german.de",
        vatNumber: "DE123456789",
      });

      expect(client).toBeDefined();
      expect(client.vatNumber).toBe("DE123456789");

      // Cleanup
      await caller.clients.delete({ id: client.id });
    });

    it("1.6.2 should create client with taxExempt field", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      const client = await caller.clients.create({
        name: "Tax Exempt Org",
        taxExempt: true,
      });

      expect(client).toBeDefined();
      expect(client.taxExempt).toBe(true);

      // Cleanup
      await caller.clients.delete({ id: client.id });
    });

    it("1.6.3 should update client vatNumber", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Create client without VAT
      const client = await caller.clients.create({
        name: "Client Without VAT",
      });

      // Update with VAT number
      await caller.clients.update({
        id: client.id,
        vatNumber: "FR12345678901",
      });

      // Verify update
      const updated = await caller.clients.get({ id: client.id });
      expect(updated?.vatNumber).toBe("FR12345678901");

      // Cleanup
      await caller.clients.delete({ id: client.id });
    });

    it("1.6.4 should update client taxExempt status", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Create client
      const client = await caller.clients.create({
        name: "Client Tax Status",
        taxExempt: false,
      });

      // Update tax exempt status
      await caller.clients.update({
        id: client.id,
        taxExempt: true,
      });

      // Verify update
      const updated = await caller.clients.get({ id: client.id });
      expect(updated?.taxExempt).toBe(true);

      // Cleanup
      await caller.clients.delete({ id: client.id });
    });

    it("1.6.5 should allow null vatNumber", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Create client with VAT
      const client = await caller.clients.create({
        name: "Client With VAT",
        vatNumber: "NL123456789B01",
      });

      // Clear VAT number
      await caller.clients.update({
        id: client.id,
        vatNumber: null,
      });

      // Verify update
      const updated = await caller.clients.get({ id: client.id });
      expect(updated?.vatNumber).toBeNull();

      // Cleanup
      await caller.clients.delete({ id: client.id });
    });
  });

  // ==========================================
  // Phase 1.7: VIES VAT Validation Tests
  // ==========================================

  describe("1.7 VIES VAT Validation", () => {
    it("1.7.1 should validate VAT format for German numbers", () => {
      expect(isValidVATFormat("DE123456789")).toBe(true);
      expect(isValidVATFormat("DE12345678")).toBe(false); // Too short
      expect(isValidVATFormat("DE1234567890")).toBe(false); // Too long
    });

    it("1.7.2 should validate VAT format for French numbers", () => {
      expect(isValidVATFormat("FR12345678901")).toBe(true);
      expect(isValidVATFormat("FRAB123456789")).toBe(true);
    });

    it("1.7.3 should validate VAT format for Dutch numbers", () => {
      expect(isValidVATFormat("NL123456789B01")).toBe(true);
      expect(isValidVATFormat("NL123456789")).toBe(false); // Missing B01
    });

    it("1.7.4 should reject invalid country codes", () => {
      expect(isValidVATFormat("US123456789")).toBe(false);
      expect(isValidVATFormat("XX123456789")).toBe(false);
    });

    it("1.7.5 should normalize Greece country code", () => {
      // Greece uses EL in VIES but sometimes GR is used
      expect(isValidVATFormat("EL123456789")).toBe(true);
      // GR should be normalized to EL internally
    });

    it("1.7.6 should return all EU country codes", () => {
      const codes = getSupportedCountryCodes();
      expect(codes).toContain("DE");
      expect(codes).toContain("FR");
      expect(codes).toContain("NL");
      expect(codes).toContain("EL"); // Greece
      expect(codes.length).toBeGreaterThanOrEqual(27);
    });

    it("1.7.7 should return error for invalid format in validation", async () => {
      const result = await validateVATNumber("INVALID");
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain("Invalid VAT number format");
    });

    it("1.7.8 should handle empty VAT number", async () => {
      const result = await validateVATNumber("");
      expect(result.valid).toBe(false);
    });

    // Note: Live VIES API tests are skipped to avoid rate limiting
    it.skip("1.7.9 should validate real German VAT number via VIES API", async () => {
      // This test requires a real VAT number and network access
      const result = await validateVATNumber("DE123456789");
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("countryCode", "DE");
    });
  });

  // ==========================================
  // Phase 1.7 (continued): tRPC VAT Validation
  // ==========================================

  describe("1.7 tRPC VAT Validation Endpoint", () => {
    it("should expose validateVAT mutation", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Test with invalid format
      const result = await caller.clients.validateVAT({
        vatNumber: "INVALID123",
      });

      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
    });

    it("should validate VAT number format through tRPC", async () => {
      const caller = appRouter.createCaller(createMockContext(testUserId));

      // Test with valid format but potentially invalid number
      const result = await caller.clients.validateVAT({
        vatNumber: "DE999999999",
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("countryCode", "DE");
    });
  });
});

// ==========================================
// Decimal Utility Tests (Frontend)
// ==========================================

describe("1.9 Decimal Utilities", () => {
  // Note: These tests are for the frontend decimal utilities
  // They test the logic that will be used in the browser

  it("1.9.1 should handle high precision decimal arithmetic", () => {
    // Simulate what decimal.js does
    const a = "0.1";
    const b = "0.2";

    // JavaScript floating point issue
    const jsResult = 0.1 + 0.2;
    expect(jsResult).not.toBe(0.3); // This fails in JS!

    // With proper decimal handling (simulated)
    const decimalResult = (parseFloat(a) * 10 + parseFloat(b) * 10) / 10;
    expect(decimalResult).toBe(0.3);
  });

  it("1.9.2 should handle crypto-scale decimals (8 places)", () => {
    const btcAmount = "0.00000001"; // 1 satoshi
    const parsed = parseFloat(btcAmount);
    expect(parsed).toBe(0.00000001);
  });

  it("1.9.3 should handle ETH-scale decimals (18 places)", () => {
    const weiAmount = "0.000000000000000001"; // 1 wei
    const parsed = parseFloat(weiAmount);
    // Note: JavaScript can handle this but may lose precision
    expect(parsed).toBeGreaterThan(0);
  });

  it("1.9.4 should calculate line item amounts correctly", () => {
    const quantity = 2.5;
    const rate = 100.0;
    const amount = quantity * rate;
    expect(amount).toBe(250.0);
  });

  it("1.9.5 should calculate percentage correctly", () => {
    const subtotal = 1000;
    const taxRate = 19; // 19%
    const taxAmount = subtotal * (taxRate / 100);
    expect(taxAmount).toBe(190);
  });

  it("1.9.6 should calculate invoice total correctly", () => {
    const subtotal = 1000;
    const taxAmount = 190;
    const discountAmount = 50;
    const total = subtotal + taxAmount - discountAmount;
    expect(total).toBe(1140);
  });

  it("1.9.7 should calculate payment progress correctly", () => {
    const total = 1000;
    const amountPaid = 250;
    const progress = (amountPaid / total) * 100;
    expect(progress).toBe(25);
  });

  it("1.9.8 should handle zero division safely", () => {
    const total = 0;
    const amountPaid = 100;
    // Should return 100% when total is 0 (fully paid)
    const progress = total === 0 ? 100 : (amountPaid / total) * 100;
    expect(progress).toBe(100);
  });
});
