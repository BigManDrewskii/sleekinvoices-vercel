import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * GlobalShortcuts component handles navigation shortcuts
 * that require routing (Cmd+N for new invoice, etc.)
 *
 * This is separate from KeyboardShortcutsContext because
 * it needs access to wouter's useLocation hook.
 */
export function GlobalShortcuts() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts for authenticated users
      if (!isAuthenticated) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      // Cmd/Ctrl + N - New Invoice
      if (modifier && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        setLocation("/invoices/create");
        return;
      }

      // Cmd/Ctrl + Shift + N - New Client
      if (modifier && e.key === "N" && e.shiftKey) {
        e.preventDefault();
        // Navigate to clients page - the dialog will need to be opened separately
        // For now, just navigate to clients page
        setLocation("/clients");
        // Dispatch custom event to open client dialog
        window.dispatchEvent(new CustomEvent("open-new-client-dialog"));
        return;
      }

      // Cmd/Ctrl + Shift + E - New Expense
      if (modifier && e.key === "E" && e.shiftKey) {
        e.preventDefault();
        setLocation("/expenses");
        // Dispatch custom event to open expense dialog
        window.dispatchEvent(new CustomEvent("open-new-expense-dialog"));
        return;
      }

      // G then D - Go to Dashboard
      // G then I - Go to Invoices
      // G then C - Go to Clients
      // These are handled via a "g" prefix mode
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, setLocation]);

  return null;
}
