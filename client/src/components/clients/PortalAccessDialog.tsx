import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Copy, ExternalLink, Key, Loader2, Mail, RefreshCw, Shield, ShieldOff } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PortalAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    id: number;
    name: string;
    email: string | null;
  };
}

export function PortalAccessDialog({ open, onOpenChange, client }: PortalAccessDialogProps) {
  const [copied, setCopied] = useState(false);
  
  const { data: activeAccess, isLoading, refetch } = trpc.clientPortal.getActiveAccess.useQuery(
    { clientId: client.id },
    { enabled: open }
  );
  
  const utils = trpc.useUtils();
  
  const generateAccess = trpc.clientPortal.generateAccessToken.useMutation({
    onSuccess: (data) => {
      toast.success("Portal access link generated!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate access link");
    },
  });
  
  const revokeAccess = trpc.clientPortal.revokeAccess.useMutation({
    onSuccess: () => {
      toast.success("Portal access revoked");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke access");
    },
  });
  
  const sendInvitation = trpc.clientPortal.sendInvitation.useMutation({
    onSuccess: () => {
      toast.success(`Portal invitation sent to ${client.email}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });
  
  const handleGenerate = () => {
    generateAccess.mutate({ clientId: client.id });
  };
  
  const handleRevoke = () => {
    if (activeAccess?.accessToken) {
      revokeAccess.mutate({ accessToken: activeAccess.accessToken });
    }
  };
  
  const handleCopy = () => {
    if (activeAccess) {
      const portalUrl = `${window.location.origin}/portal/${activeAccess.accessToken}`;
      navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleOpenPortal = () => {
    if (activeAccess) {
      window.open(`/portal/${activeAccess.accessToken}`, "_blank");
    }
  };
  
  const portalUrl = activeAccess ? `${window.location.origin}/portal/${activeAccess.accessToken}` : "";
  const isExpired = activeAccess ? new Date() > new Date(activeAccess.expiresAt) : false;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Client Portal Access
          </DialogTitle>
          <DialogDescription>
            Manage secure portal access for {client.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeAccess && !isExpired ? (
            <>
              {/* Active Access Info */}
              <div className="rounded-lg border bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Shield className="h-4 w-4" />
                  Active Portal Access
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{formatDate(activeAccess.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{formatDate(activeAccess.expiresAt)}</span>
                  </div>
                  {activeAccess.lastAccessedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Accessed:</span>
                      <span className="font-medium">{formatDate(activeAccess.lastAccessedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Portal Link */}
              <div className="space-y-2">
                <Label htmlFor="portal-url">Portal Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="portal-url"
                    value={portalUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    title="Copy to clipboard"
                  >
                    <Copy className={`h-4 w-4 ${copied ? "text-green-600" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleOpenPortal}
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with your client to give them access to view and pay their invoices
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => sendInvitation.mutate({ clientId: client.id, accessToken: activeAccess.accessToken })}
                  disabled={sendInvitation.isPending || !client.email}
                  className="flex-1"
                >
                  {sendInvitation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Invite
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRevoke}
                  disabled={revokeAccess.isPending}
                  className="flex-1"
                >
                  {revokeAccess.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldOff className="h-4 w-4 mr-2" />
                  )}
                  Revoke Access
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              {!client.email && (
                <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
                  ⚠️ Client email is required to send invitations. Please add an email address to this client.
                </p>
              )}
            </>
          ) : (
            <>
              {/* No Active Access */}
              <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Key className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">No Active Portal Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate a secure link for {client.name} to access their invoices
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generateAccess.isPending}
                  className="mt-2"
                >
                  {generateAccess.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Generate Portal Link
                </Button>
              </div>
              
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  About Client Portal Access
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Clients can view all their invoices</li>
                  <li>• Secure payment links included for unpaid invoices</li>
                  <li>• Access tokens expire after 90 days</li>
                  <li>• You can revoke access anytime</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
