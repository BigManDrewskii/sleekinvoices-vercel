import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Navigation } from "@/components/Navigation";

// Status colors matching the design system
const STATUS_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  draft: { bg: "bg-slate-500/10", text: "text-slate-400", fill: "#94a3b8" },
  sent: { bg: "bg-blue-500/10", text: "text-blue-400", fill: "#6695ff" },
  paid: { bg: "bg-green-500/10", text: "text-green-400", fill: "#22c55e" },
  overdue: { bg: "bg-red-500/10", text: "text-red-400", fill: "#ff4379" },
  canceled: { bg: "bg-slate-500/10", text: "text-slate-500", fill: "#64748b" },
};

// Chart gradient colors
const CHART_GRADIENT_START = "#5f6fff";
const CHART_GRADIENT_END = "rgba(95, 111, 255, 0.05)";

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
  
  const { data: agingReport } = trpc.analytics.getAgingReport.useQuery(
    undefined,
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
    totalRevenue = 0,
    totalInvoices = 0,
    paidInvoices = 0,
    outstandingAmount = 0,
    monthlyRevenue = [],
    statusBreakdown = [],
    revenueChangePercent = 0,
  } = analytics || {};

  // Calculate net profit
  const totalExpenses = parseFloat(expenseStats?.totalExpenses?.toString() || "0");
  const netProfit = parseFloat(totalRevenue?.toString() || "0") - totalExpenses;
  const revenueNum = parseFloat(totalRevenue?.toString() || "0");
  const outstandingNum = parseFloat(outstandingAmount?.toString() || "0");

  // Format monthly revenue data for chart
  const revenueChartData = monthlyRevenue.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: parseFloat(item.revenue),
  }));

  // Create sparkline data from monthly revenue (last 7 points)
  const sparklineData = revenueChartData.slice(-7).map((item, index) => ({
    value: item.revenue,
    index,
  }));

  // Format status breakdown for display
  const statusChartData = statusBreakdown
    .filter((item: any) => item.count > 0)
    .map((item: any) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      status: item.status,
      value: item.count,
      amount: parseFloat(item.totalAmount),
    }));

  // Calculate total for percentages
  const totalStatusCount = statusChartData.reduce((sum: number, item: any) => sum + item.value, 0);

  // Time range labels
  const timeRangeLabels = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 3 months",
    "1y": "Last year",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with time range toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Financial overview and invoice performance</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
              {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {range === "7d" ? "7D" : range === "30d" ? "30D" : range === "90d" ? "3M" : "1Y"}
                </Button>
              ))}
            </div>
          </div>

          {/* Key Metrics - 4 stat cards with sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue with Sparkline */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  {revenueChangePercent !== 0 && (
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      revenueChangePercent >= 0 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {revenueChangePercent >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {revenueChangePercent >= 0 ? "+" : ""}{revenueChangePercent}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold mt-2 tracking-tight">
                  {formatCurrency(revenueNum)}
                </p>
                {/* Mini Sparkline */}
                {sparklineData.length > 1 && (
                  <div className="mt-3 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineData}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={CHART_GRADIENT_START}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  {revenueChangePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  {revenueChangePercent >= 0 ? "Trending up" : "Trending down"} this period
                </p>
              </CardContent>
            </Card>

            {/* Outstanding */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  {outstandingNum > 0 && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                      <ArrowDownRight className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold mt-2 tracking-tight">
                  {formatCurrency(outstandingNum)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalInvoices - paidInvoices} unpaid invoices
                </p>
              </CardContent>
            </Card>

            {/* Active Invoices */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Active Invoices</p>
                </div>
                <p className="text-3xl font-bold mt-2 tracking-tight">
                  {totalInvoices}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Total invoices created
                </p>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  {netProfit >= 0 ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      Profit
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                      <TrendingDown className="h-3 w-3" />
                      Loss
                    </span>
                  )}
                </div>
                <p className={`text-3xl font-bold mt-2 tracking-tight ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(netProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Revenue − Expenses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart - Full width area chart */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">Revenue Trend</CardTitle>
                  <CardDescription>Total for {timeRangeLabels[timeRange].toLowerCase()}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_GRADIENT_START} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={CHART_GRADIENT_END} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      dx={-10}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_GRADIENT_START}
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={{ fill: CHART_GRADIENT_START, strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: CHART_GRADIENT_START, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  No revenue data for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two column: Invoice Status + Aging Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Status - Improved Table UI */}
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Invoice Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <div className="space-y-3">
                    {statusChartData.map((entry: any) => {
                      const config = STATUS_COLORS[entry.status] || STATUS_COLORS.draft;
                      const percentage = totalStatusCount > 0 ? (entry.value / totalStatusCount) * 100 : 0;
                      
                      return (
                        <div key={entry.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                                {entry.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">{entry.value}</span>
                              <span className="text-sm text-muted-foreground w-24 text-right">
                                {formatCurrency(entry.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: config.fill
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[160px] flex items-center justify-center text-muted-foreground">
                    No invoices yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Accounts Receivable Aging */}
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Receivables Aging</CardTitle>
                <CardDescription>Outstanding invoices by days overdue</CardDescription>
              </CardHeader>
              <CardContent>
                {agingReport ? (
                  <div className="space-y-3">
                    {[
                      { label: "Current", data: agingReport.current, color: "#22c55e" },
                      { label: "1-30 Days", data: agingReport.days_0_30, color: "#eab308" },
                      { label: "31-60 Days", data: agingReport.days_31_60, color: "#f97316" },
                      { label: "61-90 Days", data: agingReport.days_61_90, color: "#ef4444" },
                      { label: "90+ Days", data: agingReport.days_90_plus, color: "#dc2626" },
                    ].map((item) => {
                      const totalAging = 
                        agingReport.current.amount + 
                        agingReport.days_0_30.amount + 
                        agingReport.days_31_60.amount + 
                        agingReport.days_61_90.amount + 
                        agingReport.days_90_plus.amount;
                      const percentage = totalAging > 0 ? (item.data.amount / totalAging) * 100 : 0;
                      
                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm text-muted-foreground">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium">{item.data.count}</span>
                              <span className="text-sm text-muted-foreground w-24 text-right">
                                {formatCurrency(item.data.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.max(percentage, item.data.count > 0 ? 5 : 0)}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[160px] flex items-center justify-center text-muted-foreground">
                    Loading aging report...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Expenses by Category - only show if data exists */}
          {expenseStats?.expensesByCategory && expenseStats.expensesByCategory.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Expenses by Category</CardTitle>
                <CardDescription>Breakdown of expenses (last 6 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseStats.expensesByCategory.map((cat: any) => {
                    const percentage = totalExpenses > 0 
                      ? (parseFloat(cat.total) / totalExpenses) * 100 
                      : 0;
                    return (
                      <div key={cat.categoryId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat.categoryColor || "hsl(var(--primary))" }}
                            />
                            <span className="text-sm">{cat.categoryName || "Uncategorized"}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              {formatCurrency(parseFloat(cat.total))}
                            </span>
                            <span className="text-xs text-muted-foreground w-16 text-right">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: cat.categoryColor || "hsl(var(--primary))"
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
