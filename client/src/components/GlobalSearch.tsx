import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, FileText, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";

export function GlobalSearch() {
  const [, setLocation] = useLocation();
  const { isSearchOpen, setSearchOpen } = useKeyboardShortcuts();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<{
    invoices: any[];
    clients: any[];
  }>({ invoices: [], clients: [] });

  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  // Sync local state with context (keyboard shortcut opens search)
  const open = isSearchOpen;
  const setOpen = setSearchOpen;

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

  const hasResults = results.invoices.length > 0 || results.clients.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative w-full md:w-64 justify-start text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline-flex">Search invoices, clients...</span>
          <span className="inline-flex sm:hidden">Search...</span>
          <kbd className="pointer-events-none absolute right-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-96 p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 opacity-50" />
            <Input
              placeholder="Search invoices, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 outline-none focus-visible:ring-0"
              autoFocus
            />
          </div>
          <CommandList>
            {!hasResults && searchQuery && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {results.invoices.length > 0 && (
              <CommandGroup heading="Invoices" className="overflow-hidden p-1.5 text-foreground">
                {results.invoices.map((invoice) => (
                  <CommandItem
                    key={invoice.id}
                    onSelect={() => handleSelectInvoice(invoice.id)}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{invoice.invoiceNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.clients.length > 0 && (
              <CommandGroup heading="Clients" className="overflow-hidden p-1.5 text-foreground">
                {results.clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    onSelect={() => handleSelectClient(client.id)}
                    className="cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 flex-col">
                      <span>{client.name}</span>
                      {client.email && (
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!searchQuery && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                <p>Start typing to search invoices and clients</p>
                <p className="text-xs mt-2">Press Esc to close</p>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
