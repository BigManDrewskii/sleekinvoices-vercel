import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// Test both client and server Sentry integration

describe("Sentry Integration", () => {
  it("should have @sentry/react installed", () => {
    const packageJsonPath = path.join(__dirname, "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies["@sentry/react"]).toBeDefined();
  });

  it("should have Sentry initialized in main.tsx", () => {
    const mainTsxPath = path.join(__dirname, "..", "client", "src", "main.tsx");
    const mainTsxContent = fs.readFileSync(mainTsxPath, "utf-8");

    // Check for Sentry import
    expect(mainTsxContent).toContain('import * as Sentry from "@sentry/react"');

    // Check for Sentry.init call
    expect(mainTsxContent).toContain("Sentry.init({");

    // Check for DSN configuration
    expect(mainTsxContent).toContain("dsn:");

    // Check for ErrorBoundary wrapper
    expect(mainTsxContent).toContain("Sentry.ErrorBoundary");
  });

  it("should only enable Sentry in production", () => {
    const mainTsxPath = path.join(__dirname, "..", "client", "src", "main.tsx");
    const mainTsxContent = fs.readFileSync(mainTsxPath, "utf-8");

    // Check that Sentry is conditionally enabled
    expect(mainTsxContent).toContain("enabled: import.meta.env.PROD");
  });

  it("should have sendDefaultPii configured", () => {
    const mainTsxPath = path.join(__dirname, "..", "client", "src", "main.tsx");
    const mainTsxContent = fs.readFileSync(mainTsxPath, "utf-8");

    expect(mainTsxContent).toContain("sendDefaultPii: true");
  });

  it("should have tracesSampleRate configured for performance monitoring", () => {
    const mainTsxPath = path.join(__dirname, "..", "client", "src", "main.tsx");
    const mainTsxContent = fs.readFileSync(mainTsxPath, "utf-8");

    expect(mainTsxContent).toContain("tracesSampleRate:");
  });

  it("should have release tracking configured", () => {
    const mainTsxPath = path.join(__dirname, "..", "client", "src", "main.tsx");
    const mainTsxContent = fs.readFileSync(mainTsxPath, "utf-8");

    // Check for release configuration
    expect(mainTsxContent).toContain("release:");
    expect(mainTsxContent).toContain("sleekinvoices@");
  });
});

describe("Sentry Server-Side Integration", () => {
  it("should have @sentry/node installed", () => {
    const packageJsonPath = path.join(__dirname, "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.dependencies["@sentry/node"]).toBeDefined();
  });

  it("should have errorMonitoring module with Sentry DSN", () => {
    const errorMonitoringPath = path.join(
      __dirname,
      "..",
      "server",
      "_core",
      "errorMonitoring.ts"
    );
    const errorMonitoringContent = fs.readFileSync(
      errorMonitoringPath,
      "utf-8"
    );

    // Check for Sentry DSN configuration
    expect(errorMonitoringContent).toContain("SENTRY_DSN");
    expect(errorMonitoringContent).toContain(
      "o4510235027636224.ingest.de.sentry.io"
    );
  });

  it("should have initializeErrorMonitoring function", () => {
    const errorMonitoringPath = path.join(
      __dirname,
      "..",
      "server",
      "_core",
      "errorMonitoring.ts"
    );
    const errorMonitoringContent = fs.readFileSync(
      errorMonitoringPath,
      "utf-8"
    );

    expect(errorMonitoringContent).toContain(
      "export async function initializeErrorMonitoring"
    );
  });

  it("should have captureException function", () => {
    const errorMonitoringPath = path.join(
      __dirname,
      "..",
      "server",
      "_core",
      "errorMonitoring.ts"
    );
    const errorMonitoringContent = fs.readFileSync(
      errorMonitoringPath,
      "utf-8"
    );

    expect(errorMonitoringContent).toContain(
      "export function captureException"
    );
  });

  it("should initialize Sentry in server startup", () => {
    const indexPath = path.join(__dirname, "..", "server", "_core", "index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf-8");

    // Check for error monitoring initialization
    expect(indexContent).toContain("initializeErrorMonitoring");
    expect(indexContent).toContain("captureException");
  });

  it("should handle uncaught exceptions", () => {
    const indexPath = path.join(__dirname, "..", "server", "_core", "index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf-8");

    expect(indexContent).toContain("process.on('uncaughtException'");
    expect(indexContent).toContain("process.on('unhandledRejection'");
  });

  it("should scrub sensitive headers before sending to Sentry", () => {
    const errorMonitoringPath = path.join(
      __dirname,
      "..",
      "server",
      "_core",
      "errorMonitoring.ts"
    );
    const errorMonitoringContent = fs.readFileSync(
      errorMonitoringPath,
      "utf-8"
    );

    expect(errorMonitoringContent).toContain("beforeSend");
    expect(errorMonitoringContent).toContain("delete headers['authorization']");
    expect(errorMonitoringContent).toContain("delete headers['cookie']");
  });

  it("should have release tracking configured", () => {
    const errorMonitoringPath = path.join(
      __dirname,
      "..",
      "server",
      "_core",
      "errorMonitoring.ts"
    );
    const errorMonitoringContent = fs.readFileSync(
      errorMonitoringPath,
      "utf-8"
    );

    // Check for release configuration
    expect(errorMonitoringContent).toContain("release");
    expect(errorMonitoringContent).toContain("sleekinvoices@");
  });
});
