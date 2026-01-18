import { useState, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Currency } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { CurrencyInput } from "@/components/ui/specialized-inputs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  Tag,
  BarChart3,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProductsPageSkeleton, Skeleton } from "@/components/skeletons";
import { EmptyState, EmptyStatePresets } from "@/components/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { SortableTableHeader } from "@/components/shared/SortableTableHeader";
import { ScrollableTableWrapper } from "@/components/ui/scrollable-table-wrapper";
import { useTableSort } from "@/hooks/useTableSort";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { FilterSection, FilterSelect } from "@/components/ui/filter-section";

type Product = {
  id: number;
  name: string;
  description: string | null;
  rate: string;
  unit: string | null;
  category: string | null;
  sku: string | null;
  taxable: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
};

const UNIT_OPTIONS = [
  { value: "unit", label: "Unit" },
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "project", label: "Project" },
  { value: "item", label: "Item" },
  { value: "service", label: "Service" },
];

export default function Products() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting
  const { sort, handleSort, sortData } = useTableSort({
    defaultKey: "name",
    defaultDirection: "asc",
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rate: "",
    unit: "unit",
    category: "",
    sku: "",
    taxable: true,
  });

  const {
    data: products,
    isLoading,
    refetch,
  } = trpc.products.list.useQuery(
    { includeInactive: showInactive },
    { enabled: !!user }
  );

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: error => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      refetch();
    },
    onError: error => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const utils = trpc.useUtils();

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      // Success is silent since the item is already removed from UI
    },
    onError: error => {
      refetch();
      toast.error(
        error.message || "Failed to archive product. Item has been restored."
      );
    },
  });

  const { executeDelete } = useUndoableDelete();

  const handleUndoableDelete = (product: Product) => {
    const previousProducts = utils.products.list.getData({
      includeInactive: showInactive,
    });

    executeDelete({
      item: product,
      itemName: product.name,
      itemType: "product",
      onOptimisticDelete: () => {
        utils.products.list.setData({ includeInactive: showInactive }, old =>
          old?.filter(p => p.id !== product.id)
        );
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
      },
      onRestore: () => {
        if (previousProducts) {
          utils.products.list.setData(
            { includeInactive: showInactive },
            previousProducts
          );
        } else {
          refetch();
        }
      },
      onConfirmDelete: async () => {
        await deleteMutation.mutateAsync({ id: product.id });
      },
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rate: "",
      unit: "unit",
      category: "",
      sku: "",
      taxable: true,
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.rate) {
      toast.error("Name and rate are required");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      rate: formData.rate,
      unit: formData.unit,
      category: formData.category || undefined,
      sku: formData.sku || undefined,
      taxable: formData.taxable,
    });
  };

  const handleEdit = () => {
    if (!selectedProduct) return;
    updateMutation.mutate({
      id: selectedProduct.id,
      name: formData.name,
      description: formData.description || null,
      rate: formData.rate,
      unit: formData.unit || null,
      category: formData.category || null,
      sku: formData.sku || null,
      taxable: formData.taxable,
    });
  };

  const handleDelete = () => {
    if (!selectedProduct) return;
    handleUndoableDelete(selectedProduct);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      rate: product.rate,
      unit: product.unit || "unit",
      category: product.category || "",
      sku: product.sku || "",
      taxable: product.taxable,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Filter, sort, and paginate products
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower)
      );
    }

    // Active/Inactive filter
    if (!showInactive) {
      result = result.filter(p => p.isActive);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Date range filter (by createdAt)
    if (dateRange !== "all") {
      const now = new Date();
      result = result.filter(product => {
        const productDate = new Date(product.createdAt);

        switch (dateRange) {
          case "today":
            return productDate.toDateString() === now.toDateString();
          case "7days":
            return (
              productDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            );
          case "30days":
            return (
              productDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            );
          case "90days":
            return (
              productDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            );
          case "year":
            return (
              productDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            );
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return sortData(result);
  }, [
    products,
    searchQuery,
    showInactive,
    categoryFilter,
    dateRange,
    sortData,
  ]);

  // Pagination
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, showInactive, categoryFilter, dateRange]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = new Set(
      products.map(p => p.category).filter(Boolean)
    );
    return Array.from(uniqueCategories).sort();
  }, [products]);

  // Calculate stats (use all products, not filtered)
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.isActive).length || 0;
  const totalUsage = products?.reduce((sum, p) => sum + p.usageCount, 0) || 0;

  const clearFilters = () => {
    setSearchQuery("");
    setShowInactive(false);
    setCategoryFilter("all");
    setDateRange("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = !!(
    searchQuery ||
    showInactive ||
    categoryFilter !== "all" ||
    dateRange !== "all"
  );

  if (loading) {
    return <ProductsPageSkeleton />;
  }

  return (
    <PageLayout
      title="Products & Services"
      subtitle="Manage your product catalog for quick invoice creation"
      headerActions={
        <Button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </Button>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Times Used</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">Across all invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Tip</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add products here to quickly insert them when creating invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <FilterSection
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search products..."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {/* Category Filter */}
          <FilterSelect label="Category">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat || "uncategorized"} value={cat || ""}>
                    {cat || "Uncategorized"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSelect>

          {/* Date Range Filter */}
          <FilterSelect label="Date Added">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </FilterSelect>

          {/* Show Inactive Toggle */}
          <div className="flex items-center gap-2 p-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
              Show archived
            </Label>
          </div>
        </div>
      </FilterSection>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {filteredAndSortedProducts.length} product
            {filteredAndSortedProducts.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !products || filteredAndSortedProducts.length === 0 ? (
            <EmptyState
              {...EmptyStatePresets.products}
              size="sm"
              action={{
                label: "Add Product",
                onClick: () => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                },
                icon: Plus,
              }}
            />
          ) : (
            <>
              <ScrollableTableWrapper minWidth={750}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader
                      label="Product"
                      sortKey="name"
                      currentSort={sort}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Rate"
                      sortKey="rate"
                      currentSort={sort}
                      onSort={handleSort}
                    />
                    <TableHead>Unit</TableHead>
                    <SortableTableHeader
                      label="Category"
                      sortKey="category"
                      currentSort={sort}
                      onSort={handleSort}
                    />
                    <TableHead className="text-center">Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map(product => (
                    <TableRow
                      key={product.id}
                      className={!product.isActive ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                          {product.sku && (
                            <div className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <Currency amount={parseFloat(product.rate)} bold />
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {product.unit || "unit"}
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.usageCount}
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge
                            variant="default"
                            className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          >
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="More actions for this product"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(product)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(product)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </ScrollableTableWrapper>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-border/20">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={size => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Add New Product</DialogTitle>
            <DialogDescription className="text-base">
              Create a product or service to quickly add to invoices
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Web Development"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the product or service"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="rate">Rate *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.rate}
                    onChange={e =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={value =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Development"
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU / Code</Label>
                <Input
                  id="sku"
                  placeholder="e.g., WEB-001"
                  value={formData.sku}
                  onChange={e =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="taxable"
                checked={formData.taxable}
                onCheckedChange={checked =>
                  setFormData({ ...formData, taxable: checked })
                }
              />
              <Label htmlFor="taxable">Taxable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Edit Product</DialogTitle>
            <DialogDescription className="text-base">
              Update the product details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-rate">Rate *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.rate}
                    onChange={e =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={value =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={e =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sku">SKU / Code</Label>
                <Input
                  id="edit-sku"
                  value={formData.sku}
                  onChange={e =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-taxable"
                checked={formData.taxable}
                onCheckedChange={checked =>
                  setFormData({ ...formData, taxable: checked })
                }
              />
              <Label htmlFor="edit-taxable">Taxable</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Archive Product</DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to archive "{selectedProduct?.name}"? This
              product will no longer appear in the product selector, but
              existing invoices will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Archiving..." : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
