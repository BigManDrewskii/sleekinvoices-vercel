import * as Sentry from "@sentry/react";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { KeyboardShortcutsProvider } from "./contexts/KeyboardShortcutsContext";

import "./index.css";

// Initialize Sentry for error monitoring
Sentry.init({
  dsn: "https://8b4b2baee3c20047bad87165533e755f@o4510235027636224.ingest.de.sentry.io/4510235029798992",
  // Setting this option to true will send default PII data to Sentry
  sendDefaultPii: true,
  // Only enable in production
  enabled: import.meta.env.PROD,
  // Set environment
  environment: import.meta.env.MODE,
  // Release tracking - associates errors with specific deployments
  // Format: sleekinvoices@version+git-commit-hash (set by build process)
  release:
    import.meta.env.VITE_SENTRY_RELEASE ||
    `sleekinvoices@${import.meta.env.VITE_APP_VERSION || "1.0.0"}`,
  // Capture 100% of transactions for performance monitoring
  tracesSampleRate: 1.0,
});

// Suppress benign ResizeObserver warnings
// These occur when components resize faster than the observer can process
// and don't affect functionality
const resizeObserverErrHandler = (e: ErrorEvent) => {
  if (
    e.message ===
    "ResizeObserver loop completed with undelivered notifications."
  ) {
    e.stopImmediatePropagation();
    return true;
  }
};
window.addEventListener("error", resizeObserverErrHandler);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 30 seconds before refetching
      staleTime: 30 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Retry failed queries once
      retry: 1,
      // Show stale data while revalidating
      placeholderData: (previousData: unknown) => previousData,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Public paths that should NOT redirect to login on auth errors
const PUBLIC_PATHS = [
  "/",
  "/landing",
  "/docs",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/portal", // Client portal paths start with /portal
];

const isPublicPath = () => {
  const path = window.location.pathname;
  return PUBLIC_PATHS.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`) || path.startsWith("/portal/")
  );
};

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Don't redirect on public pages - they should work without auth
  if (isPublicPath()) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    if (import.meta.env.DEV) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (import.meta.env.DEV) {
      console.error("[API Mutation Error]", error);
    }
  }
});

// CSRF header name and value for protection against cross-site request forgery
const CSRF_HEADER_NAME = "x-csrf-protection";
const CSRF_HEADER_VALUE = "1";

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Include CSRF protection header on all requests
        return {
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        };
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p>An error occurred. Please refresh the page.</p>
      </div>
    }
  >
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <KeyboardShortcutsProvider>
          <App />
        </KeyboardShortcutsProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </Sentry.ErrorBoundary>
);
