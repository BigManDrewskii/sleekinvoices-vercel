import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = {
  draft: "#94a3b8",
  sent: "#3b82f6",
  paid: "#22c55e",
  overdue: "#ef4444",
  canceled: "#64748b",
};

export default function Analytics() {
  const { user, loading, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const { data: analytics, isLoading } = trpc.invoices.getAnalytics.useQuery(
    { timeRange },
    { enabled: isAuthenticated }
  );
  
  const { data: expenseStats } = trpc.expenses.stats.useQuery(
    { months: 6 },
    { enabled: isAuthenticated }
  );

  if (loading || isLoading) {
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

  const {
    totalRevenue,
    totalInvoices,
    paidInvoices,
    outstandingAmount,
    averageInvoiceValue,
    monthlyRevenue,
    statusBreakdown,
  } = analytics || {
    totalRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    outstandingAmount: 0,
    averageInvoiceValue: 0,
    monthlyRevenue: [],
    statusBreakdown: [],
  };

  // Format monthly revenue data for chart
  const revenueChartData = monthlyRevenue.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    revenue: parseFloat(item.revenue),
    invoices: item.count,
  }));

  // Format status breakdown for pie chart
  const statusChartData = statusBreakdown.map((item: any) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
    amount: parseFloat(item.totalAmount),
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <a className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">InvoiceFlow</span>
              </a>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </Link>
              <Link href="/invoices">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Invoices
                </a>
              </Link>
              <Link href="/clients">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Clients
                </a>
              </Link>
              <Link href="/analytics">
                <a className="text-sm font-medium text-foreground">Analytics</a>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {user?.name || "Settings"}
              </a>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-muted-foreground">Track your revenue and invoice performance</p>
            </div>
            <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {paidInvoices} paid invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(outstandingAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalInvoices - paidInvoices} unpaid invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((paidInvoices / (totalInvoices || 1)) * 100)}% paid
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(averageInvoiceValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per invoice</p>
              </CardContent>
            </Card>
          </div>

          {/* Profit & Loss */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Profit & Loss Overview</CardTitle>
              <CardDescription>Revenue vs Expenses (Last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(parseFloat(analytics?.totalRevenue?.toString() || "0"))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(parseFloat(expenseStats?.totalExpenses?.toString() || "0"))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Net Profit</p>
                  <p className={`text-3xl font-bold ${
                    (parseFloat(analytics?.totalRevenue?.toString() || "0") - parseFloat(expenseStats?.totalExpenses?.toString() || "0")) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {formatCurrency(
                      parseFloat(analytics?.totalRevenue?.toString() || "0") - parseFloat(expenseStats?.totalExpenses?.toString() || "0")
                    )}
                  </p>
                </div>
              </div>
              
              {expenseStats?.expensesByCategory && expenseStats.expensesByCategory.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-4">Expenses by Category</h4>
                  <div className="space-y-3">
                    {expenseStats.expensesByCategory.map((cat: any) => (
                      <div key={cat.categoryId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.categoryColor || "#3B82F6" }}
                          />
                          <span className="text-sm">{cat.categoryName || "Uncategorized"}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(parseFloat(cat.total))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Monthly revenue and invoice count</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) =>
                          name === "revenue" ? formatCurrency(value) : value
                        }
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>Breakdown by status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {statusChartData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              STATUS_COLORS[
                                entry.name.toLowerCase() as keyof typeof STATUS_COLORS
                              ] || "#94a3b8"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: string, props: any) =>
                          `${value} invoices (${formatCurrency(props.payload.amount)})`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No invoices yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Count by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Volume</CardTitle>
              <CardDescription>Number of invoices created each month</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="invoices" fill="hsl(var(--primary))" name="Invoices Created" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
