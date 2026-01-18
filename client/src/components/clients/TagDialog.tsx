import { useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, X } from "lucide-react";
import { toast } from "sonner";

interface ClientTag {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface TagDialogProps {
  tagDialogOpen: boolean;
  setTagDialogOpen: (open: boolean) => void;
  editingTag: ClientTag | null;
  setEditingTag: (tag: ClientTag | null) => void;
  newTagName: string;
  setNewTagName: (name: string) => void;
  newTagColor: string;
  setNewTagColor: (color: string) => void;
  tags: ClientTag[] | undefined;
  deleteTag: any;
  createTag: any;
  updateTag: any;
}

export function TagDialog({
  tagDialogOpen,
  setTagDialogOpen,
  editingTag,
  setEditingTag,
  newTagName,
  setNewTagName,
  newTagColor,
  setNewTagColor,
  tags,
  deleteTag,
  createTag,
  updateTag,
}: TagDialogProps) {
  const tagNameId = useId();
  const tagColorId = useId();

  return (
    <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">
            {editingTag ? "Edit Tag" : "Manage Tags"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {editingTag
              ? "Update the tag details below."
              : "Create and manage tags to organize your clients."}
          </DialogDescription>
        </DialogHeader>

        {!editingTag && tags && tags.length > 0 && (
          <div className="space-y-3 pb-2">
            <Label className="text-sm font-medium">Existing Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-sm cursor-pointer hover:opacity-80 pr-1"
                  style={{
                    backgroundColor: tag.color + "20",
                    color: tag.color,
                    borderColor: tag.color,
                  }}
                >
                  {tag.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    onClick={() => {
                      setEditingTag(tag);
                      setNewTagName(tag.name);
                      setNewTagColor(tag.color);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent text-destructive"
                    onClick={() => {
                      if (confirm(`Delete tag "${tag.name}"?`)) {
                        deleteTag.mutate({ id: tag.id });
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={tagNameId}>
              {editingTag ? "Tag Name" : "New Tag Name"}
            </Label>
            <Input
              id={tagNameId}
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder="e.g., VIP, Recurring, New"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={tagColorId}>Tag Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id={tagColorId}
                value={newTagColor}
                onChange={e => setNewTagColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
                aria-label="Custom color picker"
              />
              <div
                className="flex gap-2"
                role="radiogroup"
                aria-label="Preset tag colors"
              >
                {[
                  { hex: "#6366f1", name: "Indigo" },
                  { hex: "#22c55e", name: "Green" },
                  { hex: "#f59e0b", name: "Amber" },
                  { hex: "#ef4444", name: "Red" },
                  { hex: "#8b5cf6", name: "Purple" },
                  { hex: "#06b6d4", name: "Cyan" },
                  { hex: "#ec4899", name: "Pink" },
                ].map(color => (
                  <button
                    key={color.hex}
                    type="button"
                    role="radio"
                    aria-checked={newTagColor === color.hex}
                    aria-label={`Select ${color.name} color`}
                    className={`w-6 h-6 rounded-full border-2 ${newTagColor === color.hex ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setNewTagColor(color.hex)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          {editingTag && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingTag(null);
                setNewTagName("");
                setNewTagColor("#6366f1");
              }}
            >
              Cancel Edit
            </Button>
          )}
          <Button
            onClick={() => {
              if (!newTagName.trim()) {
                toast.error("Please enter a tag name");
                return;
              }
              if (editingTag) {
                updateTag.mutate({
                  id: editingTag.id,
                  name: newTagName.trim(),
                  color: newTagColor,
                });
              } else {
                createTag.mutate({
                  name: newTagName.trim(),
                  color: newTagColor,
                });
              }
            }}
            disabled={createTag.isPending || updateTag.isPending}
          >
            {editingTag ? "Update Tag" : "Create Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
