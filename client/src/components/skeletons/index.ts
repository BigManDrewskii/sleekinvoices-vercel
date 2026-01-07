/**
 * Skeleton Components Index
 * 
 * Central export for all loading skeleton components.
 * Import from this file for cleaner imports across the app.
 */

// Table skeletons
export {
  TableSkeleton,
  ClientsTableSkeleton,
  InvoicesTableSkeleton,
  ListRowSkeleton,
  TableFilterskeleton,
  PaginationSkeleton,
} from "./TableSkeleton";

// Card skeletons
export {
  StatCardSkeleton,
  StatsGridSkeleton,
  ContentCardSkeleton,
  FeatureCardSkeleton,
  TemplateCardSkeleton,
  TemplatesGridSkeleton,
  MonthlyUsageCardSkeleton,
  ChartCardSkeleton,
  PieChartCardSkeleton,
  PlanCardSkeleton,
} from "./CardSkeleton";

// Expenses skeletons
export {
  ExpensesPageSkeleton,
  ExpensesTableSkeleton,
  ExpenseStatsGridSkeleton,
  ExpenseFiltersSkeleton,
} from "./ExpensesPageSkeleton";

// Invoice skeletons
export {
  InvoiceListSkeleton,
  InvoiceFiltersSkeleton,
  InvoicesPageSkeleton,
} from "./InvoiceListSkeleton";

// Templates skeletons
export {
  TemplatesPageSkeleton,
  TemplatesGridSkeleton as TemplateCardsGridSkeleton,
  TemplatePreviewCardSkeleton,
  MainTemplateShowcaseSkeleton,
} from "./TemplatesPageSkeleton";

// Page-level skeletons
export {
  AnalyticsPageSkeleton,
  ViewInvoicePageSkeleton,
  InvoiceFormSkeleton,
  SettingsPageSkeleton,
  SubscriptionPageSkeleton,
  PaymentsPageSkeleton,
  RecurringInvoicesPageSkeleton,
  ProductsPageSkeleton,
  EstimatesPageSkeleton,
  ClientPortalPageSkeleton,
} from "./PageSkeletons";

// Re-export base skeleton components for custom usage
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonButton,
  SkeletonBadge,
} from "@/components/ui/skeleton";
