import { GearLoader } from "@/components/ui/gear-loader";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { TagDialog } from "@/components/clients/TagDialog";
import { BulkActionsBar } from "@/components/clients/BulkActionsBar";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { ClientTable } from "@/components/clients/ClientTable";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Users,
  Key,
  ShieldCheck,
  Upload,
  Download,
  X,
  Calendar,
  Tag,
  Tags,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FilterSection } from "@/components/ui/filter-section";
import { FilterModal } from "@/components/ui/filter-modal";
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "wouter";
import { useUrlFilters } from "@/hooks/useUrlFilters";
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

interface ClientTag {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

type SortField = "name" | "email" | "createdAt";
type SortDirection = "asc" | "desc";

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
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter state
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const { filters, setFilter, clearFilters, hasActiveFilters } = useUrlFilters({
    pageKey: "clients",
    filters: [
      { key: "company", defaultValue: "all" },
      { key: "taxExempt", defaultValue: "all" },
      { key: "dateRange", defaultValue: "all" },
      { key: "tag", defaultValue: "all" },
    ],
  });

  // Tag management state
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ClientTag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [clientTagsMap, setClientTagsMap] = useState<Map<number, ClientTag[]>>(
    new Map()
  );

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
    window.addEventListener("open-new-client-dialog", handleOpenDialog);
    return () =>
      window.removeEventListener("open-new-client-dialog", handleOpenDialog);
  }, []);

  const { data: clients, isLoading: clientsLoading } =
    trpc.clients.list.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const utils = trpc.useUtils();
  const { pushUndoAction } = useKeyboardShortcuts();
  const { executeDelete } = useUndoableDelete();

  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      // Success is silent since the item is already removed from UI
    },
    onError: (error, variables) => {
      // Rollback: restore the deleted client to the cache
      utils.clients.list.invalidate();
      toast.error(
        error.message || "Failed to delete client. Item has been restored."
      );
    },
  });

  const bulkDeleteClients = trpc.clients.bulkDelete.useMutation({
    onSuccess: result => {
      utils.clients.list.invalidate();
      setSelectedIds(new Set());
      toast.success(`Successfully deleted ${result.deletedCount} client(s)`);
    },
    onError: error => {
      toast.error(error.message || "Failed to delete clients");
    },
  });

  // Tag queries and mutations
  const { data: tags } = trpc.clients.listTags.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createTag = trpc.clients.createTag.useMutation({
    onSuccess: () => {
      utils.clients.listTags.invalidate();
      setTagDialogOpen(false);
      setNewTagName("");
      setNewTagColor("#6366f1");
      toast.success("Tag created successfully");
    },
    onError: error => {
      toast.error(error.message || "Failed to create tag");
    },
  });

  const updateTag = trpc.clients.updateTag.useMutation({
    onSuccess: () => {
      utils.clients.listTags.invalidate();
      setTagDialogOpen(false);
      setEditingTag(null);
      setNewTagName("");
      setNewTagColor("#6366f1");
      toast.success("Tag updated successfully");
    },
    onError: error => {
      toast.error(error.message || "Failed to update tag");
    },
  });

  const deleteTag = trpc.clients.deleteTag.useMutation({
    onSuccess: () => {
      utils.clients.listTags.invalidate();
      toast.success("Tag deleted successfully");
    },
    onError: error => {
      toast.error(error.message || "Failed to delete tag");
    },
  });

  const assignTag = trpc.clients.assignTag.useMutation({
    onSuccess: (_, variables) => {
      // Update local state immediately
      const tag = tags?.find(t => t.id === variables.tagId);
      if (tag) {
        setClientTagsMap(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(variables.clientId) || [];
          if (!existing.find(t => t.id === tag.id)) {
            newMap.set(variables.clientId, [...existing, tag]);
          }
          return newMap;
        });
      }
      toast.success("Tag assigned");
    },
    onError: error => {
      toast.error(error.message || "Failed to assign tag");
    },
  });

  const removeTagMutation = trpc.clients.removeTag.useMutation({
    onSuccess: (_, variables) => {
      // Update local state immediately
      setClientTagsMap(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(variables.clientId) || [];
        newMap.set(
          variables.clientId,
          existing.filter(t => t.id !== variables.tagId)
        );
        return newMap;
      });
      toast.success("Tag removed");
    },
    onError: error => {
      toast.error(error.message || "Failed to remove tag");
    },
  });

  const bulkAssignTag = trpc.clients.bulkAssignTag.useMutation({
    onSuccess: (result, variables) => {
      // Update local state for all assigned clients
      const tag = tags?.find(t => t.id === variables.tagId);
      if (tag) {
        setClientTagsMap(prev => {
          const newMap = new Map(prev);
          for (const clientId of variables.clientIds) {
            const existing = newMap.get(clientId) || [];
            if (!existing.find(t => t.id === tag.id)) {
              newMap.set(clientId, [...existing, tag]);
            }
          }
          return newMap;
        });
      }
      setSelectedIds(new Set());
      toast.success(`Tag assigned to ${result.assignedCount} client(s)`);
    },
    onError: error => {
      toast.error(error.message || "Failed to assign tags");
    },
  });

  // Load tags for all clients in batch
  useEffect(() => {
    if (clients && isAuthenticated) {
      const loadClientTags = async () => {
        try {
          const clientIds = clients.map(c => c.id);
          const tagsMap = await utils.clients.getClientTagsForMultiple.fetch({
            clientIds,
          });
          // Convert Record to Map
          const map = new Map<number, ClientTag[]>();
          Object.entries(tagsMap).forEach(([key, value]) => {
            map.set(parseInt(key), value);
          });
          setClientTagsMap(map);
        } catch (error) {
          console.error("Failed to load client tags:", error);
        }
      };
      loadClientTags();
    }
  }, [clients, isAuthenticated]);

  // Sorting and filtering logic
  const currentSort = useMemo(
    () => ({
      key: sortField as string,
      direction: sortDirection as "asc" | "desc",
    }),
    [sortField, sortDirection]
  );

  const handleSort = (key: string) => {
    const field = key as SortField;
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    if (!clients) return [];

    let filtered = [...clients];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        client =>
          client.name.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.includes(query) ||
          client.companyName?.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (filters.tag && filters.tag !== "all") {
      filtered = filtered.filter(client => {
        const clientTags = clientTagsMap.get(client.id) || [];
        return clientTags.some(t => t.id === parseInt(filters.tag));
      });
    }

    // Apply company filter
    if (filters.company && filters.company !== "all") {
      filtered = filtered.filter(client =>
        filters.company === "with"
          ? client.companyName
          : !client.companyName
      );
    }

    // Apply tax exempt filter
    if (filters.taxExempt && filters.taxExempt !== "all") {
      filtered = filtered.filter(client =>
        filters.taxExempt === "yes"
          ? client.taxExempt
          : !client.taxExempt
      );
    }

    // Apply date range filter
    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(client => {
        const createdDate = new Date(client.createdAt);
        if (filters.dateRange === "30") return createdDate >= thirtyDaysAgo;
        if (filters.dateRange === "90") return createdDate >= ninetyDaysAgo;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (currentSort.key === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (currentSort.key === "email") {
        aVal = a.email || "";
        bVal = b.email || "";
      } else if (currentSort.key === "createdAt") {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (currentSort.direction === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [clients, searchQuery, currentSort, filters, clientTagsMap]);

  // Pagination
  const totalItems = filteredAndSortedClients.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedClients = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAndSortedClients.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSortedClients, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Selection handlers
  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedClients.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const isSomeSelected = selectedIds.size > 0;

  // Action handlers
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setClientDialogOpen(true);
  };

  const handlePortalAccess = (client: Client) => {
    setSelectedClient(client);
    setPortalAccessDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!clientToDelete) return;
    executeDelete({
      item: clientToDelete,
      itemName: clientToDelete.name,
      itemType: "client",
      onOptimisticDelete: () => {
        setDeleteDialogOpen(false);
        setClientToDelete(null);
      },
      onRestore: () => {
        // Refetch clients to restore the deleted one
        utils.clients.list.invalidate();
      },
      onConfirmDelete: async () => {
        await deleteClient.mutateAsync({ id: clientToDelete.id });
      },
    });
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteClients.mutate({
      ids: Array.from(selectedIds),
    });
    setBulkDeleteDialogOpen(false);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <GearLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Clients</h1>
              <p className="text-muted-foreground mt-1">
                Manage your client information and communication
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={() => {
                setSelectedClient(null);
                setClientDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                New Client
              </Button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={hasActiveFilters ? "default" : "outline"}
                    onClick={() => setFilterModalOpen(true)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters {hasActiveFilters && `(${Object.values(filters).filter(f => f !== "all").length})`}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      onClick={() => clearFilters()}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <div>
            {clientsLoading ? (
              <ClientsTableSkeleton />
            ) : clients && clients.length === 0 ? (
              <EmptyState {...EmptyStatePresets.clients} />
            ) : filteredAndSortedClients.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-muted-foreground">
                    No clients match your filters
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <BulkActionsBar
                  isSomeSelected={isSomeSelected}
                  selectedIds={selectedIds}
                  setSelectedIds={setSelectedIds}
                  tags={tags}
                  bulkAssignTag={bulkAssignTag}
                  handleBulkDelete={handleBulkDelete}
                />

                <ClientTable
                  paginatedClients={paginatedClients}
                  filteredAndSortedClients={filteredAndSortedClients}
                  selectedIds={selectedIds}
                  currentSort={currentSort}
                  handleSort={handleSort}
                  handleSelectOne={handleSelectOne}
                  toggleSelectAll={() => {
                    if (selectedIds.size === paginatedClients.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(paginatedClients.map(c => c.id)));
                    }
                  }}
                  clientTagsMap={clientTagsMap}
                  removeTagMutation={removeTagMutation}
                  onEdit={(client) => {
                    setSelectedClient(client as Client);
                    setClientDialogOpen(true);
                  }}
                  onDelete={(client) => handleDelete(client as Client)}
                  onPortalAccess={(client) => {
                    setSelectedClient(client as Client);
                    setPortalAccessDialogOpen(true);
                  }}
                  onDuplicate={(client) => {
                    // Create a new client object with the same data but no ID
                    const duplicateClient = {
                      ...client,
                      id: 0, // Will be treated as new client
                      name: `${client.name} (Copy)`,
                    } as Client;
                    setSelectedClient(duplicateClient);
                    setClientDialogOpen(true);
                  }}
                />

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {paginatedClients.map(client => (
                    <div
                      key={client.id}
                      className={`p-4 rounded-lg border border-border/50 bg-card/50 ${selectedIds.has(client.id) ? "ring-2 ring-primary/50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(client.id)}
                            onCheckedChange={checked =>
                              handleSelectOne(client.id, !!checked)
                            }
                            aria-label={`Select ${client.name}`}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">
                              {client.name}
                            </h4>
                            {client.companyName && (
                              <p className="text-sm text-muted-foreground truncate">
                                {client.companyName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePortalAccess(client)}
                            aria-label={`Manage portal access for ${client.name}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            aria-label={`Edit ${client.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client)}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Delete ${client.name}`}
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
      </main>

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
        description={`Are you sure you want to delete ${selectedIds.size} client${selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.`}
      />

      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => utils.clients.list.invalidate()}
      />

      <TagDialog
        tagDialogOpen={tagDialogOpen}
        setTagDialogOpen={setTagDialogOpen}
        editingTag={editingTag}
        setEditingTag={setEditingTag}
        newTagName={newTagName}
        setNewTagName={setNewTagName}
        newTagColor={newTagColor}
        setNewTagColor={setNewTagColor}
        tags={tags}
        deleteTag={deleteTag}
        createTag={createTag}
        updateTag={updateTag}
      />
    </div>
  );
}
