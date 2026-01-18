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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { Mail, Phone } from "lucide-react";

interface Client {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  vatNumber?: string | null;
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
  clientTagsMap: Map<number, ClientTag[]>;
  removeTagMutation: any;
}

export function ClientTable({
  paginatedClients,
  filteredAndSortedClients,
  selectedIds,
  currentSort,
  handleSort,
  handleSelectOne,
  clientTagsMap,
  removeTagMutation,
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
      <div className="px-5 pb-5">
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
              <TableHead scope="col">Company</TableHead>
              <TableHead scope="col">Tags</TableHead>
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
                        onClick={() => handleSelectOne(client.id, true)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary/10" />
                          <span className="text-sm">Edit</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          useUndoableDelete({
                            entity: client,
                            entityId: client.id,
                            type: "client",
                            onConfirm: () => {
                              window.confirm(
                                `Are you sure you want to delete "${client.name}"?`
                              );
                            },
                          })
                        }
                        className="text-destructive"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-destructive/10" />
                          <span className="text-sm">Delete</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleSelectOne(client.id, true)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary/10" />
                          <span className="text-sm">Duplicate</span>
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
  );
}
