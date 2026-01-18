import { Navigation } from "@/components/Navigation";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  /** Page title shown in header */
  title?: string;
  /** Subtitle/description shown below title */
  subtitle?: string;
  /** Actions to show in header (e.g., "New Invoice" button) */
  headerActions?: ReactNode;
  /** Use narrow max-width for forms/settings (default: false) */
  narrow?: boolean;
  /** Additional className for the content container */
  className?: string;
  /** Hide the page header section */
  hideHeader?: boolean;
}

/**
 * PageLayout - Standard layout wrapper for all authenticated pages
 *
 * Provides:
 * - Navigation bar
 * - Consistent max-width (1280px default, 896px for narrow)
 * - Responsive padding (16px mobile → 24px tablet → 32px desktop)
 * - Standard page header with title, subtitle, and actions
 *
 * Usage:
 * ```tsx
 * <PageLayout
 *   title="Invoices"
 *   subtitle="Manage your invoices"
 *   headerActions={<Button>New Invoice</Button>}
 * >
 *   <YourContent />
 * </PageLayout>
 * ```
 */
export function PageLayout({
  children,
  title,
  subtitle,
  headerActions,
  narrow = false,
  className,
  hideHeader = false,
}: PageLayoutProps) {
  return (
    <div className="page-wrapper">
      <Navigation />

      <main
        className={cn(
          "page-content",
          narrow && "page-content-narrow",
          className
        )}
      >
        {/* Page Header */}
        {!hideHeader && (title || headerActions) && (
          <div className="page-header">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {title && (
                <div>
                  <h1 className="page-header-title">{title}</h1>
                  {subtitle && (
                    <p className="page-header-subtitle">{subtitle}</p>
                  )}
                </div>
              )}
              {headerActions && (
                <div className="flex items-center gap-3">{headerActions}</div>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="section-stack">{children}</div>
      </main>
    </div>
  );
}

/**
 * PageSection - Wrapper for major page sections
 *
 * Use to group related content with consistent spacing
 */
export function PageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("space-y-4", className)}>{children}</section>;
}

/**
 * PageCard - Standard card with consistent padding
 */
export function PageCard({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground",
        compact ? "card-compact" : "card-standard",
        className
      )}
    >
      {children}
    </div>
  );
}

export default PageLayout;
