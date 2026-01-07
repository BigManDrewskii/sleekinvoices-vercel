import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Users,
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Navigation } from "@/components/Navigation";
import { AnalyticsPageSkeleton } from "@/components/skeletons";

// Status colors matching the design system
const STATUS_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
  draft: { bg: "bg-slate-500/10", text: "text-slate-400", fill: "#64748b" },
  sent: { bg: "bg-blue-500/10", text: "text-blue-400", fill: "#6695ff" },
  paid: { bg: "bg-green-500/10", text: "text-green-400", fill: "#22c55e" },
  overdue: { bg: "bg-red-500/10", text: "text-red-400", fill: "#ef4444" },
  canceled: { bg: "bg-slate-500/10", text: "text-slate-500", fill: "#475569" },
};

// Chart colors from tweakcn design system
const CHART_COLORS = {
  primary: "#6695ff",
  secondary: "#5f6fff",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  muted: "#64748b",
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
  
  const { data: topClients } = trpc.analytics.getTopClients.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  // Export analytics data to CSV
  const exportAnalyticsCSV = () => {
    if (!analytics) return;

    const timeRangeLabels = {
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "90d": "Last 3 months",
      "1y": "Last year",
    };

    // Build CSV content
    const rows: string[][] = [];
    
    // Header
    rows.push(["SleekInvoices Analytics Report"]);
    rows.push([`Period: ${timeRangeLabels[timeRange]}`]);
    rows.push([`Generated: ${new Date().toLocaleDateString()}`]);
    rows.push([]);
    
    // Summary metrics
    rows.push(["Summary Metrics"]);
    rows.push(["Metric", "Value"]);
    rows.push(["Total Revenue", `$${parseFloat(analytics.totalRevenue?.toString() || "0").toFixed(2)}`]);
    rows.push(["Outstanding Amount", `$${parseFloat(analytics.outstandingAmount?.toString() || "0").toFixed(2)}`]);
    rows.push(["Total Invoices", analytics.totalInvoices?.toString() || "0"]);
    rows.push(["Paid Invoices", analytics.paidInvoices?.toString() || "0"]);
    rows.push(["Collection Rate", `${analytics.collectionRate?.toFixed(1) || "0"}%`]);
    rows.push(["Days Sales Outstanding (DSO)", `${analytics.dso?.toFixed(1) || "0"} days`]);
    rows.push(["Average Invoice Value", `$${parseFloat(analytics.averageInvoiceValue?.toString() || "0").toFixed(2)}`]);
    rows.push([]);
    
    // Status breakdown
    rows.push(["Invoice Status Breakdown"]);
    rows.push(["Status", "Count", "Amount"]);
    analytics.statusBreakdown?.forEach((item: any) => {
      rows.push([
        item.status.charAt(0).toUpperCase() + item.status.slice(1),
        item.count.toString(),
        `$${parseFloat(item.totalAmount).toFixed(2)}`
      ]);
    });
    rows.push([]);
    
    // Monthly revenue
    if (analytics.monthlyRevenue?.length > 0) {
      rows.push(["Monthly Revenue"]);
      rows.push(["Date", "Revenue"]);
      analytics.monthlyRevenue.forEach((item: any) => {
        rows.push([
          new Date(item.month).toLocaleDateString(),
          `$${parseFloat(item.revenue).toFixed(2)}`
        ]);
      });
      rows.push([]);
    }
    
    // Top clients
    if (topClients && topClients.length > 0) {
      rows.push(["Top Clients"]);
      rows.push(["Client", "Total Invoiced", "Invoice Count"]);
      topClients.forEach((client: any) => {
        rows.push([
          client.name,
          `$${parseFloat(client.totalInvoiced).toFixed(2)}`,
          client.invoiceCount.toString()
        ]);
      });
    }
    
    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sleek-invoices-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading || isLoading) {
    return <AnalyticsPageSkeleton />;
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
    dso = 0,
    collectionRate = 0,
    averageInvoiceValue = 0,
  } = analytics || {};

  // Calculate net profit
  const totalExpenses = parseFloat(expenseStats?.totalExpenses?.toString() || "0");
  const netProfit = parseFloat(totalRevenue?.toString() || "0") - totalExpenses;
  const revenueNum = parseFloat(totalRevenue?.toString() || "0");
  const outstandingNum = parseFloat(outstandingAmount?.toString() || "0");
  const avgInvoiceNum = parseFloat(averageInvoiceValue?.toString() || "0");

  // Format monthly revenue data for chart
  const revenueChartData = monthlyRevenue.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: parseFloat(item.revenue),
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

  // Calculate max for top clients bar chart
  const maxClientRevenue = topClients?.length 
    ? Math.max(...topClients.map((c: any) => c.totalInvoiced)) 
    : 0;

  // Custom tooltip for revenue chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
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
              <p className="text-sm text-muted-foreground mt-1">
                Financial overview and invoice performance
              </p>
            </div>
            <div className="flex items-center gap-3">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAnalyticsCSV()}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Key Metrics - 4 primary stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Revenue</span>
                  </div>
                  {revenueChangePercent !== 0 && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                      revenueChangePercent >= 0 
                        ? "bg-green-500/10 text-green-500" 
                        : "bg-red-500/10 text-red-500"
                    }`}>
                      {revenueChangePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(revenueChangePercent)}%
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight">{formatCurrency(revenueNum)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeRangeLabels[timeRange]}
                </p>
              </CardContent>
            </Card>

            {/* Outstanding */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-yellow-500/10">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                  </div>
                  {outstandingNum > 0 && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight">{formatCurrency(outstandingNum)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalInvoices - paidInvoices} unpaid invoice{totalInvoices - paidInvoices !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* DSO (Days Sales Outstanding) */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-500/10">
                      <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Avg. Days to Pay</span>
                  </div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    dso <= 30 ? "bg-green-500/10 text-green-500" : 
                    dso <= 45 ? "bg-yellow-500/10 text-yellow-500" : 
                    "bg-red-500/10 text-red-500"
                  }`}>
                    {dso <= 30 ? "Good" : dso <= 45 ? "Fair" : "Slow"}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{dso} <span className="text-base font-normal text-muted-foreground">days</span></p>
                <p className="text-xs text-muted-foreground mt-1">
                  Industry avg: 30-45 days
                </p>
              </CardContent>
            </Card>

            {/* Collection Rate */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Collection Rate</span>
                  </div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    collectionRate >= 80 ? "bg-green-500/10 text-green-500" : 
                    collectionRate >= 60 ? "bg-yellow-500/10 text-yellow-500" : 
                    "bg-red-500/10 text-red-500"
                  }`}>
                    {collectionRate >= 80 ? "Excellent" : collectionRate >= 60 ? "Good" : "Needs Work"}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{collectionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {paidInvoices} of {totalInvoices} invoices paid
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Invoices */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                    <p className="text-xl font-bold">{totalInvoices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Invoice Value */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Invoice Value</p>
                    <p className="text-xl font-bold">{formatCurrency(avgInvoiceNum)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card className="border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${netProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {netProfit >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-xl font-bold ${netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart - Full width */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">Revenue Trend</CardTitle>
                  <CardDescription className="text-sm">
                    {timeRangeLabels[timeRange]}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(revenueNum)}</p>
                  {revenueChangePercent !== 0 && (
                    <p className={`text-xs flex items-center justify-end gap-1 ${
                      revenueChangePercent >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {revenueChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {revenueChangePercent >= 0 ? "+" : ""}{revenueChangePercent}% vs prev period
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
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
                      tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={false}
                      activeDot={{ r: 5, fill: CHART_COLORS.primary, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                  No revenue data for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two column: Invoice Status + Top Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Status */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Invoice Status</CardTitle>
                <CardDescription className="text-sm">Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <div className="space-y-4">
                    {statusChartData.map((entry: any) => {
                      const config = STATUS_COLORS[entry.status] || STATUS_COLORS.draft;
                      const percentage = totalStatusCount > 0 ? (entry.value / totalStatusCount) * 100 : 0;
                      
                      return (
                        <div key={entry.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: config.fill }}
                              />
                              <span className="text-sm font-medium">{entry.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm tabular-nums">{entry.value}</span>
                              <span className="text-sm text-muted-foreground w-20 text-right tabular-nums">
                                {formatCurrency(entry.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
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
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                    No invoices yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Clients */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Top Clients</CardTitle>
                    <CardDescription className="text-sm">By total invoiced amount</CardDescription>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {topClients && topClients.length > 0 ? (
                  <div className="space-y-4">
                    {topClients.map((client: any, index: number) => {
                      const percentage = maxClientRevenue > 0 ? (client.totalInvoiced / maxClientRevenue) * 100 : 0;
                      
                      return (
                        <div key={client.clientId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                              <span className="text-sm font-medium truncate max-w-[140px]">{client.clientName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{client.invoiceCount} inv</span>
                              <span className="text-sm font-medium tabular-nums">
                                {formatCurrency(client.totalInvoiced)}
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: CHART_COLORS.primary
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                    No client data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Accounts Receivable Aging */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">Receivables Aging</CardTitle>
                  <CardDescription className="text-sm">Outstanding invoices by days overdue</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {agingReport ? (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {[
                    { label: "Current", data: agingReport.current, color: CHART_COLORS.success, desc: "Not due" },
                    { label: "1-30 Days", data: agingReport.days_0_30, color: CHART_COLORS.warning, desc: "Slightly overdue" },
                    { label: "31-60 Days", data: agingReport.days_31_60, color: "#f97316", desc: "Overdue" },
                    { label: "61-90 Days", data: agingReport.days_61_90, color: CHART_COLORS.danger, desc: "Very overdue" },
                    { label: "90+ Days", data: agingReport.days_90_plus, color: "#dc2626", desc: "Critical" },
                  ].map((item) => {
                    const totalAging = 
                      agingReport.current.amount + 
                      agingReport.days_0_30.amount + 
                      agingReport.days_31_60.amount + 
                      agingReport.days_61_90.amount + 
                      agingReport.days_90_plus.amount;
                    const percentage = totalAging > 0 ? (item.data.amount / totalAging) * 100 : 0;
                    
                    return (
                      <div key={item.label} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(item.data.amount)}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{item.data.count} invoice{item.data.count !== 1 ? 's' : ''}</span>
                          <span>{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
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
                <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                  Loading aging report...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses by Category - only show if data exists */}
          {expenseStats?.expensesByCategory && expenseStats.expensesByCategory.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Expenses by Category</CardTitle>
                <CardDescription className="text-sm">Last 6 months breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expenseStats.expensesByCategory.slice(0, 6).map((cat: any) => {
                    const percentage = totalExpenses > 0 
                      ? (parseFloat(cat.total) / totalExpenses) * 100 
                      : 0;
                    return (
                      <div key={cat.categoryId} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.categoryColor || CHART_COLORS.muted }}
                          />
                          <span className="text-sm font-medium truncate">{cat.categoryName || "Uncategorized"}</span>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(parseFloat(cat.total))}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(1)}% of total</span>
                        </div>
                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: cat.categoryColor || CHART_COLORS.muted
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
