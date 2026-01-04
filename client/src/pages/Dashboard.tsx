import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { DollarSign, FileText, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { Link } from "wouter";
import { UsageIndicator } from "@/components/UsageIndicator";

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
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/SleekInvoices-Wide.svg" alt="SleekInvoices" className="h-6" />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-foreground">
                Dashboard
              </Link>
              <Link href="/invoices" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Invoices
              </Link>
              <Link href="/clients" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Clients
              </Link>
              <Link href="/analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {user?.name || "Settings"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || "there"}!</p>
          </div>
          <Button asChild>
            <Link href="/invoices/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        </div>

        {/* Usage Indicator for Free Tier */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Usage</CardTitle>
              <CardDescription>Track your invoice creation limit</CardDescription>
            </CardHeader>
            <CardContent>
              <UsageIndicator />
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
                  <Link href="/invoices/new">Create Invoice</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <Link 
                    key={invoice.id} 
                    href={`/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium status-${invoice.status}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                      <span className="font-semibold text-foreground">${Number(invoice.total).toFixed(2)}</span>
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

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      </CardContent>
    </Card>
  );
}
