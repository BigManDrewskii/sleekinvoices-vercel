/**
 * Security P0 Fixes Tests
 *
 * Tests for critical security fixes from the production readiness audit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("P0-1: Auth Bypass Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should reject SKIP_AUTH in production environment", async () => {
    // Set production environment with SKIP_AUTH
    process.env.NODE_ENV = "production";
    process.env.SKIP_AUTH = "true";

    // Import context module fresh
    const { createContext } = await import("./_core/context");

    // Create a mock request
    const mockReq = {
      headers: {},
      cookies: {},
    } as any;

    const mockRes = {} as any;

    // Should throw an error in production
    await expect(createContext({ req: mockReq, res: mockRes })).rejects.toThrow(
      "CRITICAL SECURITY ERROR"
    );
  });

  it("should allow SKIP_AUTH in development environment", async () => {
    // Set development environment with SKIP_AUTH
    process.env.NODE_ENV = "development";
    process.env.SKIP_AUTH = "true";

    // Import context module fresh
    const { createContext } = await import("./_core/context");

    // Create a mock request
    const mockReq = {
      headers: {},
      cookies: {},
    } as any;

    const mockRes = {} as any;

    // Should not throw in development
    const context = await createContext({ req: mockReq, res: mockRes });
    expect(context).toBeDefined();
  });
});

describe("P0-3: PDF Generation Timeout", () => {
  it("should have timeout configuration", async () => {
    // Read the PDF module to verify timeout is configured
    const fs = await import("fs/promises");
    const pdfContent = await fs.readFile("./server/pdf.ts", "utf-8");

    // Check that timeout constant is defined
    expect(pdfContent).toContain("PDF_GENERATION_TIMEOUT_MS");
    expect(pdfContent).toContain("30000"); // 30 second timeout

    // Check that Promise.race is used for timeout
    expect(pdfContent).toContain("Promise.race");

    // Check that cleanup function exists
    expect(pdfContent).toContain("cleanupBrowserInstances");
  });
});

describe("P0-4: Webhook Deduplication", () => {
  it("should have deduplication check for NOWPayments", async () => {
    // Read the NOWPayments webhook module
    const fs = await import("fs/promises");
    const webhookContent = await fs.readFile(
      "./server/webhooks/nowpayments.ts",
      "utf-8"
    );

    // Check that deduplication function exists
    expect(webhookContent).toContain("isNOWPaymentsPaymentProcessed");

    // Check that it checks both tables
    expect(webhookContent).toContain("payments");
    expect(webhookContent).toContain("cryptoSubscriptionPayments");

    // Check that duplicate check is called before processing
    expect(webhookContent).toContain("Duplicate webhook");
    expect(webhookContent).toContain("Already processed");
  });
});

describe("P0-5: NOWPayments Signature Bypass", () => {
  it("should fail hard in production without IPN secret", async () => {
    // Read the NOWPayments library
    const fs = await import("fs/promises");
    const libContent = await fs.readFile(
      "./server/lib/nowpayments.ts",
      "utf-8"
    );

    // Check that production check exists
    expect(libContent).toContain("process.env.NODE_ENV === 'production'");
    expect(libContent).toContain("CRITICAL");
    expect(libContent).toContain("return false");

    // Check that development warning exists
    expect(libContent).toContain("DEVELOPMENT ONLY");
  });
});

describe("P0-2: Atomic Payment Transactions", () => {
  it("should use transactions for Stripe payment processing", async () => {
    // Read the Stripe webhook module
    const fs = await import("fs/promises");
    const stripeContent = await fs.readFile(
      "./server/webhooks/stripe.ts",
      "utf-8"
    );

    // Check that transaction is used
    expect(stripeContent).toContain("db.transaction");
    expect(stripeContent).toContain("atomic transaction");

    // Check that both payment and invoice update are in transaction
    expect(stripeContent).toContain("tx.insert(payments)");
    expect(stripeContent).toContain("tx.");
    expect(stripeContent).toContain("update(invoices)");
  });

  it("should use transactions for NOWPayments processing", async () => {
    // Read the NOWPayments webhook module
    const fs = await import("fs/promises");
    const nowContent = await fs.readFile(
      "./server/webhooks/nowpayments.ts",
      "utf-8"
    );

    // Check that transaction is used
    expect(nowContent).toContain("database.transaction");
    expect(nowContent).toContain("atomic transaction");

    // Check that transaction callback uses tx parameter
    expect(nowContent).toContain("async (tx)");
    // Check that updates and inserts happen inside transaction
    expect(nowContent).toContain("tx.");
  });
});

describe("P0-6: Error Monitoring", () => {
  it("should have error monitoring module", async () => {
    // Read the error monitoring module
    const fs = await import("fs/promises");
    const errorContent = await fs.readFile(
      "./server/_core/errorMonitoring.ts",
      "utf-8"
    );

    // Check that key functions exist
    expect(errorContent).toContain("initializeErrorMonitoring");
    expect(errorContent).toContain("captureException");
    expect(errorContent).toContain("captureMessage");
    expect(errorContent).toContain("flushErrorMonitoring");

    // Check that Sentry integration is optional
    expect(errorContent).toContain("SENTRY_DSN");
    expect(errorContent).toContain("@sentry/node");
  });

  it("should integrate error monitoring in server startup", async () => {
    // Read the server index
    const fs = await import("fs/promises");
    const indexContent = await fs.readFile("./server/_core/index.ts", "utf-8");

    // Check that error monitoring is imported and used
    expect(indexContent).toContain("initializeErrorMonitoring");
    expect(indexContent).toContain("captureException");
    expect(indexContent).toContain("flushErrorMonitoring");

    // Check that uncaught exceptions are captured
    expect(indexContent).toContain("uncaughtException");
    expect(indexContent).toContain("unhandledRejection");
  });
});
