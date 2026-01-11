import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Mail,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { AnimatedPercentage } from "@/components/ui/animated-number";

interface EmailAnalyticsWidgetProps {
  className?: string;
}

export function EmailAnalyticsWidget({ className }: EmailAnalyticsWidgetProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [days, setDays] = useState(30);

  const { data, isLoading } = trpc.emailHistory.analyticsOverTime.useQuery({
    period,
    days,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-[200px] bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { dataPoints = [], summary } = data || {};

  // Format date labels for chart
  const chartData = dataPoints.map((d) => ({
    ...d,
    label: period === "monthly" 
      ? new Date(d.period + "-01").toLocaleDateString("en-US", { month: "short" })
      : period === "weekly"
        ? new Date(d.period).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : new Date(d.period).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-blue-400">Open Rate:</span>{" "}
              <span className="font-semibold">{payload[0]?.value || 0}%</span>
            </p>
            <p className="text-sm">
              <span className="text-purple-400">Click Rate:</span>{" "}
              <span className="font-semibold">{payload[1]?.value || 0}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Trend indicator component
  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-green-500">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">+{value.toFixed(1)}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <TrendingDown className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{value.toFixed(1)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">0%</span>
      </div>
    );
  };

  const hasData = chartData.length > 0 && chartData.some(d => d.sent > 0);

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Mail className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Email Performance</h3>
              <p className="text-sm text-muted-foreground">Open & click rates over time</p>
            </div>
          </div>
          
          {/* Period selector */}
          <div className="flex bg-muted/50 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  period === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sent</span>
              </div>
              <p className="text-xl font-bold">{summary.totalSent}</p>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Open Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-blue-400">{summary.openRate}%</p>
                <TrendIndicator value={summary.openRateChange} />
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MousePointerClick className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Click Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-purple-400">{summary.clickRate}%</p>
                <TrendIndicator value={summary.clickRateChange} />
              </div>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Delivered</span>
              </div>
              <p className="text-xl font-bold text-green-400">{summary.totalDelivered}</p>
              <p className="text-xs text-muted-foreground">
                {summary.totalSent > 0 
                  ? `${Math.round((summary.totalDelivered / summary.totalSent) * 100)}% delivery rate`
                  : "No emails sent"}
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-[200px]">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="openRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clickRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  dy={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="openRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#openRateGradient)"
                  name="Open Rate"
                />
                <Area
                  type="monotone"
                  dataKey="clickRate"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#clickRateGradient)"
                  name="Click Rate"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Mail className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">No email data for this period</p>
              <p className="text-xs mt-1">Send invoices to see email performance</p>
            </div>
          )}
        </div>

        {/* Legend */}
        {hasData && (
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Open Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Click Rate</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
