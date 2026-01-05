import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { DollarSign, FileText, TrendingUp, TrendingDown, AlertCircle, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { UpgradePromoBanner } from "@/components/UpgradePromoBanner";
import { MonthlyUsageCard } from "@/components/dashboard/MonthlyUsageCard";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name || "there"}!</p>
            </div>
            <Button asChild>
              <Link href="/invoices/create" className="flex items-center gap-2 justify-center">
                <Plus className="h-4 w-4" />
                New Invoice
              </Link>
            </Button>
          </div>

          {/* Upgrade Promo Banner */}
          <UpgradePromoBanner />

          {/* Monthly Usage Card */}
          <MonthlyUsageCard
            invoicesCreatedThisMonth={invoicesThisMonth}
            invoiceLimit={undefined}
          />

          {/* Stats Grid - tweakcn style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                    <ArrowUpRight className="h-3 w-3" />
                    +12.5%
                  </span>
                </div>
                <p className="text-3xl font-bold mt-2 tracking-tight">
                  {statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Trending up this month
                </p>
              </CardContent>
            </Card>

            {/* Outstanding */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  {(stats?.outstandingBalance || 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                      <AlertCircle className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold mt-2 tracking-tight">
                  {statsLoading ? "..." : formatCurrency(stats?.outstandingBalance || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            {/* Total Invoices */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                </div>
                <p className="text-3xl font-bold mt-2 tracking-tight">
                  {statsLoading ? "..." : stats?.totalInvoices || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  All time invoices created
                </p>
              </CardContent>
            </Card>

            {/* Paid Invoices */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    Paid
                  </span>
                </div>
                <p className="text-3xl font-bold mt-2 tracking-tight">
                  {statsLoading ? "..." : stats?.paidInvoices || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Successfully collected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">Recent Invoices</CardTitle>
                  <CardDescription>Your latest invoices and their status</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/invoices">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : recentInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No invoices yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first invoice to get started</p>
                  <Button asChild>
                    <Link href="/invoices/create">Create Invoice</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentInvoices.map((invoice) => (
                    <Link 
                      key={invoice.id} 
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invoice.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={invoice.status} />
                        <span className="font-semibold text-foreground min-w-[80px] text-right">
                          {formatCurrency(Number(invoice.total))}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-gray-500/10", text: "text-gray-400", label: "Draft" },
    sent: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Sent" },
    paid: { bg: "bg-green-500/10", text: "text-green-400", label: "Paid" },
    overdue: { bg: "bg-red-500/10", text: "text-red-400", label: "Overdue" },
    canceled: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Canceled" },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
