import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  Download,
  RefreshCw,
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
  Area,
  AreaChart,
} from "recharts";
import { Navigation } from "@/components/Navigation";
import { AnalyticsMetricCard } from "@/components/analytics/AnalyticsMetricCard";
import { AnalyticsDateRangeFilter } from "@/components/analytics/AnalyticsDateRangeFilter";

const STATUS_COLORS = {
  draft: "#94a3b8",
  sent: "#3b82f6",
  paid: "#22c55e",
  overdue: "#ef4444",
  canceled: "#64748b",
};

const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#eab308",
};

export default function AnalyticsEnhanced() {
  const { user, loading, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: analytics, isLoading, refetch } = trpc.invoices.getAnalytics.useQuery(
    { timeRange },
    { enabled: isAuthenticated }
  );
  
  const { data: expenseStats } = trpc.expenses.stats.useQuery(
    { months: 6 },
    { enabled: isAuthenticated }
  );
  
  const { data: agingReport } = trpc.analytics.getAgingReport.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: clientProfitability } = trpc.analytics.getClientProfitability.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: cashFlowProjection } = trpc.analytics.getCashFlowProjection.useQuery(
    { months: 6 },
    { enabled: isAuthenticated }
  );
  
  const { data: revenueVsExpenses } = trpc.analytics.getRevenueVsExpenses.useQuery(
    { year: new Date().getFullYear() },
    { enabled: isAuthenticated }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (loading || isLoading) {
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

  const netProfit = parseFloat(analytics?.totalRevenue?.toString() || "0") - 
                    parseFloat(expenseStats?.totalExpenses?.toString() || "0");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your revenue, expenses, and business performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <AnalyticsDateRangeFilter value={timeRange} onChange={setTimeRange} />
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <AnalyticsMetricCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
              icon={<DollarSign className="h-5 w-5" />}
              subtitle={`From ${paidInvoices} paid invoices`}
              trend={{
                value: 12.5,
                isPositive: true,
                label: "vs last period",
              }}
            />

            <AnalyticsMetricCard
              title="Outstanding"
              value={formatCurrency(outstandingAmount)}
              icon={<AlertCircle className="h-5 w-5" />}
              subtitle={`${totalInvoices - paidInvoices} unpaid invoices`}
              trend={{
                value: 8.2,
                isPositive: false,
                label: "vs last period",
              }}
              valueClassName="text-orange-600 dark:text-orange-400"
            />

            <AnalyticsMetricCard
              title="Total Invoices"
              value={totalInvoices}
              icon={<FileText className="h-5 w-5" />}
              subtitle={`${Math.round((paidInvoices / (totalInvoices || 1)) * 100)}% paid`}
              trend={{
                value: 5.3,
                isPositive: true,
                label: "vs last period",
              }}
            />

            <AnalyticsMetricCard
              title="Average Value"
              value={formatCurrency(averageInvoiceValue)}
              icon={<TrendingUp className="h-5 w-5" />}
              subtitle="Per invoice"
              trend={{
                value: 3.1,
                isPositive: true,
                label: "vs last period",
              }}
            />
          </div>

          {/* Primary Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Over Time - Larger */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue performance</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={CHART_COLORS.primary}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status - Pie Chart */}
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
                        fill={CHART_COLORS.primary}
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
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
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

          {/* Profit & Loss Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue, expenses, and profit summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(parseFloat(analytics?.totalRevenue?.toString() || "0"))}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total Expenses</p>
                  <p className="text-3xl font-bold text-destructive dark:text-destructive">
                    {formatCurrency(parseFloat(expenseStats?.totalExpenses?.toString() || "0"))}
                  </p>
                </div>
                <div className={cn(
                  "p-4 rounded-lg border",
                  netProfit >= 0
                    ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                )}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Net Profit</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    netProfit >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-orange-600 dark:text-orange-400"
                  )}>
                    {formatCurrency(netProfit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Invoice Volume */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Volume</CardTitle>
                <CardDescription>Number of invoices created each month</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="invoices" fill={CHART_COLORS.primary} name="Invoices Created" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for the selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cash Flow Projection */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Projection</CardTitle>
                <CardDescription>Expected income and expenses for next 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {cashFlowProjection && cashFlowProjection.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cashFlowProjection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="expectedIncome" stroke={CHART_COLORS.green} strokeWidth={2} name="Expected Income" />
                      <Line type="monotone" dataKey="expectedExpenses" stroke={CHART_COLORS.red} strokeWidth={2} name="Expected Expenses" />
                      <Line type="monotone" dataKey="netCashFlow" stroke={CHART_COLORS.blue} strokeWidth={2} name="Net Cash Flow" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Loading cash flow projection...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Aging Report */}
          {agingReport && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Accounts Receivable Aging</CardTitle>
                <CardDescription>Outstanding invoices by days overdue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">Current</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{agingReport.current.count}</div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">{formatCurrency(agingReport.current.amount)}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">0-30 Days</div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{agingReport.days_0_30.count}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{formatCurrency(agingReport.days_0_30.amount)}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">31-60 Days</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{agingReport.days_31_60.count}</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">{formatCurrency(agingReport.days_31_60.amount)}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">61-90 Days</div>
                    <div className="text-2xl font-bold text-destructive dark:text-destructive">{agingReport.days_61_90.count}</div>
                    <div className="text-xs text-destructive dark:text-destructive mt-1">{formatCurrency(agingReport.days_61_90.amount)}</div>
                  </div>
                  <div className="p-4 rounded-lg border border-destructive bg-destructive/20">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">90+ Days</div>
                    <div className="text-2xl font-bold text-red-700">{agingReport.days_90_plus.count}</div>
                    <div className="text-xs text-red-700 mt-1 font-semibold">{formatCurrency(agingReport.days_90_plus.amount)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Profitability */}
          {clientProfitability && clientProfitability.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Top Clients by Profitability</CardTitle>
                <CardDescription>Revenue and profit by client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold text-muted-foreground">Client</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">Revenue</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">Expenses</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">Profit</th>
                        <th className="text-right p-3 font-semibold text-muted-foreground">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientProfitability.slice(0, 10).map((client: any) => (
                        <tr key={client.clientId} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium">{client.clientName}</td>
                          <td className="text-right p-3 text-green-600 dark:text-green-400">{formatCurrency(client.revenue)}</td>
                          <td className="text-right p-3 text-destructive dark:text-destructive">{formatCurrency(client.expenses)}</td>
                          <td className={cn(
                            "text-right p-3 font-semibold",
                            client.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive dark:text-destructive"
                          )}>
                            {formatCurrency(client.profit)}
                          </td>
                          <td className={cn(
                            "text-right p-3",
                            client.margin >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive dark:text-destructive"
                          )}>
                            {client.margin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revenue vs Expenses */}
          {revenueVsExpenses && revenueVsExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Profit & Loss</CardTitle>
                <CardDescription>Revenue vs expenses for {new Date().getFullYear()}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueVsExpenses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: any) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill={CHART_COLORS.green} name="Revenue" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill={CHART_COLORS.red} name="Expenses" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="netProfit" fill={CHART_COLORS.blue} name="Net Profit" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function for cn
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
