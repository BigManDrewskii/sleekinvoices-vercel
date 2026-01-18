import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertTriangle,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "warning" | "reason" | "confirm";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("warning");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = trpc.user.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Your account has been deleted. Redirecting...");
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    },
    onError: error => {
      setIsDeleting(false);
      toast.error(
        error.message || "Failed to delete account. Please try again."
      );
    },
  });

  const handleClose = () => {
    setOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep("warning");
      setReason("");
      setConfirmText("");
      setIsDeleting(false);
    }, 200);
  };

  const handleNext = () => {
    if (step === "warning") {
      setStep("reason");
    } else if (step === "reason") {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "reason") {
      setStep("warning");
    } else if (step === "confirm") {
      setStep("reason");
    }
  };

  const handleDelete = () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      toast.error('Please type "DELETE MY ACCOUNT" exactly to confirm');
      return;
    }

    setIsDeleting(true);
    deleteAccount.mutate({
      confirmationText: confirmText,
      reason: reason || undefined,
    });
  };

  const isConfirmValid = confirmText === "DELETE MY ACCOUNT";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete My Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        {/* Step 1: Warning */}
        {step === "warning" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <AlertDialogTitle className="text-center text-xl">
                Delete Your Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center space-y-3">
                <p>
                  This action is{" "}
                  <strong className="text-foreground">
                    permanent and irreversible
                  </strong>
                  . Once deleted, your account and all associated data cannot be
                  recovered.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h4 className="font-medium text-sm mb-2 text-destructive">
                The following will be permanently deleted:
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive/70" />
                  All invoices and payment records
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive/70" />
                  All clients and their information
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive/70" />
                  All templates and settings
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive/70" />
                  All recurring invoices and estimates
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive/70" />
                  Your subscription and payment history
                </li>
              </ul>
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel onClick={handleClose}>
                Cancel
              </AlertDialogCancel>
              <Button variant="destructive" onClick={handleNext}>
                I Understand, Continue
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* Step 2: Reason (Optional) */}
        {step === "reason" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Help Us Improve</AlertDialogTitle>
              <AlertDialogDescription>
                We're sorry to see you go. Would you mind sharing why you're
                leaving? This helps us improve SleekInvoices for everyone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-3">
              <Label htmlFor="reason">Reason for leaving (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Tell us why you're deleting your account..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button variant="destructive" onClick={handleNext}>
                Continue to Final Step
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* Step 3: Final Confirmation */}
        {step === "confirm" && (
          <>
            <AlertDialogHeader>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-7 w-7 text-destructive" />
              </div>
              <AlertDialogTitle className="text-center text-xl">
                Final Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                To confirm deletion, please type{" "}
                <strong className="text-foreground font-mono">
                  DELETE MY ACCOUNT
                </strong>{" "}
                below.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 space-y-3">
              <Label htmlFor="confirmText">Type confirmation text</Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className={cn(
                  "font-mono text-center",
                  isConfirmValid &&
                    "border-destructive focus-visible:ring-destructive"
                )}
                disabled={isDeleting}
              />
              {confirmText.length > 0 && (
                <div
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    isConfirmValid
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {isConfirmValid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmation text matches
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Text doesn't match - type exactly: DELETE MY ACCOUNT
                    </>
                  )}
                </div>
              )}
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmValid || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Permanently Delete Account
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
