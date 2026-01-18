import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { Mail, Phone, MapPin, Key, Edit, Trash2, Copy } from "lucide-react";

interface Client {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientTag {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface ClientTableProps {
  paginatedClients: Client[];
  filteredAndSortedClients: Client[];
  selectedIds: Set<number>;
  currentSort: { key: string; direction: "asc" | "desc" };
  handleSort: (key: string) => void;
  handleSelectOne: (id: number, selected: boolean) => void;
  toggleSelectAll: () => void;
  clientTagsMap: Map<number, ClientTag[]>;
  removeTagMutation: any;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onPortalAccess: (client: Client) => void;
  onDuplicate: (client: Client) => void;
}

export function ClientTable({
  paginatedClients,
  filteredAndSortedClients,
  selectedIds,
  currentSort,
  handleSort,
  handleSelectOne,
  toggleSelectAll,
  clientTagsMap,
  removeTagMutation,
  onEdit,
  onDelete,
  onPortalAccess,
  onDuplicate,
}: ClientTableProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border/50 backdrop-blur-sm overflow-hidden">
      <div className="p-5 pb-4">
        <h3 className="text-lg font-semibold text-foreground">All Clients</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-numeric">
            {filteredAndSortedClients.length}
          </span>{" "}
          client
          {filteredAndSortedClients.length !== 1 ? "s" : ""} found
        </p>
      </div>
      <div className="px-5 pb-5 overflow-x-auto -mx-5 sm:mx-0">
        <div className="min-w-[700px] px-5 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    selectedIds.size === paginatedClients.length &&
                    paginatedClients.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all clients on this page"
                  className={
                    paginatedClients.length > 0 &&
                    paginatedClients.length === selectedIds.size
                      ? "data-[state=checked]:bg-primary/50"
                      : ""
                  }
                />
              </TableHead>
              <SortableTableHeader
                label="Company"
                sortKey="name"
                currentSort={currentSort}
                onSort={handleSort}
              />
              <TableHead scope="col">Contact</TableHead>
              <TableHead scope="col">VAT</TableHead>
              <TableHead scope="col">Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.map(client => (
              <TableRow
                key={client.id}
                className={selectedIds.has(client.id) ? "bg-primary/5" : ""}
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
                        className="text-xs cursor-pointer hover:opacity-80 pr-1"
                        style={{
                          backgroundColor: tag.color + "20",
                          color: tag.color,
                          borderColor: tag.color,
                        }}
                        title="Click to remove tag"
                        onClick={() =>
                          removeTagMutation.mutate({
                            clientId: client.id,
                            tagId: tag.id,
                          })
                        }
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {client.vatNumber || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="p-2 hover:bg-muted/50 rounded transition-colors"
                        aria-label="Actions"
                      >
                        •••
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        onClick={() => onEdit(client)}
                      >
                        <div className="flex items-center gap-2">
                          <Edit className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">Edit</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDuplicate(client)}
                      >
                        <div className="flex items-center gap-2">
                          <Copy className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">Duplicate</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(client)}
                        className="text-destructive"
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-3 w-3" />
                          <span className="text-sm">Delete</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onPortalAccess(client)}
                      >
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">Portal Access</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      <div className="px-5 pb-5 md:hidden">
        <div className="space-y-3">
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
                    onClick={() => onPortalAccess(client)}
                    aria-label={`Manage portal access for ${client.name}`}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(client)}
                    aria-label={`Edit ${client.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(client)}
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
      </div>
    </div>
  );
}
