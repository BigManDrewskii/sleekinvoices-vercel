import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { GearLoader } from "@/components/ui/gear-loader";

export default function QuickBooksCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleCallbackMutation = trpc.quickbooks.handleCallback.useMutation({
    onSuccess: () => { setStatus("success"); setTimeout(() => setLocation("/settings"), 2000); },
    onError: (error) => { setStatus("error"); setErrorMessage(error.message); },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const realmId = urlParams.get("realmId");
    const error = urlParams.get("error");
    const state = localStorage.getItem("qb_oauth_state");

    if (error) { setStatus("error"); setErrorMessage(error === "access_denied" ? "You denied access to QuickBooks" : `QuickBooks error: ${error}`); return; }
    if (!code || !realmId) { setStatus("error"); setErrorMessage("Missing authorization code or realm ID"); return; }
    if (!state) { setStatus("error"); setErrorMessage("Invalid session state. Please try connecting again."); return; }

    localStorage.removeItem("qb_oauth_state");
    handleCallbackMutation.mutate({ code, realmId, state });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{status === "loading" ? "Connecting to QuickBooks..." : status === "success" ? "Connected!" : "Connection Failed"}</CardTitle>
          <CardDescription>{status === "loading" ? "Please wait while we complete the connection" : status === "success" ? "Your QuickBooks account has been connected" : "There was a problem connecting your account"}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <div className="opacity-70">
              <GearLoader size="sm" />
            </div>
          )}
          {status === "success" && <><CheckCircle2 className="h-12 w-12 text-green-600" /><p className="text-sm text-muted-foreground">Redirecting to settings...</p></>}
          {status === "error" && <><XCircle className="h-12 w-12 text-destructive" /><p className="text-sm text-destructive text-center">{errorMessage}</p><Button onClick={() => setLocation("/settings")}>Back to Settings</Button></>}
        </CardContent>
      </Card>
    </div>
  );
}
