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
import { FileText, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users, Key, ShieldCheck, Upload, ArrowUpDown, ArrowUp, ArrowDown, Filter, Download, X, Calendar } from "lucide-react";
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
  
  // Filter state
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [taxExemptFilter, setTaxExemptFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
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
    let filtered = clients.filter((client) => 
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.companyName?.toLowerCase().includes(query)
    );
    
    // Company filter
    if (companyFilter !== 'all') {
      if (companyFilter === 'no-company') {
        filtered = filtered.filter(c => !c.companyName);
      } else {
        filtered = filtered.filter(c => c.companyName === companyFilter);
      }
    }
    
    // Tax exempt filter
    if (taxExemptFilter !== 'all') {
      if (taxExemptFilter === 'exempt') {
        filtered = filtered.filter(c => c.taxExempt === true);
      } else if (taxExemptFilter === 'not-exempt') {
        filtered = filtered.filter(c => c.taxExempt !== true);
      }
    }
    
    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (dateRangeFilter) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(c => new Date(c.createdAt) >= cutoffDate);
    }
    
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
  }, [clients, searchQuery, sortField, sortDirection, companyFilter, taxExemptFilter, dateRangeFilter]);

  // Calculate pagination
  const totalItems = filteredAndSortedClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Reset to page 1 when search, sort, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection, companyFilter, taxExemptFilter, dateRangeFilter]);

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

  // Export clients to CSV
  const handleExportCSV = () => {
    if (!clients || clients.length === 0) {
      toast.error("No clients to export");
      return;
    }

    // Use filtered clients if filters are active, otherwise all clients
    const clientsToExport = filteredAndSortedClients.length > 0 ? filteredAndSortedClients : clients;

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
      "Created At"
    ];

    // Helper function to escape CSV values
    const escapeCSV = (value: string | null | undefined | boolean | Date): string => {
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
      escapeCSV(new Date(client.createdAt))
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients-export-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${clientsToExport.length} client(s) to CSV`);
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
              <Button variant="outline" onClick={handleExportCSV} className="flex-1 sm:flex-initial touch-target">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
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
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, phone, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {(companyFilter !== 'all' || taxExemptFilter !== 'all' || dateRangeFilter !== 'all') && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {[companyFilter !== 'all', taxExemptFilter !== 'all', dateRangeFilter !== 'all'].filter(Boolean).length}
              </Badge>
            )}
          </Button>
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

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-lg border border-border bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Filter Clients</h3>
              {(companyFilter !== 'all' || taxExemptFilter !== 'all' || dateRangeFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCompanyFilter('all');
                    setTaxExemptFilter('all');
                    setDateRangeFilter('all');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Company Filter */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Company</label>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    <SelectItem value="no-company">No Company</SelectItem>
                    {uniqueCompanies.map(company => (
                      <SelectItem key={company} value={company}>{company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tax Exempt Filter */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Tax Status</label>
                <Select value={taxExemptFilter} onValueChange={setTaxExemptFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="exempt">Tax Exempt</SelectItem>
                    <SelectItem value="not-exempt">Not Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Added</label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

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
