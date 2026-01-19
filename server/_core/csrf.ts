/**
 * CSRF Protection Middleware
 * 
 * Uses Custom Header Validation pattern to prevent CSRF attacks.
 * Browsers won't add custom headers to cross-origin requests without CORS preflight,
 * and our CORS policy only allows same-origin requests.
 * 
 * This middleware validates that mutation requests include a custom header
 * that can only be set by JavaScript running on our domain.
 */

import type { Request, Response, NextFunction } from "express";

// The custom header name that must be present on mutation requests
export const CSRF_HEADER_NAME = "x-csrf-protection";
export const CSRF_HEADER_VALUE = "1";

/**
 * List of paths that are exempt from CSRF protection.
 * These are typically webhook endpoints that receive requests from external services.
 */
const CSRF_EXEMPT_PATHS = [
  "/api/stripe/webhook",
  "/api/webhooks/nowpayments",
  "/api/webhooks/resend",
  "/api/health",
  "/api/health/detailed",
];

/**
 * HTTP methods that require CSRF protection.
 * GET, HEAD, OPTIONS are considered "safe" methods and don't need protection.
 */
const PROTECTED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/**
 * Validates that the request includes the required CSRF header.
 * 
 * @param req - Express request object
 * @returns true if the request passes CSRF validation
 */
export function validateCsrfHeader(req: Request): boolean {
  const csrfHeader = req.headers[CSRF_HEADER_NAME];
  return csrfHeader === CSRF_HEADER_VALUE;
}

/**
 * Express middleware for CSRF protection.
 * 
 * This middleware:
 * 1. Allows safe HTTP methods (GET, HEAD, OPTIONS)
 * 2. Allows exempt paths (webhooks, health checks)
 * 3. Requires the custom CSRF header for all other requests
 */
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Allow safe HTTP methods
  if (!PROTECTED_METHODS.includes(req.method.toUpperCase())) {
    return next();
  }

  // Allow exempt paths
  const isExempt = CSRF_EXEMPT_PATHS.some(path => req.path.startsWith(path));
  if (isExempt) {
    return next();
  }

  // Validate CSRF header for protected requests
  if (!validateCsrfHeader(req)) {
    console.warn(`[CSRF] Blocked request without valid CSRF header: ${req.method} ${req.path}`);
    res.status(403).json({
      error: "CSRF validation failed",
      message: "Missing or invalid CSRF protection header",
    });
    return;
  }

  next();
}

/**
 * Get the CSRF header configuration for client-side requests.
 * This should be included in all mutation requests from the frontend.
 */
export function getCsrfHeaders(): Record<string, string> {
  return {
    [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
  };
}
