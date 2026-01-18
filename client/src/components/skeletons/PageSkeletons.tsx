import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";

/**
 * Analytics Page Skeleton
 * Matches the analytics dashboard layout with charts and stats
 */
export function AnalyticsPageSkeleton() {
  return (
    <PageLayout title="Analytics" subtitle="Track your business performance">
      {/* Time Range Filter */}
      <div className="flex justify-end mb-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Revenue Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-44 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}

/**
 * View Invoice Page Skeleton
 * Matches the invoice detail view layout
 */
export function ViewInvoicePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Invoice Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <Card className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-3 border-b border-border/50 last:border-0"
                    >
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Totals */}
            <Card className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-20" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Create/Edit Invoice Page Skeleton
 * Matches the invoice form layout
 */
export function InvoiceFormSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Client Selection */}
          <Card className="border-border/50">
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card className="border-border/50">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="grid gap-4 md:grid-cols-12 items-end">
                    <div className="md:col-span-5">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <Skeleton className="h-4 w-12 mb-2" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="md:col-span-2">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="md:col-span-1">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex gap-8">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-8">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-8 pt-2 border-t border-border/50">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Settings Page Skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <PageLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-2xl space-y-8">
        {/* Profile Section */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-48 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </CardContent>
        </Card>

        {/* Company Section */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-56 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </CardContent>
        </Card>

        {/* Logo Section */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-52 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

/**
 * Subscription Page Skeleton
 */
export function SubscriptionPageSkeleton() {
  return (
    <PageLayout title="Subscription" subtitle="Manage your plan and billing">
      <div className="max-w-4xl space-y-8">
        {/* Current Plan */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-7 w-20 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-10 w-full rounded-lg mt-6" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

/**
 * Payments Page Skeleton
 */
export function PaymentsPageSkeleton() {
  return (
    <PageLayout title="Payments" subtitle="Track and manage your payments">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payments Table */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48 mt-1" />
          </div>
          <Skeleton className="h-9 w-36 rounded-lg" />
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 pb-3 border-b border-border/50">
            {["Date", "Invoice", "Client", "Amount", "Method"].map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          {/* Table Rows */}
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="grid grid-cols-5 gap-4 items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

/**
 * Recurring Invoices Page Skeleton
 */
export function RecurringInvoicesPageSkeleton() {
  return (
    <PageLayout
      title="Recurring Invoices"
      subtitle="Manage your recurring billing"
    >
      <div className="flex justify-end mb-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}

/**
 * Products Page Skeleton
 */
export function ProductsPageSkeleton() {
  return (
    <PageLayout
      title="Products & Services"
      subtitle="Manage your product catalog"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-border/50">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Products Table */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-40 mt-1" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

/**
 * Estimates Page Skeleton
 */
export function EstimatesPageSkeleton() {
  return (
    <PageLayout title="Estimates" subtitle="Create and manage client estimates">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <Card className="border-border/50">
        <CardContent className="pt-6">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 pb-3 border-b border-border/50">
            {["Number", "Client", "Date", "Amount", "Status", "Actions"].map(
              (_, i) => (
                <Skeleton key={i} className="h-4 w-16" />
              )
            )}
          </div>
          {/* Table Rows */}
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="grid grid-cols-6 gap-4 items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}

/**
 * Client Portal Page Skeleton
 */
export function ClientPortalPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Client Info */}
        <Card className="border-border/50 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card className="border-border/50">
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex items-center justify-between py-4 border-b border-border/50 last:border-0"
                >
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
