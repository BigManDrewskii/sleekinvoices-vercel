import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { PortalAccessDialog } from "@/components/clients/PortalAccessDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users, Key, ShieldCheck, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { CSVImportDialog } from "@/components/clients/CSVImportDialog";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { ClientsTableSkeleton } from "@/components/skeletons";
import { useKeyboardShortcuts } from "@/contexts/KeyboardShortcutsContext";

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  companyName: string | null;
  notes: string | null;
  vatNumber: string | null;
  taxExempt: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Clients() {
  const { user, loading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [portalAccessDialogOpen, setPortalAccessDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Listen for keyboard shortcut to open new client dialog
  useEffect(() => {
    const handleOpenDialog = () => {
      setSelectedClient(null);
      setClientDialogOpen(true);
    };
    window.addEventListener('open-new-client-dialog', handleOpenDialog);
    return () => window.removeEventListener('open-new-client-dialog', handleOpenDialog);
  }, []);

  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const { pushUndoAction } = useKeyboardShortcuts();
  const pendingDeleteRef = useRef<{ timeoutId: NodeJS.Timeout; clientId: number } | null>(null);
  
  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      // Success is silent since the item is already removed from UI
    },
    onError: (error, variables) => {
      // Rollback: restore the deleted client to the cache
      utils.clients.list.invalidate();
      toast.error(error.message || "Failed to delete client. Item has been restored.");
    },
  });

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const query = searchQuery.toLowerCase();
    return clients.filter((client) => 
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.companyName?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Calculate pagination
  const totalItems = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Get paginated clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClients.slice(startIndex, startIndex + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleUndoableDelete = (client: Client) => {
    // Cancel any existing pending delete
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
      pendingDeleteRef.current = null;
    }

    // Snapshot the previous value for potential restore
    const previousClients = utils.clients.list.getData();
    
    // Optimistically remove from UI immediately
    utils.clients.list.setData(undefined, (old) => 
      old?.filter((c) => c.id !== client.id)
    );
    
    // Close dialog
    setDeleteDialogOpen(false);
    setClientToDelete(null);

    // Create undo function
    const undoDelete = () => {
      // Cancel the pending delete
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timeoutId);
        pendingDeleteRef.current = null;
      }
      
      // Restore the client to UI
      if (previousClients) {
        utils.clients.list.setData(undefined, previousClients);
      } else {
        utils.clients.list.invalidate();
      }
    };

    // Register with keyboard shortcuts context for Cmd+Z
    pushUndoAction({
      type: 'delete',
      entityType: 'client',
      description: `Delete client "${client.name}"`,
      undo: undoDelete,
    });

    // Show undo toast
    toast(
      `Client "${client.name}" deleted`,
      {
        description: 'Click undo to restore or press ⌘Z',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            undoDelete();
            toast.success('Client restored');
          },
        },
      }
    );

    // Set timeout to permanently delete after 5 seconds
    const timeoutId = setTimeout(async () => {
      pendingDeleteRef.current = null;
      
      try {
        await deleteClient.mutateAsync({ id: client.id });
      } catch (error) {
        // Error handling is done in mutation onError
        // Restore the client on error
        if (previousClients) {
          utils.clients.list.setData(undefined, previousClients);
        } else {
          utils.clients.list.invalidate();
        }
      }
    }, 5000);

    pendingDeleteRef.current = { timeoutId, clientId: client.id };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70"><GearLoader size="md" /></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setClientDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setClientDialogOpen(true);
  };
  
  const handlePortalAccess = (client: Client) => {
    setSelectedClient(client);
    setPortalAccessDialogOpen(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      handleUndoableDelete(clientToDelete);
    }
  };

  return (
    <div className="page-wrapper">
      <Navigation />

      {/* Main Content */}
      <div className="page-content page-transition">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-header-title">Clients</h1>
              <p className="page-header-subtitle">Manage your client database</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="flex-1 sm:flex-initial touch-target">
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button onClick={handleAddNew} className="flex-1 sm:flex-initial touch-target">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Client</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, phone, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Table */}
        <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm overflow-hidden">
          <div className="p-5 pb-4">
            <h3 className="text-lg font-semibold text-foreground">All Clients</h3>
            <p className="text-sm text-muted-foreground">
              {totalItems} client{totalItems !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="px-5 pb-5">
            {clientsLoading ? (
              <ClientsTableSkeleton rows={8} />
            ) : !clients || clients.length === 0 ? (
              <EmptyState
                icon={Users}
                {...EmptyStatePresets.clients}
                action={{
                  label: "Add Client",
                  onClick: handleAddNew,
                  icon: Plus,
                }}
              />
            ) : filteredClients.length === 0 ? (
              <EmptyState
                icon={Search}
                {...EmptyStatePresets.search}
                size="sm"
              />
            ) : (
              <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>VAT</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            {!client.email && !client.phone && (
                              <span className="text-sm text-muted-foreground">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.companyName || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.vatNumber ? (
                              <span className="text-sm font-mono">{client.vatNumber}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {client.taxExempt && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                                <ShieldCheck className="h-3 w-3" />
                                Tax Exempt
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.address ? (
                            <div className="flex items-start gap-2 text-sm max-w-xs">
                              <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{client.address}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePortalAccess(client)}
                              title="Portal Access"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(client)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedClients.map((client) => (
                  <div key={client.id} className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3 hover:border-border transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{client.name}</p>
                        {client.companyName && (
                          <p className="text-sm text-muted-foreground">{client.companyName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{client.address}</span>
                        </div>
                      )}
                      {client.vatNumber && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">VAT:</span>
                          <span className="font-mono">{client.vatNumber}</span>
                        </div>
                      )}
                      {client.taxExempt && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1 w-fit">
                          <ShieldCheck className="h-3 w-3" />
                          Tax Exempt
                        </Badge>
                      )}
                      {!client.email && !client.phone && !client.address && (
                        <p className="text-muted-foreground">No contact information</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => handlePortalAccess(client)}
                        className="flex-1 h-11"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Portal
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => handleEdit(client)}
                        className="flex-1 h-11"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => handleDelete(client)}
                        className="text-red-600 hover:text-red-700 h-11 px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalItems > 10 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        client={selectedClient}
        onSuccess={() => setSelectedClient(null)}
      />

      <PortalAccessDialog
        open={portalAccessDialogOpen}
        onOpenChange={setPortalAccessDialogOpen}
        client={selectedClient || { id: 0, name: "", email: null }}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Client"
        description={`Are you sure you want to delete ${clientToDelete?.name}? This action cannot be undone.`}
        isLoading={deleteClient.isPending}
      />

      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => utils.clients.list.invalidate()}
      />
    </div>
  );
}
