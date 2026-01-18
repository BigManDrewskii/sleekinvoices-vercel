import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface ClientSelectorProps {
  value: number | null;
  onChange: (clientId: number) => void;
  error?: string;
}

export function ClientSelector({
  value,
  onChange,
  error,
}: ClientSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: clients, isLoading } = trpc.clients.list.useQuery();

  const handleClientCreated = (clientId?: number) => {
    setCreateDialogOpen(false);
    if (clientId) {
      onChange(clientId);
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        Client <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        <Select
          value={value?.toString() || "none"}
          onValueChange={val => val !== "none" && onChange(parseInt(val))}
        >
          <SelectTrigger className={error ? "border-destructive" : ""}>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="none" disabled>
                Loading clients...
              </SelectItem>
            ) : !clients || clients.length === 0 ? (
              <SelectItem value="none" disabled>
                No clients yet
              </SelectItem>
            ) : (
              clients.map(client => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                  {client.email && ` (${client.email})`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={!clients || clients.length === 0 ? "default" : "outline"}
          onClick={() => setCreateDialogOpen(true)}
          className={!clients || clients.length === 0 ? "shadow-lg" : ""}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <ClientDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleClientCreated}
      />
    </div>
  );
}
