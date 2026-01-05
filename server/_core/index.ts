import "dotenv/config";
import express from "express";
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
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
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
      
      const buffer = Buffer.from(file, 'base64');
      const { storagePut } = await import("../storage");
      const { optimizeImage, getFileExtension } = await import("../image-optimization");
      
      const optimization = await optimizeImage(buffer, filename || 'logo.png');
      
      const timestamp = Date.now();
      const ext = getFileExtension(optimization.format);
      const storageFilename = `logos/${userId}/logo-${timestamp}.${ext}`;
      
      const mimeTypeMap: Record<string, string> = {
        'png': 'image/png',
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpeg',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
      };
      const mimeType = mimeTypeMap[optimization.format] || 'image/png';
      
      const { url } = await storagePut(storageFilename, optimization.buffer, mimeType);
      
      res.json({ 
        url,
        optimization: {
          originalSize: optimization.originalSize,
          optimizedSize: optimization.optimizedSize,
          compressionRatio: optimization.compressionRatio,
          format: optimization.format,
        }
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
    
    // Initialize default currencies if needed
    try {
      await initializeDefaultCurrencies();
    } catch (error) {
      console.error("[Server] Failed to initialize currencies:", error);
    }
    
    // Initialize cron jobs for automated tasks
    initializeScheduler();
  });
}

startServer().catch(console.error);
