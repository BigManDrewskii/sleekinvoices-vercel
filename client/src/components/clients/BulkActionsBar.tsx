import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Tag, Trash2 } from "lucide-react";

interface ClientTag {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface BulkActionsBarProps {
  isSomeSelected: boolean;
  selectedIds: Set<number>;
  setSelectedIds: (ids: Set<number>) => void;
  tags: ClientTag[] | undefined;
  bulkAssignTag: any;
  handleBulkDelete: () => void;
}

export function BulkActionsBar({
  isSomeSelected,
  selectedIds,
  setSelectedIds,
  tags,
  bulkAssignTag,
  handleBulkDelete,
}: BulkActionsBarProps) {
  return (
    <>
      {isSomeSelected && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedIds.size} client{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
            <Link
              href={`/invoices/batch?clients=${Array.from(selectedIds).join(",")}`}
            >
              <Button variant="default" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Create Invoices
              </Button>
            </Link>
            {tags && tags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Tag className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {tags.map(tag => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() =>
                        bulkAssignTag.mutate({
                          clientIds: Array.from(selectedIds),
                          tagId: tag.id,
                        })
                      }
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
