import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: number;
  name: string;
  description: string | null;
  rate: string;
  unit: string | null;
  category: string | null;
  usageCount: number;
};

type ProductSelectorProps = {
  onSelect: (product: Product) => void;
  trigger?: React.ReactNode;
  className?: string;
};

export function ProductSelector({
  onSelect,
  trigger,
  className,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = trpc.products.list.useQuery(
    { includeInactive: false },
    { enabled: open }
  );

  const incrementUsage = trpc.products.incrementUsage.useMutation();

  // Filter products by search query
  const filteredProducts = products?.filter(product => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  // Sort by usage count (most used first)
  const sortedProducts = filteredProducts?.sort(
    (a, b) => b.usageCount - a.usageCount
  );

  // Get top 3 most used products for quick access
  const frequentProducts = products?.slice(0, 3);

  const handleSelect = (product: Product) => {
    onSelect(product);
    incrementUsage.mutate({ id: product.id });
    setOpen(false);
    setSearchQuery("");
  };

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
          >
            <Package className="h-4 w-4" />
            Add from Library
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading products...
            </div>
          ) : sortedProducts && sortedProducts.length > 0 ? (
            <div className="p-2">
              {/* Frequent products section */}
              {!searchQuery &&
                frequentProducts &&
                frequentProducts.length > 0 && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Frequently Used
                    </div>
                    {frequentProducts.map(product => (
                      <ProductItem
                        key={`frequent-${product.id}`}
                        product={product}
                        onSelect={handleSelect}
                        highlight
                      />
                    ))}
                    <div className="my-2 border-t" />
                  </div>
                )}

              {/* All products */}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {searchQuery ? "Search Results" : "All Products"}
              </div>
              {sortedProducts.map(product => (
                <ProductItem
                  key={product.id}
                  product={product}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? "No products found" : "No products yet"}
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setOpen(false);
                  window.open("/products", "_blank");
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Products
              </Button>
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t bg-muted/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              setOpen(false);
              window.open("/products", "_blank");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Manage Products
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProductItem({
  product,
  onSelect,
  highlight = false,
}: {
  product: Product;
  onSelect: (product: Product) => void;
  highlight?: boolean;
}) {
  return (
    <button
      className={cn(
        "w-full text-left px-2 py-2 rounded-md hover:bg-accent transition-colors",
        highlight && "bg-accent/50"
      )}
      onClick={() => onSelect(product)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{product.name}</div>
          {product.description && (
            <div className="text-xs text-muted-foreground truncate">
              {product.description}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-medium text-sm">
            ${parseFloat(product.rate).toFixed(2)}
          </div>
          {product.unit && (
            <div className="text-xs text-muted-foreground">
              per {product.unit}
            </div>
          )}
        </div>
      </div>
      {product.category && (
        <Badge variant="outline" className="mt-1 text-xs">
          {product.category}
        </Badge>
      )}
    </button>
  );
}
