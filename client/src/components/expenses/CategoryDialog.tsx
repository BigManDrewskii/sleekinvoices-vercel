import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, Plus, Trash2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[] | undefined;
  categoryForm: {
    name: string;
    color: string;
  };
  setCategoryForm: (form: { name: string; color: string }) => void;
  createCategoryMutation: {
    isPending: boolean;
  };
  handleCreateCategory: (e: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (id: number) => Promise<void>;
  ids: {
    categoryColor: string;
    categoryName: string;
  };
}

export function CategoryDialog({
  open,
  onOpenChange,
  categories,
  categoryForm,
  setCategoryForm,
  createCategoryMutation,
  handleCreateCategory,
  handleDeleteCategory,
  ids,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl">Expense Categories</span>
          </DialogTitle>
          <p className="text-base text-muted-foreground mt-1">
            Organize your expenses with custom categories
          </p>
        </DialogHeader>

        {/* Add New Category Form */}
        <form onSubmit={handleCreateCategory} className="mt-4">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <Plus className="w-4 h-4" />
              Add New Category
            </div>

            <div className="flex gap-3">
              {/* Color Picker */}
              <div className="relative">
                <Input
                  id={ids.categoryColor}
                  type="color"
                  value={categoryForm.color}
                  onChange={e =>
                    setCategoryForm({
                      ...categoryForm,
                      color: e.target.value,
                    })
                  }
                  className="w-12 h-12 p-1 cursor-pointer rounded-lg border-2 border-border/50 hover:border-primary/50 transition-colors"
                />
              </div>

              {/* Name Input */}
              <div className="flex-1">
                <Input
                  id={ids.categoryName}
                  value={categoryForm.name}
                  onChange={e =>
                    setCategoryForm({
                      ...categoryForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter category name..."
                  className="h-12"
                  required
                />
              </div>

              {/* Add Button */}
              <Button
                type="submit"
                disabled={
                  createCategoryMutation.isPending ||
                  !categoryForm.name.trim()
                }
                className="h-12 px-4"
              >
                {createCategoryMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Color Preview */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: categoryForm.color }}
              />
              <span>Selected color: {categoryForm.color}</span>
            </div>
          </div>
        </form>

        {/* Categories List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground/80">
              Your Categories
            </span>
            <span className="text-xs text-muted-foreground">
              {categories?.length || 0} total
            </span>
          </div>

          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {categories && categories.length > 0 ? (
              categories.map((cat: Category) => (
                <div
                  key={cat.id}
                  className="group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 hover:border-border transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Tag className="w-4 h-4 text-white/80" />
                    </div>
                    <div>
                      <span className="font-medium">{cat.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {cat.color}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <Tag className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground/80">
                  No categories yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first category above to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
