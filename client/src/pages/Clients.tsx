import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { PortalAccessDialog } from "@/components/clients/PortalAccessDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Pagination } from "@/components/shared/Pagination";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users, Key, ShieldCheck, Upload, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

type SortField = 'name' | 'email' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function Clients() {
  const { user, loading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [portalAccessDialogOpen, setPortalAccessDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Selection state for bulk delete
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  
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

  const bulkDeleteClients = trpc.clients.bulkDelete.useMutation({
    onSuccess: (result) => {
      utils.clients.list.invalidate();
      setSelectedIds(new Set());
      toast.success(`Successfully deleted ${result.deletedCount} client(s)`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete clients");
    },
  });

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    if (!clients) return [];
    const query = searchQuery.toLowerCase();
    
    // Filter
    let filtered = clients.filter((client) => 
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.companyName?.toLowerCase().includes(query)
    );
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: string | Date | null;
      let bValue: string | Date | null;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortField === 'createdAt') {
        const aTime = (aValue as Date).getTime();
        const bTime = (bValue as Date).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      
      const comparison = (aValue as string).localeCompare(bValue as string);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [clients, searchQuery, sortField, sortDirection]);

  // Calculate pagination
  const totalItems = filteredAndSortedClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection]);

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Get paginated clients
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedClients.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedClients, currentPage, pageSize]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, pageSize, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedClients.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = paginatedClients.length > 0 && paginatedClients.every(c => selectedIds.has(c.id));
  const isSomeSelected = selectedIds.size > 0;

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteClients.mutate({ ids: Array.from(selectedIds) });
    setBulkDeleteDialogOpen(false);
  };

  const handleUndoableDelete = (client: Client) => {
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
      pendingDeleteRef.current = null;
    }

    const previousClients = utils.clients.list.getData();
    
    utils.clients.list.setData(undefined, (old) => 
      old?.filter((c) => c.id !== client.id)
    );
    
    setDeleteDialogOpen(false);
    setClientToDelete(null);

    const undoDelete = () => {
      if (pendingDeleteRef.current) {
        clearTimeout(pendingDeleteRef.current.timeoutId);
        pendingDeleteRef.current = null;
      }
      
      if (previousClients) {
        utils.clients.list.setData(undefined, previousClients);
      } else {
        utils.clients.list.invalidate();
      }
    };

    pushUndoAction({
      type: 'delete',
      entityType: 'client',
      description: `Delete client "${client.name}"`,
      undo: undoDelete,
    });

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

    const timeoutId = setTimeout(async () => {
      pendingDeleteRef.current = null;
      
      try {
        await deleteClient.mutateAsync({ id: client.id });
      } catch (error) {
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

        {/* Search and Sort Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, phone, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="email">Sort by Email</SelectItem>
              <SelectItem value="createdAt">Sort by Date Added</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Bulk Actions Bar */}
        {isSomeSelected && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedIds.size} client{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

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
            ) : filteredAndSortedClients.length === 0 ? (
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
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>
                        <button 
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          Name {getSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          className="flex items-center hover:text-foreground transition-colors"
                          onClick={() => handleSort('email')}
                        >
                          Contact {getSortIcon('email')}
                        </button>
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>VAT</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id} className={selectedIds.has(client.id) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.has(client.id)}
                            onCheckedChange={(checked) => handleSelectOne(client.id, !!checked)}
                            aria-label={`Select ${client.name}`}
                          />
                        </TableCell>
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
                              className="text-destructive hover:text-destructive"
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
                  <div
                    key={client.id}
                    className={`p-4 rounded-lg border border-border/50 bg-card/50 ${selectedIds.has(client.id) ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedIds.has(client.id)}
                          onCheckedChange={(checked) => handleSelectOne(client.id, !!checked)}
                          aria-label={`Select ${client.name}`}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{client.name}</h4>
                          {client.companyName && (
                            <p className="text-sm text-muted-foreground truncate">{client.companyName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
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
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
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
      />

      {selectedClient && (
        <PortalAccessDialog
          open={portalAccessDialogOpen}
          onOpenChange={setPortalAccessDialogOpen}
          client={selectedClient}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Client"
        description={`Are you sure you want to delete "${clientToDelete?.name}"? This action cannot be undone.`}
      />

      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Clients"
        description={`Are you sure you want to delete ${selectedIds.size} client${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
      />

      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => utils.clients.list.invalidate()}
      />
    </div>
  );
}
