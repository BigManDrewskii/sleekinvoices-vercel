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
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users, Key, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

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

  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const deleteClient = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client deleted successfully");
      utils.clients.list.invalidate();
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete client");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const filteredClients = clients?.filter((client) => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.companyName?.toLowerCase().includes(query)
    );
  });

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
      deleteClient.mutate({ id: clientToDelete.id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your client database</p>
          </div>
          <Button onClick={handleAddNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
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
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>
              {filteredClients?.length || 0} client{filteredClients?.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
            ) : !clients || clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No clients yet</h3>
                <p className="text-muted-foreground mb-4">Add your first client to get started</p>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            ) : filteredClients && filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No clients match your search query
              </div>
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
                    {filteredClients?.map((client) => (
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
              <div className="md:hidden space-y-4">
                {filteredClients?.map((client) => (
                  <div key={client.id} className="border rounded-lg p-4 space-y-3">
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
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePortalAccess(client)}
                        className="flex-1"
                      >
                        <Key className="h-4 w-4 mr-1" />
                        Portal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </CardContent>
        </Card>
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
    </div>
  );
}
