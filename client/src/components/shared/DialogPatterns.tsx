import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, type LucideIcon } from "lucide-react";
import { ReactNode } from "react";

/**
 * Standard icon header for dialogs
 * Used in 10+ dialog components
 */
export function DialogIconHeader({
  icon: Icon,
  title,
  variant = "primary",
  size = "md",
}: {
  icon: LucideIcon;
  title: string;
  variant?: "primary" | "destructive" | "success" | "warning";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { container: "h-10 w-10", icon: "h-5 w-5" },
    md: { container: "h-14 w-14", icon: "h-7 w-7" },
    lg: { container: "h-16 w-16", icon: "h-8 w-8" },
  };

  const variants = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-green-500/10 text-green-500",
    warning: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex items-center justify-center rounded-lg",
          sizes[size].container,
          variants[variant]
        )}
      >
        <Icon className={sizes[size].icon} />
      </div>
      <span>{title}</span>
    </div>
  );
}

/**
 * Standard dialog body wrapper with consistent padding and spacing
 * Enforces design system standards
 */
export function DialogBody({
  children,
  spacing = "default",
  className,
}: {
  children: ReactNode;
  spacing?: "compact" | "default" | "relaxed";
  className?: string;
}) {
  const spacingClasses = {
    compact: "space-y-3",
    default: "space-y-4",
    relaxed: "space-y-6",
  };

  return (
    <div className={cn("px-6 py-4", spacingClasses[spacing], className)}>
      {children}
    </div>
  );
}

/**
 * Standard dialog footer with action buttons
 * Handles loading states and variants automatically
 */
export function DialogActions({
  onClose,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isLoading = false,
  submitVariant = "default" as const,
  disabled = false,
}: {
  onClose: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  submitVariant?: "default" | "destructive" | "outline" | "ghost";
  disabled?: boolean;
}) {
  return (
    <DialogFooter className="gap-3">
      <Button variant="ghost" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      {onSubmit && (
        <Button
          onClick={onSubmit}
          disabled={isLoading || disabled}
          variant={submitVariant}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {submitText}
        </Button>
      )}
    </DialogFooter>
  );
}

/**
 * Centered icon header for important dialogs (delete confirmations, etc.)
 * Centers the icon above the title
 */
export function DialogCenteredIconHeader({
  icon: Icon,
  variant = "primary",
  size = "md",
}: {
  icon: LucideIcon;
  variant?: "primary" | "destructive" | "success" | "warning";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { container: "h-10 w-10", icon: "h-5 w-5" },
    md: { container: "h-14 w-14", icon: "h-7 w-7" },
    lg: { container: "h-16 w-16", icon: "h-8 w-8" },
  };

  const variants = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-green-500/10 text-green-500",
    warning: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div
      className={cn(
        "mx-auto mb-4 flex items-center justify-center rounded-full",
        sizes[size].container,
        variants[variant]
      )}
    >
      <Icon className={sizes[size].icon} />
    </div>
  );
}
