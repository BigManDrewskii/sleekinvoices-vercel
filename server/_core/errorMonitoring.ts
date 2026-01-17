/**
 * Error Monitoring Module
 * 
 * Provides centralized error tracking and reporting.
 * Can be integrated with external services like Sentry when configured.
 * 
 * To enable Sentry:
 * 1. Install: pnpm add @sentry/node
 * 2. Set SENTRY_DSN environment variable
 * 3. The module will automatically initialize Sentry
 */

interface ErrorContext {
  userId?: number;
  action?: string;
  metadata?: Record<string, unknown>;
}

// Track if Sentry is available and initialized
let sentryInitialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any = null;

// Hardcoded Sentry DSN for server-side monitoring
const SENTRY_DSN = 'https://8b4b2baee3c20047bad87165533e755f@o4510235027636224.ingest.de.sentry.io/4510235029798992';

/**
 * Initialize error monitoring
 * Call this at server startup
 */
export async function initializeErrorMonitoring(): Promise<void> {
  const dsn = process.env.SENTRY_DSN || SENTRY_DSN;
  
  if (!dsn) {
    console.log('[ErrorMonitoring] No SENTRY_DSN configured - using console logging only');
    return;
  }
  
  try {
    // Dynamically import Sentry only if DSN is configured
    // @ts-ignore - @sentry/node is optional dependency
    Sentry = await import('@sentry/node').catch(() => null);
    
    if (!Sentry) {
      console.warn('[ErrorMonitoring] @sentry/node not installed - run: pnpm add @sentry/node');
      return;
    }
    
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      // Capture 100% of errors in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.1,
      // Don't send errors in development unless explicitly enabled
      enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true',
      beforeSend(event: Record<string, unknown>) {
        // Scrub sensitive data
        const request = event.request as Record<string, unknown> | undefined;
        if (request?.headers) {
          const headers = request.headers as Record<string, unknown>;
          delete headers['authorization'];
          delete headers['cookie'];
        }
        return event;
      },
    });
    
    sentryInitialized = true;
    console.log('[ErrorMonitoring] Sentry initialized successfully');
  } catch (error) {
    console.warn('[ErrorMonitoring] Failed to initialize Sentry:', error);
    console.log('[ErrorMonitoring] Falling back to console logging');
  }
}

/**
 * Capture and report an exception
 */
export function captureException(error: Error | unknown, context?: ErrorContext): void {
  // Always log to console
  console.error('[ERROR]', error, context ? JSON.stringify(context) : '');
  
  // Send to Sentry if available
  if (sentryInitialized && Sentry) {
    Sentry.withScope((scope: { setUser: (user: { id: string } | null) => void; setTag: (key: string, value: string) => void; setExtras: (extras: Record<string, unknown>) => void }) => {
      if (context?.userId) {
        scope.setUser({ id: String(context.userId) });
      }
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      if (context?.metadata) {
        scope.setExtras(context.metadata);
      }
      
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(String(error), 'error');
      }
    });
  }
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  // Log to console
  const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
  logFn(`[${level.toUpperCase()}]`, message, context ? JSON.stringify(context) : '');
  
  // Send to Sentry if available
  if (sentryInitialized && Sentry) {
    Sentry.withScope((scope: { setUser: (user: { id: string } | null) => void; setTag: (key: string, value: string) => void; setExtras: (extras: Record<string, unknown>) => void }) => {
      if (context?.userId) {
        scope.setUser({ id: String(context.userId) });
      }
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      if (context?.metadata) {
        scope.setExtras(context.metadata);
      }
      
      Sentry.captureMessage(message, level);
    });
  }
}

/**
 * Set user context for subsequent error reports
 */
export function setUserContext(userId: number, email?: string): void {
  if (sentryInitialized && Sentry) {
    Sentry.setUser({ id: String(userId), email });
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  if (sentryInitialized && Sentry) {
    Sentry.setUser(null);
  }
}

/**
 * Flush pending events before shutdown
 * Call this before process.exit()
 */
export async function flushErrorMonitoring(timeout: number = 2000): Promise<void> {
  if (sentryInitialized && Sentry) {
    await Sentry.close(timeout);
  }
}

/**
 * Check if error monitoring is active
 */
export function isErrorMonitoringActive(): boolean {
  return sentryInitialized;
}
