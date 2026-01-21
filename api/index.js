// Vercel API Handler
// This file serves as the entry point for Vercel serverless functions
// It delegates all requests to the Express application bundled at dist/_server/index.js

import { app } from '../dist/_server/index.js';

// Vercel serverless function handler
// Vercel provides req/res in Express-compatible format
export default function handler(req, res) {
  app(req, res);
}
