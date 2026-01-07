import { trpc } from "@/lib/trpc";
import { useCallback, useRef } from "react";

/**
 * Custom hook for prefetching data on hover/focus
 * Improves perceived performance by loading data before navigation
 */

type PrefetchableRoutes = 
  | "clients"
  | "invoices"
  | "expenses"
  | "templates"
  | "analytics"
  | "payments"
  | "products"
  | "estimates"
  | "recurringInvoices";

export function usePrefetch() {
  const utils = trpc.useUtils();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetch = useCallback(
    (route: PrefetchableRoutes, id?: number) => {
      const cacheKey = id ? `${route}-${id}` : route;
      
      // Don't prefetch if already prefetched recently
      if (prefetchedRef.current.has(cacheKey)) {
        return;
      }

      // Mark as prefetched
      prefetchedRef.current.add(cacheKey);

      // Clear from cache after 60 seconds to allow re-prefetch
      setTimeout(() => {
        prefetchedRef.current.delete(cacheKey);
      }, 60000);

      // Prefetch based on route
      switch (route) {
        case "clients":
          utils.clients.list.prefetch();
          break;
        case "invoices":
          if (id) {
            utils.invoices.get.prefetch({ id });
          } else {
            utils.invoices.list.prefetch();
          }
          break;
        case "expenses":
          utils.expenses.list.prefetch();
          utils.expenses.categories.list.prefetch();
          break;
        case "templates":
          utils.templates.list.prefetch();
          break;
        case "analytics":
          utils.invoices.getAnalytics.prefetch({ timeRange: "30d" });
          break;
        case "payments":
          utils.payments.list.prefetch({});
          utils.payments.getStats.prefetch();
          break;
        case "products":
          utils.products.list.prefetch({ includeInactive: false });
          break;
        case "estimates":
          if (id) {
            utils.estimates.get.prefetch({ id });
          } else {
            utils.estimates.list.prefetch();
          }
          break;
        case "recurringInvoices":
          utils.recurringInvoices.list.prefetch();
          break;
      }
    },
    [utils]
  );

  const prefetchOnHover = useCallback(
    (route: PrefetchableRoutes, id?: number) => ({
      onMouseEnter: () => prefetch(route, id),
      onFocus: () => prefetch(route, id),
    }),
    [prefetch]
  );

  return { prefetch, prefetchOnHover };
}

/**
 * Hook for prefetching invoice details
 */
export function usePrefetchInvoice() {
  const utils = trpc.useUtils();
  const prefetchedRef = useRef<Set<number>>(new Set());

  const prefetchInvoice = useCallback(
    (id: number) => {
      if (prefetchedRef.current.has(id)) return;
      
      prefetchedRef.current.add(id);
      utils.invoices.get.prefetch({ id });

      setTimeout(() => {
        prefetchedRef.current.delete(id);
      }, 60000);
    },
    [utils]
  );

  return { prefetchInvoice };
}

/**
 * Hook for prefetching client details
 */
export function usePrefetchClient() {
  const utils = trpc.useUtils();
  const prefetchedRef = useRef<Set<number>>(new Set());

  const prefetchClient = useCallback(
    (id: number) => {
      if (prefetchedRef.current.has(id)) return;
      
      prefetchedRef.current.add(id);
      utils.clients.get.prefetch({ id });

      setTimeout(() => {
        prefetchedRef.current.delete(id);
      }, 60000);
    },
    [utils]
  );

  return { prefetchClient };
}
