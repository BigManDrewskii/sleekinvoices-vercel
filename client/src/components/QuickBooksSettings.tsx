import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RefreshCw, Link2, Unlink, Cloud, CheckCircle2, AlertCircle, History, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function QuickBooksSettings() {
  const [showHistory, setShowHistory] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const { data: status, isLoading, refetch } = trpc.quickbooks.getStatus.useQuery();
  const { data: authData } = trpc.quickbooks.getAuthUrl.useQuery(undefined, { enabled: status?.configured && !status?.connected });
  const { data: syncHistory } = trpc.quickbooks.getSyncHistory.useQuery({ limit: 50 }, { enabled: showHistory && status?.connected });

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

  const handleConnect = () => {
    if (authData?.url) {
      localStorage.setItem("qb_oauth_state", authData.state);
      window.location.href = authData.url;
    }
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
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => syncAllClientsMutation.mutate()} disabled={syncAllClientsMutation.isPending}><RefreshCw className={`h-4 w-4 mr-2 ${syncAllClientsMutation.isPending ? "animate-spin" : ""}`} />Sync All Clients</Button>
                <Button variant="outline" size="sm" onClick={() => syncAllInvoicesMutation.mutate()} disabled={syncAllInvoicesMutation.isPending}><RefreshCw className={`h-4 w-4 mr-2 ${syncAllInvoicesMutation.isPending ? "animate-spin" : ""}`} />Sync All Invoices</Button>
                <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}><History className="h-4 w-4 mr-2" />View History</Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDisconnectDialog(true)}><Unlink className="h-4 w-4 mr-2" />Disconnect</Button>
              </div>
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
