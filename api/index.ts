// Vercel API Handler
// This file is bundled as a serverless function on Vercel

interface VercelRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  // Health check
  if (method === "GET" && (url === "/api/health" || url === "/")) {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      message: "SleekInvoices API is running",
      version: "1.0.0",
    });
    return;
  }

  // Stripe webhook endpoint
  if (method === "POST" && url === "/api/stripe/webhook") {
    res
      .status(200)
      .json({ received: true, message: "Stripe webhook configured" });
    return;
  }

  // NOWPayments webhook endpoint
  if (method === "POST" && url === "/api/webhooks/nowpayments") {
    res
      .status(200)
      .json({ received: true, message: "NOWPayments webhook configured" });
    return;
  }

  // Resend webhook endpoint
  if (method === "POST" && url === "/api/webhooks/resend") {
    res
      .status(200)
      .json({ received: true, message: "Resend webhook configured" });
    return;
  }

  // tRPC endpoint
  if (url?.startsWith("/api/trpc")) {
    res.status(200).json({
      message: "tRPC endpoint",
      note: "Configure tRPC handler for full functionality",
    });
    return;
  }

  // Default API response
  res.status(200).json({
    message: "SleekInvoices API",
    environment: process.env.NODE_ENV || "production",
    endpoints: {
      health: "GET /api/health",
      stripeWebhook: "POST /api/stripe/webhook",
      nowpaymentsWebhook: "POST /api/webhooks/nowpayments",
      resendWebhook: "POST /api/webhooks/resend",
      trpc: "POST /api/trpc/*",
    },
  });
}
