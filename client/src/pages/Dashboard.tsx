import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { DollarSign, FileText, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { UpgradePromoBanner } from "@/components/UpgradePromoBanner";
import { MonthlyUsageCard } from "@/components/dashboard/MonthlyUsageCard";
import { TrendIndicator } from "@/components/dashboard/TrendIndicator";

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Welcome back, {user?.name || "there"}!</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/invoices/create" className="flex items-center gap-2 justify-center">
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>

        {/* Upgrade Promo Banner */}
        <div className="mb-6 md:mb-8">
          <UpgradePromoBanner />
        </div>

        {/* Monthly Usage Card */}
        <div className="mb-6 md:mb-8">
          <MonthlyUsageCard
            invoicesCreatedThisMonth={invoices?.filter((inv) => {
              const invoiceDate = new Date(inv.issueDate);
              const now = new Date();
              return invoiceDate.getMonth() === now.getMonth() &&
                     invoiceDate.getFullYear() === now.getFullYear();
            }).length || 0}
            invoiceLimit={undefined}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatCard
            title="Total Revenue"
            value={statsLoading ? "..." : `$${stats?.totalRevenue.toFixed(2) || "0.00"}`}
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
          />
          <StatCard
            title="Outstanding"
            value={statsLoading ? "..." : `$${stats?.outstandingBalance.toFixed(2) || "0.00"}`}
            icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
          />
          <StatCard
            title="Total Invoices"
            value={statsLoading ? "..." : stats?.totalInvoices.toString() || "0"}
            icon={<FileText className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            title="Paid Invoices"
            value={statsLoading ? "..." : stats?.paidInvoices.toString() || "0"}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          />
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
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
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <Link 
                    key={invoice.id} 
                    href={`/invoices/${invoice.id}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
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
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium status-${invoice.status}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                        <span className="font-semibold text-foreground">${Number(invoice.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon,
  trend,
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: { percentage: number; isPositive: boolean };
}) {
  return (
    <Card className="hover-lift transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/20">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {trend && (
          <div className="mt-2">
            <TrendIndicator 
              percentage={trend.percentage} 
              isPositive={trend.isPositive}
              showLabel={true}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
