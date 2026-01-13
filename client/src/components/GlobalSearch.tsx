import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, FileText, Users, X, ArrowRight } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";

export function GlobalSearch() {
  const [, setLocation] = useLocation();
  const { isSearchOpen, setSearchOpen } = useKeyboardShortcuts();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<{
    invoices: any[];
    clients: any[];
  }>({ invoices: [], clients: [] });

  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      // Small delay to ensure the modal is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("");
      setResults({ invoices: [], clients: [] });
    }
  }, [isSearchOpen]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ invoices: [], clients: [] });
      return;
    }

    const query = searchQuery.toLowerCase();

    const filteredInvoices = (invoices || [])
      .filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.client.name.toLowerCase().includes(query) ||
          inv.total.toString().includes(query)
      )
      .slice(0, 5);

    const filteredClients = (clients || [])
      .filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          (client.email && client.email.toLowerCase().includes(query)) ||
          (client.companyName && client.companyName.toLowerCase().includes(query))
      )
      .slice(0, 5);

    setResults({
      invoices: filteredInvoices,
      clients: filteredClients,
    });
  }, [searchQuery, invoices, clients]);

  const handleSelectInvoice = (invoiceId: number) => {
    setLocation(`/invoices/${invoiceId}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSelectClient = (clientId: number) => {
    setLocation(`/clients/${clientId}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleClose = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const hasResults = results.invoices.length > 0 || results.clients.length > 0;

  if (!isSearchOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Search Modal */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4 sm:px-6 md:px-8">
        <div
          className={cn(
            "w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden",
            "animate-in fade-in-0 slide-in-from-top-4 duration-200"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <Command className="bg-transparent">
            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-border/50">
              <Search className="h-4.5 w-4.5 text-muted-foreground/70 shrink-0" />
              <Input
                ref={inputRef}
                aria-label="Search invoices and clients"
                placeholder="Search invoices, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent px-2 py-1 text-[15px] placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
              />
              <button
                onClick={handleClose}
                className="shrink-0 p-2 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-accent/80 transition-colors"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results */}
            <CommandList className="max-h-[60vh] overflow-y-auto">
              {!hasResults && searchQuery && (
                <CommandEmpty className="px-4 sm:px-6 md:px-8 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                    <p className="text-xs text-muted-foreground/70">Try a different search term</p>
                  </div>
                </CommandEmpty>
              )}

              {results.invoices.length > 0 && (
                <CommandGroup heading="Invoices" className="p-3 sm:p-4">
                  {results.invoices.map((invoice) => (
                    <CommandItem
                      key={invoice.id}
                      onSelect={() => handleSelectInvoice(invoice.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{invoice.invoiceNumber}</span>
                          <span className="text-sm font-medium text-primary">
                            {formatCurrency(invoice.total)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {invoice.client.name}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity shrink-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.clients.length > 0 && (
                <CommandGroup heading="Clients" className="p-3 sm:p-4">
                  {results.clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      onSelect={() => handleSelectClient(client.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-500 shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{client.name}</span>
                        {client.email && (
                          <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity shrink-0" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Empty state when no search query */}
              {!searchQuery && (
                <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-10 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Search for invoices and clients</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Type to start searching</p>
                    </div>
                  </div>
                </div>
              )}
            </CommandList>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 py-2.5 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">↵</kbd>
                  <span>Select</span>
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
          </Command>
        </div>
      </div>
    </>
  );
}
