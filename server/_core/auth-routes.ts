import type { Express } from "express";
import { authHandler } from "./auth";

export function registerAuthRoutes(app: Express) {
  app.all("/api/auth/*", async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
    });

    const response = await authHandler(request);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(await response.text());
  });
}
