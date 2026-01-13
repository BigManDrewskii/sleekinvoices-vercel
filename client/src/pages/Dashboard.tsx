import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { DollarSign, FileText, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownRight, Sparkles, ChevronDown, Wand2, ClipboardList } from "lucide-react";
import { Plus } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { UpgradePromoBanner } from "@/components/UpgradePromoBanner";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { MagicInput } from "@/components/MagicInput";
import { useLocation } from "wouter";
import { MonthlyUsageCard } from "@/components/dashboard/MonthlyUsageCard";
import { StatsGridSkeleton, RecentInvoicesSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { formatCurrency } from "@/lib/utils";
import { Currency, DateDisplay, Numeric, InvoiceNumber } from "@/components/ui/typography";
import { AnimatedCurrency, AnimatedInteger, AnimatedPercentage } from "@/components/ui/animated-number";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70"><GearLoader size="md" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const recentInvoices = invoices?.slice(0, 5) || [];

  // Calculate invoices created this month
  const invoicesThisMonth = invoices?.filter((inv) => {
    const invoiceDate = new Date(inv.issueDate);
    const now = new Date();
    return invoiceDate.getMonth() === now.getMonth() &&
           invoiceDate.getFullYear() === now.getFullYear();
  }).length || 0;

  // Calculate quick stats for header chips
  const overdueCount = invoices?.filter(inv => inv.status === 'overdue').length || 0;
  const pendingCount = invoices?.filter(inv => inv.status === 'sent').length || 0;
  const draftCount = invoices?.filter(inv => inv.status === 'draft').length || 0;

  return (
    <div className="page-wrapper">
      <Navigation />

      {/* Main Content */}
      <main id="main-content" className="page-content page-transition" role="main" aria-label="Dashboard">
        <div className="section-stack">
          {/* Header */}
          <div className="page-header">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="page-header-title" data-onboarding="dashboard-title">Dashboard</h1>
                <p className="page-header-subtitle">Welcome back, {user?.name || "there"}!</p>
              </div>

              {/* Quick Stats Chips - All viewports */}
              <div className="flex items-center gap-2 flex-wrap">
                {overdueCount > 0 && (
                  <QuickStatChip
                    label="Overdue"
                    count={overdueCount}
                    variant="destructive"
                    onClick={() => setLocation('/invoices?status=overdue')}
                  />
                )}
                {pendingCount > 0 && (
                  <QuickStatChip
                    label="Pending"
                    count={pendingCount}
                    variant="warning"
                    onClick={() => setLocation('/invoices?status=sent')}
                  />
                )}
                {draftCount > 0 && (
                  <QuickStatChip
                    label="Draft"
                    count={draftCount}
                    variant="secondary"
                    onClick={() => setLocation('/invoices?status=draft')}
                  />
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="touch-target gap-2" data-onboarding="new-invoice-btn">
                    <Plus weight="bold" className="h-4 w-4" />
                    <span className="hidden sm:inline">New Invoice</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Choose how you'd like to create your invoice
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 px-6 py-4">
                    {/* AI Magic Invoice - Top option */}
                    <button
                      type="button"
                      className="group relative rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-4 cursor-pointer transition-all duration-200 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 w-full text-left"
                      onClick={() => {
                        // Scroll to Magic Invoice section and focus the input
                        const magicSection = document.querySelector('[data-magic-invoice]');
                        if (magicSection) {
                          magicSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          const input = magicSection.querySelector('input, textarea');
                          if (input) setTimeout(() => (input as HTMLElement).focus(), 500);
                        }
                        // Close the dialog
                        const closeBtn = document.querySelector('[data-dialog-close]') as HTMLElement;
                        if (closeBtn) closeBtn.click();
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">AI Magic Invoice</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Describe what you need in plain English and let AI create your invoice instantly.
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                          Fastest
                        </span>
                      </div>
                    </button>

                    {/* Smart Invoice Builder */}
                    <Link href="/invoices/guided">
                      <div className="group relative rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10 p-4 cursor-pointer transition-all duration-200 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                            <Wand2 className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">Smart Invoice Builder</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Answer simple questions step-by-step. Perfect for beginners or when you want guidance.
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-500">
                            Guided
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Classic Form */}
                    <Link href="/invoices/create">
                      <div className="group rounded-xl border border-border/50 bg-card/50 p-4 cursor-pointer transition-all duration-200 hover:border-border hover:bg-card hover:shadow-md">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground transition-colors">
                            <ClipboardList className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground mb-1">Classic Form</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Traditional invoice form with all fields visible. Best for experienced users.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Magic Invoice - AI-powered quick creation */}
          <MagicInvoiceSection />

          {/* Upgrade Promo Banner */}
          <UpgradePromoBanner />

          {/* Monthly Usage Card */}
          <MonthlyUsageCard
            invoicesCreatedThisMonth={invoicesThisMonth}
            invoiceLimit={undefined}
          />

          {/* Stats Grid - tweakcn style */}
          {statsLoading ? (
            <StatsGridSkeleton />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-onboarding="stats-grid">
            {/* Total Revenue */}
            <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-primary/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                  <ArrowUpRight className="h-3 w-3" />
                  <AnimatedPercentage value={stats?.revenueChangePercent || 12.5} showSign duration={600} delay={400} />
                </span>
              </div>
              <p className="text-2xl tracking-tight text-foreground">
                <AnimatedCurrency amount={stats?.totalRevenue || 0} bold duration={900} />
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                Trending up this month
              </p>
            </div>

            {/* Outstanding */}
            <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-amber/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                {(stats?.outstandingBalance || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>
              <p className="text-2xl tracking-tight text-foreground">
                <AnimatedCurrency amount={stats?.outstandingBalance || 0} bold duration={900} delay={100} />
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Awaiting payment
              </p>
            </div>

            {/* Total Invoices */}
            <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
              </div>
              <p className="text-2xl tracking-tight text-foreground">
                <AnimatedInteger value={stats?.totalInvoices || 0} bold duration={700} delay={200} />
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                All time invoices created
              </p>
            </div>

            {/* Paid Invoices */}
            <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 p-5 backdrop-blur-sm transition-all duration-200 hover:border-border hover:shadow-lg hover:shadow-emerald/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">Paid Invoices</p>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Paid
                </span>
              </div>
              <p className="text-2xl tracking-tight text-foreground">
                <AnimatedInteger value={stats?.paidInvoices || 0} bold duration={700} delay={300} />
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Successfully collected
              </p>
            </div>
          </div>
          )}

          {/* Recent Invoices */}
          <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recent Invoices</h3>
                <p className="text-sm text-muted-foreground">Your latest invoices and their status</p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-xl border-border/50 hover:border-border hover:bg-accent/50">
                <Link href="/invoices">View All</Link>
              </Button>
            </div>
            <div className="px-5 pb-5">
              {invoicesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-accent animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-accent animate-pulse rounded" />
                          <div className="h-3 w-20 bg-accent animate-pulse rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-5 w-16 bg-accent animate-pulse rounded-full" />
                        <div className="h-5 w-20 bg-accent animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentInvoices.length === 0 ? (
                <EmptyState
                  {...EmptyStatePresets.invoices}
                  action={{
                    label: "Create Invoice",
                    onClick: () => setLocation("/invoices/create"),
                    icon: Plus,
                  }}
                />
              ) : (
                <div className="space-y-2">
                  {recentInvoices.map((invoice) => (
                    <Link 
                      key={invoice.id} 
                      href={`/invoices/${invoice.id}`}
                      className="group flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border hover:bg-accent/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            <InvoiceNumber value={invoice.invoiceNumber} />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invoice.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={invoice.status} />
                        <span className="font-semibold text-foreground min-w-[80px] text-right tabular-nums">
                          <Currency amount={Number(invoice.total)} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MagicInvoiceSection() {
  const [, setLocation] = useLocation();
  
  const handleExtract = (data: {
    clientName?: string;
    clientEmail?: string;
    lineItems: Array<{ description: string; quantity: number; rate: number }>;
    dueDate?: string;
    notes?: string;
    currency?: string;
  }) => {
    // Navigate to create invoice with pre-filled data
    const params = new URLSearchParams();
    if (data.clientName) params.set('clientName', data.clientName);
    if (data.clientEmail) params.set('clientEmail', data.clientEmail);
    if (data.dueDate) params.set('dueDate', data.dueDate);
    if (data.notes) params.set('notes', data.notes);
    if (data.currency) params.set('currency', data.currency);
    if (data.lineItems.length > 0) {
      params.set('lineItems', JSON.stringify(data.lineItems));
    }
    setLocation(`/invoices/create?${params.toString()}`);
  };

  return (
    <div data-onboarding="magic-invoice" data-magic-invoice>
      <MagicInput onExtract={handleExtract} className="w-full" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-gray-500/10", text: "text-gray-400", label: "Draft" },
    sent: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Sent" },
    paid: { bg: "bg-green-500/10", text: "text-green-400", label: "Paid" },
    overdue: { bg: "bg-destructive/10", text: "text-destructive", label: "Overdue" },
    canceled: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Canceled" },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function QuickStatChip({
  label,
  count,
  variant,
  onClick
}: {
  label: string;
  count: number;
  variant: 'destructive' | 'warning' | 'secondary';
  onClick: () => void;
}) {
  const variantStyles = {
    destructive: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/100/20 hover:border-destructive/30",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/30",
    secondary: "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20 hover:border-gray-500/30",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${variantStyles[variant]}`}
      aria-label={`${count} ${label} invoices, click to view`}
    >
      <span className="font-semibold">{count}</span>
      <span>{label}</span>
    </button>
  );
}
