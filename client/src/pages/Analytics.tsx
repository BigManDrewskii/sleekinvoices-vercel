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
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Track your revenue and invoice performance</p>
            </div>
            <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
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

          {/* Aging Report */}
          <Card>
            <CardHeader>
              <CardTitle>Accounts Receivable Aging</CardTitle>
              <CardDescription>Outstanding invoices by days overdue</CardDescription>
            </CardHeader>
            <CardContent>
              {agingReport ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Current</div>
                      <div className="text-2xl font-bold">{agingReport.current.count}</div>
                      <div className="text-sm text-green-600">{formatCurrency(agingReport.current.amount)}</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">0-30 Days</div>
                      <div className="text-2xl font-bold">{agingReport.days_0_30.count}</div>
                      <div className="text-sm text-yellow-600">{formatCurrency(agingReport.days_0_30.amount)}</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">31-60 Days</div>
                      <div className="text-2xl font-bold">{agingReport.days_31_60.count}</div>
                      <div className="text-sm text-orange-600">{formatCurrency(agingReport.days_31_60.amount)}</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">61-90 Days</div>
                      <div className="text-2xl font-bold">{agingReport.days_61_90.count}</div>
                      <div className="text-sm text-red-600">{formatCurrency(agingReport.days_61_90.amount)}</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">90+ Days</div>
                      <div className="text-2xl font-bold">{agingReport.days_90_plus.count}</div>
                      <div className="text-sm text-red-800 font-semibold">{formatCurrency(agingReport.days_90_plus.amount)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  Loading aging report...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Profitability */}
          <Card>
            <CardHeader>
              <CardTitle>Client Profitability</CardTitle>
              <CardDescription>Revenue and profit by client</CardDescription>
            </CardHeader>
            <CardContent>
              {clientProfitability && clientProfitability.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Client</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Expenses</th>
                        <th className="text-right p-2">Profit</th>
                        <th className="text-right p-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientProfitability.slice(0, 10).map((client: any) => (
                        <tr key={client.clientId} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{client.clientName}</td>
                          <td className="text-right p-2">{formatCurrency(client.revenue)}</td>
                          <td className="text-right p-2">{formatCurrency(client.expenses)}</td>
                          <td className={`text-right p-2 font-semibold ${client.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(client.profit)}
                          </td>
                          <td className={`text-right p-2 ${client.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {client.margin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No client data available
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="expectedIncome" stroke="#22c55e" strokeWidth={2} name="Expected Income" />
                    <Line type="monotone" dataKey="expectedExpenses" stroke="#ef4444" strokeWidth={2} name="Expected Expenses" />
                    <Line type="monotone" dataKey="netCashFlow" stroke="#3b82f6" strokeWidth={2} name="Net Cash Flow" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading cash flow projection...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue vs Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Monthly profit & loss for {new Date().getFullYear()}</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueVsExpenses && revenueVsExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueVsExpenses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    <Bar dataKey="netProfit" fill="#3b82f6" name="Net Profit" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading revenue vs expenses...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
