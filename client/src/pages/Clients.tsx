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

          // Convert to Map format
          const newMap = new Map<number, ClientTag[]>();
          for (const client of clients) {
            newMap.set(client.id, tagsMap[client.id] || []);
          }
          setClientTagsMap(newMap);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("Failed to load client tags:", error);
          }
          // Set empty tags for all clients on error
          const newMap = new Map<number, ClientTag[]>();
          for (const client of clients) {
            newMap.set(client.id, []);
          }
          setClientTagsMap(newMap);
        }
      };
      loadClientTags();
    }
  }, [clients, isAuthenticated, utils]);

  // Get unique companies for filter dropdown
  const uniqueCompanies = useMemo(() => {
    if (!clients) return [];
    const companies = clients
      .map(c => c.companyName)
      .filter((c): c is string => !!c)
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .sort();
    return companies;
  }, [clients]);

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    if (!clients) return [];
    const query = searchQuery.toLowerCase();

    // Text search filter
    let filtered = clients.filter(
      client =>
        client.name.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.companyName?.toLowerCase().includes(query)
    );

    // Company filter
    if (filters.company !== "all") {
      if (filters.company === "no-company") {
        filtered = filtered.filter(c => !c.companyName);
      } else {
        filtered = filtered.filter(c => c.companyName === filters.company);
      }
    }

    // Tax exempt filter
    if (filters.taxExempt !== "all") {
      if (filters.taxExempt === "exempt") {
        filtered = filtered.filter(c => c.taxExempt === true);
      } else if (filters.taxExempt === "not-exempt") {
        filtered = filtered.filter(c => c.taxExempt !== true);
      }
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      let cutoffDate: Date;

      switch (filters.dateRange) {
        case "today":
          cutoffDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(c => new Date(c.createdAt) >= cutoffDate);
    }

    // Tag filter
    if (filters.tag !== "all") {
      if (filters.tag === "no-tags") {
        filtered = filtered.filter(c => {
          const clientTags = clientTagsMap.get(c.id) || [];
          return clientTags.length === 0;
        });
      } else {
        const tagId = parseInt(filters.tag);
        filtered = filtered.filter(c => {
          const clientTags = clientTagsMap.get(c.id) || [];
          return clientTags.some(t => t.id === tagId);
        });
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | Date | null;
      let bValue: string | Date | null;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortField === "createdAt") {
        const aTime = (aValue as Date).getTime();
        const bTime = (bValue as Date).getTime();
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      const comparison = (aValue as string).localeCompare(bValue as string);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    clients,
    searchQuery,
    sortField,
    sortDirection,
    filters.company,
    filters.taxExempt,
    filters.dateRange,
    filters.tag,
    clientTagsMap,
  ]);

  // Calculate pagination
  const totalItems = filteredAndSortedClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 when search, sort, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    sortField,
    sortDirection,
    filters.company,
    filters.taxExempt,
    filters.dateRange,
    filters.tag,
  ]);

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
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

  const isAllSelected =
    paginatedClients.length > 0 &&
    paginatedClients.every(c => selectedIds.has(c.id));
  const isSomeSelected = selectedIds.size > 0;

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteClients.mutate({ ids: Array.from(selectedIds) });
    setBulkDeleteDialogOpen(false);
  };

  const handleUndoableDelete = (client: Client) => {
    const previousClients = utils.clients.list.getData();

    const undoDelete = () => {
      if (previousClients) {
        utils.clients.list.setData(undefined, previousClients);
      } else {
        utils.clients.list.invalidate();
      }
    };

    pushUndoAction({
      type: "delete",
      entityType: "client",
      description: `Delete client "${client.name}"`,
      undo: undoDelete,
    });

    executeDelete({
      item: client,
      itemName: client.name,
      itemType: "client",
      onOptimisticDelete: () => {
        utils.clients.list.setData(undefined, old =>
          old?.filter(c => c.id !== client.id)
        );
        setDeleteDialogOpen(false);
        setClientToDelete(null);
      },
      onRestore: undoDelete,
      onConfirmDelete: async () => {
        await deleteClient.mutateAsync({ id: client.id });
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="opacity-70">
          <GearLoader size="md" />
        </div>
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

  // Export clients to CSV
  const handleExportCSV = () => {
    if (!clients || clients.length === 0) {
      toast.error("No clients to export");
      return;
    }

    // Use filtered clients if filters are active, otherwise all clients
    const clientsToExport =
      filteredAndSortedClients.length > 0 ? filteredAndSortedClients : clients;

    // CSV headers
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Address",
      "VAT Number",
      "Tax Exempt",
      "Notes",
      "Created At",
    ];

    // Helper function to escape CSV values
    const escapeCSV = (
      value: string | null | undefined | boolean | Date
    ): string => {
      if (value === null || value === undefined) return "";
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (value instanceof Date) return value.toISOString().split("T")[0];
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows = clientsToExport.map(client => [
      escapeCSV(client.name),
      escapeCSV(client.email),
      escapeCSV(client.phone),
      escapeCSV(client.companyName),
      escapeCSV(client.address),
      escapeCSV(client.vatNumber),
      escapeCSV(client.taxExempt),
      escapeCSV(client.notes),
      escapeCSV(new Date(client.createdAt)),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `clients-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${clientsToExport.length} client(s) to CSV`);
  };

  // Build active filter chips
  const activeFilters = useMemo(() => {
    const chips: Array<{
      key: string;
      label: string;
      value: string;
      onRemove: () => void;
    }> = [];

    if (filters.company !== "all") {
      chips.push({
        key: "company",
        label: "Company",
        value:
          filters.company === "no-company" ? "No Company" : filters.company,
        onRemove: () => setFilter("company", "all"),
      });
    }

    if (filters.taxExempt !== "all") {
      chips.push({
        key: "taxExempt",
        label: "Tax",
        value: filters.taxExempt === "exempt" ? "Exempt" : "Not Exempt",
        onRemove: () => setFilter("taxExempt", "all"),
      });
    }

    if (filters.dateRange !== "all") {
      const dateLabels: Record<string, string> = {
        today: "Today",
        week: "Last 7 Days",
        month: "Last 30 Days",
        quarter: "Last 90 Days",
        year: "Last Year",
      };
      chips.push({
        key: "dateRange",
        label: "Added",
        value: dateLabels[filters.dateRange] || filters.dateRange,
        onRemove: () => setFilter("dateRange", "all"),
      });
    }

    if (filters.tag !== "all") {
      const tag = tags?.find(t => t.id.toString() === filters.tag);
      chips.push({
        key: "tag",
        label: "Tag",
        value: filters.tag === "no-tags" ? "No Tags" : tag?.name || filters.tag,
        onRemove: () => setFilter("tag", "all"),
      });
    }

    return chips;
  }, [filters, tags, setFilter]);

  return (
    <div className="page-wrapper">
      <Navigation />

      {/* Main Content */}
      <main
        id="main-content"
        className="page-content page-transition"
        role="main"
        aria-label="Clients"
      >
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-header-title">Clients</h1>
              <p className="page-header-subtitle">
                Manage your client database
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="flex-1 sm:flex-initial touch-target"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="flex-1 sm:flex-initial touch-target"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                onClick={handleAddNew}
                className="flex-1 sm:flex-initial touch-target"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Client</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <FilterSection
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search clients by name, email, phone, or company..."
          activeFilters={activeFilters}
          onClearAll={hasActiveFilters ? clearFilters : undefined}
        >
          <Select
            value={sortField}
            onValueChange={(value: SortField) => setSortField(value)}
          >
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
            variant={filterModalOpen ? "secondary" : "outline"}
            onClick={() => setFilterModalOpen(true)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFilters.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSortDirection(sortDirection === "asc" ? "desc" : "asc")
            }
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {sortDirection === "asc" ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </FilterSection>

        {/* Filter Modal */}
        <FilterModal
          open={filterModalOpen}
          onOpenChange={setFilterModalOpen}
          title="Client Filters"
          fields={[
            {
              key: "company",
              label: "Company",
              type: "select",
              options: [
                { value: "all", label: "All Companies" },
                { value: "no-company", label: "No Company" },
                ...uniqueCompanies.map(c => ({ value: c, label: c })),
              ],
            },
            {
              key: "taxExempt",
              label: "Tax Status",
              type: "select",
              options: [
                { value: "all", label: "All Statuses" },
                { value: "exempt", label: "Tax Exempt" },
                { value: "not-exempt", label: "Not Exempt" },
              ],
            },
            {
              key: "dateRange",
              label: "Added",
              type: "select",
              options: [
                { value: "all", label: "Any Time" },
                { value: "today", label: "Today" },
                { value: "week", label: "Last 7 Days" },
                { value: "month", label: "Last 30 Days" },
                { value: "quarter", label: "Last 90 Days" },
                { value: "year", label: "Last Year" },
              ],
            },
            {
              key: "tag",
              label: "Tag",
              type: "select",
              options: [
                { value: "all", label: "All Tags" },
                { value: "no-tags", label: "No Tags" },
                ...(tags?.map(t => ({
                  value: t.id.toString(),
                  label: t.name,
                })) || []),
              ],
            },
          ]}
          values={filters}
          onChange={setFilter}
          onClear={clearFilters}
        />

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
          clientTagsMap={clientTagsMap}
          removeTagMutation={removeTagMutation}
        />
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(client.id)}
                              onCheckedChange={checked =>
                                handleSelectOne(client.id, !!checked)
                              }
                              aria-label={`Select ${client.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {client.name}
                          </TableCell>
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
                                <span className="text-sm text-muted-foreground">
                                  No contact info
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.companyName || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(clientTagsMap.get(client.id) || []).map(tag => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                  className="text-xs cursor-pointer hover:opacity-80"
                                  style={{
                                    backgroundColor: tag.color + "20",
                                    color: tag.color,
                                    borderColor: tag.color,
                                  }}
                                  onClick={() =>
                                    removeTagMutation.mutate({
                                      clientId: client.id,
                                      tagId: tag.id,
                                    })
                                  }
                                  title="Click to remove"
                                >
                                  {tag.name}
                                  <X className="h-3 w-3 ml-1" />
                                </Badge>
                              ))}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Add tag to ${client.name}`}
                                  >
                                    <Tag className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {tags && tags.length > 0 ? (
                                    tags.map(tag => {
                                      const isAssigned = (
                                        clientTagsMap.get(client.id) || []
                                      ).some(t => t.id === tag.id);
                                      return (
                                        <DropdownMenuItem
                                          key={tag.id}
                                          onClick={() => {
                                            if (isAssigned) {
                                              removeTagMutation.mutate({
                                                clientId: client.id,
                                                tagId: tag.id,
                                              });
                                            } else {
                                              assignTag.mutate({
                                                clientId: client.id,
                                                tagId: tag.id,
                                              });
                                            }
                                          }}
                                        >
                                          <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{
                                              backgroundColor: tag.color,
                                            }}
                                          />
                                          {tag.name}
                                          {isAssigned && (
                                            <span className="ml-auto text-primary">
                                              ✓
                                            </span>
                                          )}
                                        </DropdownMenuItem>
                                      );
                                    })
                                  ) : (
                                    <DropdownMenuItem disabled>
                                      No tags created
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {client.vatNumber ? (
                                <span className="text-sm font-mono">
                                  {client.vatNumber}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                              {client.taxExempt && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs flex items-center gap-1 w-fit"
                                >
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
                                <span className="line-clamp-2">
                                  {client.address}
                                </span>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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
