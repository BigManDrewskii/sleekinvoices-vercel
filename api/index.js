// Vercel API Handler
// This file serves as the entry point for Vercel serverless functions
// It delegates all requests to the Express application bundled at dist/index.js

import { app } from '../dist/index.js';

// Vercel serverless function handler
// Vercel provides req/res in Express-compatible format
export default function handler(req, res) {
  app(req, res);
}
