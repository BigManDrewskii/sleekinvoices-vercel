import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  RefreshCw, Link2, Unlink, Cloud, CheckCircle2, AlertCircle, 
  History, Building2, Settings2, Download, DollarSign 
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function QuickBooksSettings() {
  const [showHistory, setShowHistory] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);

  // Sync settings state
  const [autoSyncInvoices, setAutoSyncInvoices] = useState(true);
  const [autoSyncPayments, setAutoSyncPayments] = useState(true);
  const [syncPaymentsFromQB, setSyncPaymentsFromQB] = useState(true);
  const [minInvoiceAmount, setMinInvoiceAmount] = useState("");
  const [syncDraftInvoices, setSyncDraftInvoices] = useState(false);

  const { data: status, isLoading, refetch } = trpc.quickbooks.getStatus.useQuery();
  const { data: authData } = trpc.quickbooks.getAuthUrl.useQuery(undefined, { enabled: status?.configured && !status?.connected });
  const { data: syncHistory } = trpc.quickbooks.getSyncHistory.useQuery({ limit: 50 }, { enabled: showHistory && status?.connected });
  const { data: syncSettings, refetch: refetchSettings } = trpc.quickbooks.getSyncSettings.useQuery(undefined, { enabled: status?.connected });

  // Update local state when settings are loaded
  useEffect(() => {
    if (syncSettings) {
      setAutoSyncInvoices(syncSettings.autoSyncInvoices);
      setAutoSyncPayments(syncSettings.autoSyncPayments);
      setSyncPaymentsFromQB(syncSettings.syncPaymentsFromQB);
      setMinInvoiceAmount(syncSettings.minInvoiceAmount || "");
      setSyncDraftInvoices(syncSettings.syncDraftInvoices);
    }
  }, [syncSettings]);

  const disconnectMutation = trpc.quickbooks.disconnect.useMutation({
    onSuccess: () => { toast.success("Disconnected from QuickBooks"); refetch(); setShowDisconnectDialog(false); },
    onError: (error) => toast.error(error.message),
  });

  const syncAllClientsMutation = trpc.quickbooks.syncAllClients.useMutation({
    onSuccess: (data) => toast.success(`Synced ${data.synced} clients${data.failed > 0 ? `, ${data.failed} failed` : ""}`),
    onError: (error) => toast.error(error.message),
  });

  const syncAllInvoicesMutation = trpc.quickbooks.syncAllInvoices.useMutation({
    onSuccess: (data) => toast.success(`Synced ${data.synced} invoices${data.failed > 0 ? `, ${data.failed} failed` : ""}`),
    onError: (error) => toast.error(error.message),
  });

  const pollPaymentsMutation = trpc.quickbooks.pollPayments.useMutation({
    onSuccess: (data) => {
      if (data.synced > 0) {
        toast.success(`Imported ${data.synced} payments from QuickBooks`);
      } else {
        toast.info("No new payments found in QuickBooks");
      }
      if (data.errors.length > 0) {
        console.error("Payment sync errors:", data.errors);
      }
    },
    onError: (error) => toast.error(error.message),
  });

  const updateSettingsMutation = trpc.quickbooks.updateSyncSettings.useMutation({
    onSuccess: () => {
      toast.success("Sync settings updated");
      refetchSettings();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleConnect = () => {
    if (authData?.url) {
      localStorage.setItem("qb_oauth_state", authData.state);
      window.location.href = authData.url;
    }
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      autoSyncInvoices,
      autoSyncPayments,
      syncPaymentsFromQB,
      minInvoiceAmount: minInvoiceAmount || null,
      syncDraftInvoices,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5" />QuickBooks Integration</CardTitle></CardHeader>
        <CardContent><div className="animate-pulse h-20 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (!status?.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5" />QuickBooks Integration</CardTitle>
          <CardDescription>Connect your QuickBooks account to sync invoices and customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">QuickBooks integration requires configuration. Please contact support to enable this feature.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5" />QuickBooks Integration</CardTitle>
              <CardDescription>Sync your invoices and customers with QuickBooks Online</CardDescription>
            </div>
            {status.connected && <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.connected ? (
            <>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div><p className="text-sm text-muted-foreground">Company</p><p className="font-medium flex items-center gap-1"><Building2 className="h-4 w-4" />{status.companyName || "Unknown"}</p></div>
                <div><p className="text-sm text-muted-foreground">Environment</p><Badge variant="secondary">{status.environment}</Badge></div>
                <div><p className="text-sm text-muted-foreground">Realm ID</p><p className="font-mono text-sm">{status.realmId}</p></div>
                <div><p className="text-sm text-muted-foreground">Last Sync</p><p className="text-sm">{status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : "Never"}</p></div>
              </div>

              {/* Sync Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => syncAllClientsMutation.mutate()} disabled={syncAllClientsMutation.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncAllClientsMutation.isPending ? "animate-spin" : ""}`} />Sync All Clients
                </Button>
                <Button variant="outline" size="sm" onClick={() => syncAllInvoicesMutation.mutate()} disabled={syncAllInvoicesMutation.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncAllInvoicesMutation.isPending ? "animate-spin" : ""}`} />Sync All Invoices
                </Button>
                <Button variant="outline" size="sm" onClick={() => pollPaymentsMutation.mutate()} disabled={pollPaymentsMutation.isPending}>
                  <Download className={`h-4 w-4 mr-2 ${pollPaymentsMutation.isPending ? "animate-spin" : ""}`} />Pull Payments
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                  <History className="h-4 w-4 mr-2" />View History
                </Button>
              </div>

              <Separator />

              {/* Sync Settings */}
              <Collapsible open={showSyncSettings} onOpenChange={setShowSyncSettings}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Sync Settings
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {showSyncSettings ? "Hide" : "Show"}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    {/* Auto-sync Invoices */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-sync-invoices">Auto-sync Invoices</Label>
                        <p className="text-xs text-muted-foreground">Automatically sync invoices when sent</p>
                      </div>
                      <Switch
                        id="auto-sync-invoices"
                        checked={autoSyncInvoices}
                        onCheckedChange={setAutoSyncInvoices}
                      />
                    </div>

                    {/* Auto-sync Payments */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-sync-payments">Auto-sync Payments</Label>
                        <p className="text-xs text-muted-foreground">Sync payments to QuickBooks when recorded</p>
                      </div>
                      <Switch
                        id="auto-sync-payments"
                        checked={autoSyncPayments}
                        onCheckedChange={setAutoSyncPayments}
                      />
                    </div>

                    {/* Two-way Payment Sync */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-from-qb">Two-way Payment Sync</Label>
                        <p className="text-xs text-muted-foreground">Import payments recorded in QuickBooks</p>
                      </div>
                      <Switch
                        id="sync-from-qb"
                        checked={syncPaymentsFromQB}
                        onCheckedChange={setSyncPaymentsFromQB}
                      />
                    </div>

                    {/* Minimum Invoice Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="min-amount">Minimum Invoice Amount</Label>
                      <p className="text-xs text-muted-foreground">Only sync invoices above this amount (leave empty to sync all)</p>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="min-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={minInvoiceAmount}
                          onChange={(e) => setMinInvoiceAmount(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Sync Draft Invoices */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sync-drafts">Sync Draft Invoices</Label>
                        <p className="text-xs text-muted-foreground">Include draft invoices in sync (not recommended)</p>
                      </div>
                      <Switch
                        id="sync-drafts"
                        checked={syncDraftInvoices}
                        onCheckedChange={setSyncDraftInvoices}
                      />
                    </div>

                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={updateSettingsMutation.isPending}
                      className="w-full"
                    >
                      {updateSettingsMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Save Settings
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Disconnect */}
              <Button variant="destructive" size="sm" onClick={() => setShowDisconnectDialog(true)}>
                <Unlink className="h-4 w-4 mr-2" />Disconnect QuickBooks
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Connect to QuickBooks</h3>
              <p className="text-sm text-muted-foreground mb-4">Automatically sync your invoices and customers with QuickBooks Online</p>
              <Button onClick={handleConnect} disabled={!authData?.url}><Link2 className="h-4 w-4 mr-2" />Connect QuickBooks</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Disconnect QuickBooks?</DialogTitle><DialogDescription>This will stop syncing data with QuickBooks. Your existing data in QuickBooks will not be affected.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>Disconnect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Sync History</DialogTitle><DialogDescription>Recent synchronization activity with QuickBooks</DialogDescription></DialogHeader>
          <ScrollArea className="h-[400px]">
            {syncHistory && syncHistory.length > 0 ? (
              <div className="space-y-2">
                {syncHistory.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                      <div>
                        <p className="font-medium capitalize">{log.action} {log.entityType}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.syncedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant={log.status === "success" ? "outline" : "destructive"}>{log.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No sync history yet</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
