import { useAuth } from "@/_core/hooks/useAuth";
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
import { Calendar } from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Navigation } from "@/components/Navigation";

// Status colors matching the design system
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
  } = analytics || {};

  // Calculate net profit
  const totalExpenses = parseFloat(expenseStats?.totalExpenses?.toString() || "0");
  const netProfit = parseFloat(totalRevenue?.toString() || "0") - totalExpenses;

  // Format monthly revenue data for chart
  const revenueChartData = monthlyRevenue.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString("en-US", {
      month: "short",
    }),
    revenue: parseFloat(item.revenue),
  }));

  // Format status breakdown for pie chart
  const statusChartData = statusBreakdown
    .filter((item: any) => item.count > 0)
    .map((item: any) => ({
      name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      value: item.count,
      amount: parseFloat(item.totalAmount),
    }));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm text-muted-foreground">Financial overview and invoice performance</p>
            </div>
            <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
              <SelectTrigger className="w-full sm:w-[160px]">
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

          {/* Financial Summary - Single card with 3 key metrics */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(parseFloat(totalRevenue?.toString() || "0"))}
                  </p>
                  <p className="text-xs text-muted-foreground">{paidInvoices} paid invoices</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {formatCurrency(parseFloat(outstandingAmount?.toString() || "0"))}
                  </p>
                  <p className="text-xs text-muted-foreground">{totalInvoices - paidInvoices} unpaid</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(netProfit)}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue − Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two column: Revenue Trend + Invoice Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                    No revenue data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Invoice Status</CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusChartData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.name.toLowerCase() as keyof typeof STATUS_COLORS] || "#94a3b8"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: string, props: any) => [
                            `${value} invoices`,
                            props.payload.name
                          ]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {statusChartData.map((entry: any) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: STATUS_COLORS[entry.name.toLowerCase() as keyof typeof STATUS_COLORS] || "#94a3b8" }}
                            />
                            <span className="text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="font-medium">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No invoices yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Accounts Receivable Aging */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Accounts Receivable Aging</CardTitle>
              <CardDescription>Outstanding invoices by days overdue</CardDescription>
            </CardHeader>
            <CardContent>
              {agingReport ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Current</p>
                    <p className="text-xl font-bold">{agingReport.current.count}</p>
                    <p className="text-sm text-green-500">{formatCurrency(agingReport.current.amount)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">1-30 Days</p>
                    <p className="text-xl font-bold">{agingReport.days_0_30.count}</p>
                    <p className="text-sm text-yellow-500">{formatCurrency(agingReport.days_0_30.amount)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">31-60 Days</p>
                    <p className="text-xl font-bold">{agingReport.days_31_60.count}</p>
                    <p className="text-sm text-orange-500">{formatCurrency(agingReport.days_31_60.amount)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">61-90 Days</p>
                    <p className="text-xl font-bold">{agingReport.days_61_90.count}</p>
                    <p className="text-sm text-red-500">{formatCurrency(agingReport.days_61_90.amount)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border col-span-2 sm:col-span-1">
                    <p className="text-xs text-muted-foreground mb-1">90+ Days</p>
                    <p className="text-xl font-bold">{agingReport.days_90_plus.count}</p>
                    <p className="text-sm text-red-600 font-medium">{formatCurrency(agingReport.days_90_plus.amount)}</p>
                  </div>
                </div>
              ) : (
                <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                  Loading aging report...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses by Category - only show if data exists */}
          {expenseStats?.expensesByCategory && expenseStats.expensesByCategory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Expenses by Category</CardTitle>
                <CardDescription>Breakdown of expenses (last 6 months)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenseStats.expensesByCategory.map((cat: any) => {
                    const percentage = totalExpenses > 0 
                      ? (parseFloat(cat.total) / totalExpenses) * 100 
                      : 0;
                    return (
                      <div key={cat.categoryId}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.categoryColor || "hsl(var(--primary))" }}
                            />
                            <span className="text-sm">{cat.categoryName || "Uncategorized"}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(parseFloat(cat.total))}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
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
