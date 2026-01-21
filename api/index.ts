// Vercel API Handler
// This file serves as the entry point for Vercel serverless functions
// It delegates all requests to the Express application defined in server/_core/index.ts

import { app } from '../server/_core/index';

// Vercel serverless function handler
// Vercel provides req/res in Express-compatible format
export default function handler(req: any, res: any) {
  app(req, res);
}
