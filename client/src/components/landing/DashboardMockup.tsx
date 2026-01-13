import { TrendingUp, Clock, FileText, Users, DollarSign, CheckCircle2 } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-background">
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
            sleekinvoices.com/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Dashboard</h3>
            <p className="text-xs text-muted-foreground">Welcome back!</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
            + New Invoice
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value="$12,450"
            trend="+12%"
            trendUp
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value="$3,200"
            count={5}
          />
          <StatCard
            icon={FileText}
            label="Invoices"
            value="47"
            sublabel="this month"
          />
          <StatCard
            icon={Users}
            label="Clients"
            value="23"
            sublabel="active"
          />
        </div>

        {/* Recent Invoices */}
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h4 className="text-sm font-semibold text-foreground">Recent Invoices</h4>
          </div>
          <div className="divide-y divide-border/50">
            <InvoiceRow
              id="INV-001"
              client="Acme Corp"
              amount="$2,500"
              status="paid"
            />
            <InvoiceRow
              id="INV-002"
              client="TechStart Inc"
              amount="$1,800"
              status="pending"
            />
            <InvoiceRow
              id="INV-003"
              client="Design Studio"
              amount="$950"
              status="sent"
            />
          </div>
        </div>
      </div>

      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  count,
  sublabel,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  count?: number;
  sublabel?: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-card/80 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? "text-green-500" : "text-red-500"}`}>
            {trendUp && <TrendingUp className="inline h-3 w-3 mr-0.5" />}
            {trend}
          </span>
        )}
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
        {sublabel && (
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

function InvoiceRow({
  id,
  client,
  amount,
  status,
}: {
  id: string;
  client: string;
  amount: string;
  status: "paid" | "pending" | "sent";
}) {
  const statusConfig = {
    paid: { label: "Paid", className: "bg-green-500/10 text-green-500" },
    pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500" },
    sent: { label: "Sent", className: "bg-blue-500/10 text-blue-500" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-muted/50">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{id}</p>
          <p className="text-xs text-muted-foreground">{client}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{amount}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
