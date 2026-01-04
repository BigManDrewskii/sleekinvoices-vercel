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
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  companyName: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function Clients() {
  const { user, loading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
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

  const confirmDelete = () => {
    if (clientToDelete) {
      deleteClient.mutate({ id: clientToDelete.id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <a className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">SleekInvoices</span>
              </a>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </a>
              </Link>
              <Link href="/invoices">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Invoices
                </a>
              </Link>
              <Link href="/clients">
                <a className="text-sm font-medium text-foreground">Clients</a>
              </Link>
              <Link href="/analytics">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </a>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {user?.name || "Settings"}
              </a>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Manage your client database</p>
          </div>
          <Button onClick={handleAddNew}>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
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
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
