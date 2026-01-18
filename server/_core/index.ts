import dotenv from "dotenv";
import express from "express";

// Load .env.local for local development
dotenv.config({ path: ".env.local" });
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeScheduler } from "../jobs/scheduler";
import { initializeDefaultCurrencies } from "../currency";
import { standardRateLimit, strictRateLimit } from "./rateLimit";

import {
  initializeErrorMonitoring,
  captureException,
  flushErrorMonitoring,
} from "./errorMonitoring";

// Global error handler for uncaught exceptions
process.on("uncaughtException", async error => {
  console.error("[CRITICAL] Uncaught Exception:", error);
  captureException(error, { action: "uncaughtException" });
  // Allow time for error to be sent before exit
  await flushErrorMonitoring(2000);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "[CRITICAL] Unhandled Rejection at:",
    promise,
    "reason:",
    reason
  );
  captureException(
    reason instanceof Error ? reason : new Error(String(reason)),
    {
      action: "unhandledRejection",
      metadata: { promise: String(promise) },
    }
  );
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Stripe webhook endpoint (MUST be before JSON body parser for raw body)
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const { handleStripeWebhook } = await import("../webhooks/stripe");
      await handleStripeWebhook(req, res);
    }
  );

  // NOWPayments webhook endpoint (after Stripe but before general JSON parser)
  app.post("/api/webhooks/nowpayments", express.json(), async (req, res) => {
    const nowpaymentsRouter = (await import("../webhooks/nowpayments")).default;
    nowpaymentsRouter(req, res, () => {});
  });

  // Resend webhook endpoint for email delivery tracking
  app.post("/api/webhooks/resend", express.json(), async (req, res) => {
    const resendRouter = (await import("../webhooks/resend")).default;
    resendRouter(req, res, () => {});
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint for load balancers and monitoring
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Detailed health check with database connectivity
  app.get("/api/health/detailed", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) {
        throw new Error("Database connection not available");
      }
      // Simple query to check database connectivity
      const startTime = Date.now();
      await db.execute("SELECT 1");
      const dbLatency = Date.now() - startTime;

      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        checks: {
          database: { status: "healthy", latencyMs: dbLatency },
          memory: {
            heapUsed:
              Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
            heapTotal:
              Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
          },
        },
      });
    } catch (error: any) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  // Client portal PDF download endpoint (public with access token validation)
  app.get("/api/invoices/:id/pdf", async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const accessToken = req.query.token as string;

      if (!accessToken) {
        return res.status(401).json({ error: "Access token required" });
      }

      if (isNaN(invoiceId)) {
        return res.status(400).json({ error: "Invalid invoice ID" });
      }

      // Import required functions
      const {
        getClientByAccessToken,
        getInvoiceById,
        getLineItemsByInvoiceId,
        getUserById,
        getDefaultTemplate,
      } = await import("../db");
      const { generateInvoicePDF } = await import("../pdf");

      // Validate access token
      const client = await getClientByAccessToken(accessToken);
      if (!client) {
        return res
          .status(401)
          .json({ error: "Invalid or expired access token" });
      }

      // Get invoice and verify it belongs to this client
      const invoice = await getInvoiceById(invoiceId, client.userId);
      if (!invoice || invoice.clientId !== client.id) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Get invoice data
      const lineItems = await getLineItemsByInvoiceId(invoiceId);
      const user = await getUserById(client.userId);
      const template = await getDefaultTemplate(client.userId);

      if (!user) {
        return res.status(500).json({ error: "User not found" });
      }

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF({
        invoice,
        client,
        lineItems,
        user,
        template,
      });

      // Send PDF as response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: unknown) {
      console.error("PDF generation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to generate PDF", details: errorMessage });
    }
  });

  // Avatar upload endpoint with image optimization
  app.post("/api/upload/avatar", async (req, res) => {
    try {
      const { file, userId, filename } = req.body;
      if (!file || !userId) {
        return res.status(400).json({ error: "Missing file or userId" });
      }

      const buffer = Buffer.from(file, "base64");
      const { storagePut } = await import("../storage");
      const { optimizeImage, getFileExtension } = await import(
        "../image-optimization"
      );

      const optimization = await optimizeImage(
        buffer,
        filename || "avatar.png"
      );

      const timestamp = Date.now();
      const ext = getFileExtension(optimization.format);
      const storageFilename = `avatars/${userId}/avatar-${timestamp}.${ext}`;

      const mimeTypeMap: Record<string, string> = {
        png: "image/png",
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        webp: "image/webp",
      };
      const mimeType = mimeTypeMap[optimization.format] || "image/png";

      const { url } = await storagePut(
        storageFilename,
        optimization.buffer,
        mimeType
      );

      res.json({
        url,
        optimization: {
          originalSize: optimization.originalSize,
          optimizedSize: optimization.optimizedSize,
          compressionRatio: optimization.compressionRatio,
          format: optimization.format,
        },
      });
    } catch (error: unknown) {
      console.error("Avatar upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Rate limiting for API endpoints
  app.use("/api/trpc", standardRateLimit);
  app.use("/api/stripe/webhook", strictRateLimit);
  app.use("/api/oauth", strictRateLimit);
  app.use("/api/upload", standardRateLimit);

  // Logo upload endpoint with image optimization
  app.post("/api/upload/logo", async (req, res) => {
    try {
      const { file, userId, filename } = req.body;
      if (!file || !userId) {
        return res.status(400).json({ error: "Missing file or userId" });
      }

      const buffer = Buffer.from(file, "base64");
      const { storagePut } = await import("../storage");
      const { optimizeImage, getFileExtension } = await import(
        "../image-optimization"
      );

      const optimization = await optimizeImage(buffer, filename || "logo.png");

      const timestamp = Date.now();
      const ext = getFileExtension(optimization.format);
      const storageFilename = `logos/${userId}/logo-${timestamp}.${ext}`;

      const mimeTypeMap: Record<string, string> = {
        png: "image/png",
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        webp: "image/webp",
        svg: "image/svg+xml",
      };
      const mimeType = mimeTypeMap[optimization.format] || "image/png";

      const { url } = await storagePut(
        storageFilename,
        optimization.buffer,
        mimeType
      );

      res.json({
        url,
        optimization: {
          originalSize: optimization.originalSize,
          optimizedSize: optimization.optimizedSize,
          compressionRatio: optimization.compressionRatio,
          format: optimization.format,
        },
      });
    } catch (error: any) {
      console.error("Logo upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Initialize error monitoring (Sentry if configured)
    await initializeErrorMonitoring();

    // Initialize default currencies if needed
    try {
      await initializeDefaultCurrencies();
    } catch (error) {
      console.error("[Server] Failed to initialize currencies:", error);
      captureException(error, { action: "initializeDefaultCurrencies" });
    }

    // Initialize cron jobs for automated tasks
    initializeScheduler();
  });
}

startServer().catch(console.error);
