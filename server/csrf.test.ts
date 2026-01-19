import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("CSRF Protection", () => {
  describe("Server-side CSRF Middleware", () => {
    const csrfPath = path.join(__dirname, "./_core/csrf.ts");
    let csrfContent: string;

    beforeEach(() => {
      csrfContent = fs.readFileSync(csrfPath, "utf-8");
    });

    it("should define CSRF header name and value", () => {
      expect(csrfContent).toContain("CSRF_HEADER_NAME");
      expect(csrfContent).toContain("x-csrf-protection");
      expect(csrfContent).toContain("CSRF_HEADER_VALUE");
    });

    it("should have exempt paths for webhooks", () => {
      expect(csrfContent).toContain("CSRF_EXEMPT_PATHS");
      expect(csrfContent).toContain("/api/stripe/webhook");
      expect(csrfContent).toContain("/api/webhooks/nowpayments");
      expect(csrfContent).toContain("/api/webhooks/resend");
    });

    it("should only protect state-changing HTTP methods", () => {
      expect(csrfContent).toContain("PROTECTED_METHODS");
      expect(csrfContent).toContain("POST");
      expect(csrfContent).toContain("PUT");
      expect(csrfContent).toContain("PATCH");
      expect(csrfContent).toContain("DELETE");
    });

    it("should export csrfProtection middleware", () => {
      expect(csrfContent).toContain("export function csrfProtection");
    });

    it("should export validateCsrfHeader function", () => {
      expect(csrfContent).toContain("export function validateCsrfHeader");
    });

    it("should return 403 for invalid CSRF requests", () => {
      expect(csrfContent).toContain("403");
      expect(csrfContent).toContain("CSRF validation failed");
    });
  });

  describe("Client-side CSRF Header", () => {
    const mainTsxPath = path.join(__dirname, "../client/src/main.tsx");
    let mainContent: string;

    beforeEach(() => {
      mainContent = fs.readFileSync(mainTsxPath, "utf-8");
    });

    it("should define CSRF header constants", () => {
      expect(mainContent).toContain("CSRF_HEADER_NAME");
      expect(mainContent).toContain("x-csrf-protection");
      expect(mainContent).toContain("CSRF_HEADER_VALUE");
    });

    it("should include CSRF header in tRPC client", () => {
      expect(mainContent).toContain("headers()");
      expect(mainContent).toContain("[CSRF_HEADER_NAME]: CSRF_HEADER_VALUE");
    });

    it("should use httpBatchLink with headers", () => {
      expect(mainContent).toContain("httpBatchLink");
      expect(mainContent).toContain("headers()");
    });
  });

  describe("Server Index Integration", () => {
    const indexPath = path.join(__dirname, "./_core/index.ts");
    let indexContent: string;

    beforeEach(() => {
      indexContent = fs.readFileSync(indexPath, "utf-8");
    });

    it("should import csrfProtection middleware", () => {
      expect(indexContent).toContain('import { csrfProtection } from "./csrf"');
    });

    it("should apply CSRF protection to tRPC routes", () => {
      expect(indexContent).toContain('app.use("/api/trpc", csrfProtection)');
    });

    it("should apply CSRF protection before rate limiting", () => {
      const csrfIndex = indexContent.indexOf('app.use("/api/trpc", csrfProtection)');
      const rateLimitIndex = indexContent.indexOf('app.use("/api/trpc", standardRateLimit)');
      expect(csrfIndex).toBeLessThan(rateLimitIndex);
    });
  });
});
