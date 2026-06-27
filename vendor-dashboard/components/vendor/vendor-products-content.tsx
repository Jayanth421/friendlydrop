"use client";

import { useMemo, useState, useCallback, ComponentType } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Package,
  Search,
  Filter,
  Loader2,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Archive,
  MoreVertical,
  BarChart3,
  FileText,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types";

interface VendorProductsContentProps {
  products: Product[];
}

type ProductStatus = "draft" | "published" | "archived" | "pending_approval" | "rejected";
type DialogType = "add" | "edit" | "delete" | "duplicate" | "preview" | "publish" | "variants" | null;

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice?: number;
  stock: number;
  sku: string;
  status: ProductStatus;
  primaryImage: string;
  reorderThreshold?: number;
  tags?: string[];
}

interface ProductVariant {
  id: string;
  color?: string;
  size?: string;
  sku: string;
  price: number;
  stock: number;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  description: "",
  category: "photo-prints",
  price: 0,
  salePrice: undefined,
  stock: 0,
  sku: "",
  status: "draft",
  primaryImage: "",
  reorderThreshold: 10,
  tags: [],
};

function getStatusColor(status?: string) {
  const s = status?.toLowerCase() || "draft";
  if (s === "published") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "draft") return "border-amber-200 bg-amber-50 text-amber-700";
  if (s === "archived") return "border-stone-200 bg-stone-50 text-stone-700";
  if (s === "pending_approval") return "border-blue-200 bg-blue-50 text-blue-700";
  if (s === "rejected") return "border-red-200 bg-red-50 text-red-700";
  return "border-stone-200 bg-stone-50 text-stone-700";
}

function getStatusLabel(status?: string) {
  const s = status?.toLowerCase() || "draft";
  return s.replace(/_/g, " ");
}


function ProductFormDialog({
  open,
  product,
  onOpenChange,
  onSave,
  isSaving,
}: {
  open: boolean;
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProductFormData) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState<ProductFormData>(
    product
      ? {
          name: product.name,
          description: product.description || "",
          category: product.category || "photo-prints",
          price: product.price || 0,
          salePrice: product.discountPercent ? (product.price || 0) * (1 - (product.discountPercent || 0) / 100) : undefined,
          stock: product.stock || 0,
          sku: product.sku || "",
          status: (product.status as ProductStatus) || "draft",
          primaryImage: product.primaryImage || "",
          reorderThreshold: product.lowStockThreshold || 10,
          tags: product.tags || [],
        }
      : EMPTY_FORM
  );

  const handleSave = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Product name and description are required");
      return;
    }
    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    onSave(formData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50/50 shadow-2xl">
        {/* Header */}
        <div className="border-b border-stone-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                {product ? "Edit Product" : "Create New Product"}
              </h2>
              <p className="text-sm text-stone-600 mt-1">
                {product ? "Update product details and pricing" : "Add a new product to your store catalog"}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg p-1 transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-250px)] px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Product Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter product name"
                disabled={isSaving}
                className="border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Category *
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="border-stone-200 focus:ring-1 focus:ring-stone-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo-prints">Photo Prints</SelectItem>
                  <SelectItem value="stickers">Stickers</SelectItem>
                  <SelectItem value="personalized-gifts">Personalized Gifts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter detailed product description"
              disabled={isSaving}
              className="w-full rounded-lg border border-stone-200 p-3 text-sm focus:border-stone-400 focus:ring-1 focus:ring-stone-400 disabled:opacity-50"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Regular Price (₹) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))
                }
                placeholder="0"
                disabled={isSaving}
                min="0"
                step="0.01"
                className="border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Sale Price (₹)
              </label>
              <Input
                type="number"
                value={formData.salePrice || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, salePrice: e.target.value ? Number(e.target.value) : undefined }))
                }
                placeholder="Optional"
                disabled={isSaving}
                min="0"
                step="0.01"
                className="border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Stock Quantity *
              </label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stock: Number(e.target.value) }))
                }
                placeholder="0"
                disabled={isSaving}
                min="0"
                className="border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                SKU
              </label>
              <Input
                value={formData.sku}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="e.g., PROD-001"
                disabled={isSaving}
                className="border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Reorder Threshold
              </label>
              <Input
                type="number"
                value={formData.reorderThreshold || 10}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reorderThreshold: Number(e.target.value) }))
                }
                placeholder="10"
                disabled={isSaving}
                min="0"
                className="border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value as ProductStatus }))
              }
            >
              <SelectTrigger className="border-stone-200 focus:ring-1 focus:ring-stone-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 flex items-center justify-end gap-3 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="border-stone-200 hover:bg-stone-50 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 text-white rounded-lg font-semibold"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {product ? "Update" : "Create"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}


function DeleteConfirmDialog({
  open,
  product,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-2xl">
        {/* Header with icon */}
        <div className="flex items-start gap-4 border-b border-stone-200 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-stone-900">Delete Product</h2>
            <p className="text-sm text-stone-600 mt-1">
              Are you sure you want to delete &quot;{product?.name}&quot;?
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-stone-600">
            This action cannot be undone. The product will be permanently removed from your catalog.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-stone-200 p-6 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="border-stone-200 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onPreview,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPublish: () => void;
  onPreview: () => void;
}) {
  const isPublished = product.status === "published";
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 10);
  const hasSalePrice = product.discountPercent && product.discountPercent > 0;
  const salePrice = hasSalePrice ? (product.price || 0) * (1 - (product.discountPercent || 0) / 100) : null;

  return (
    <div className="group flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-gradient-to-r from-white to-stone-50/50 p-4 hover:bg-white hover:shadow-md hover:border-stone-300 transition-all duration-200 hover:-translate-y-0.5">
      {/* Product Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {product.primaryImage ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 shadow-sm hover:shadow-md transition-shadow">
            <img
              src={product.primaryImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-gradient-to-br from-stone-100 to-stone-50">
            <Package className="h-6 w-6 text-stone-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-stone-900">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-stone-500 font-mono bg-stone-50 px-2 py-0.5 rounded">
              {product.sku || "No SKU"}
            </p>
            <span className="text-xs text-stone-400">•</span>
            <p className="text-xs text-stone-600">{product.category}</p>
          </div>
        </div>
      </div>

      {/* Price with Sale Indicator */}
      <div className="text-right shrink-0">
        {hasSalePrice ? (
          <>
            <p className="text-xs text-stone-500 line-through">
              {formatCurrency(product.price || 0)}
            </p>
            <p className="text-sm font-bold text-emerald-600">
              {formatCurrency(salePrice || 0)}
            </p>
            <Badge className="mt-1 bg-red-50 text-red-700 border-red-200 text-xs font-bold">
              {product.discountPercent}% OFF
            </Badge>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-stone-900">
              {formatCurrency(product.price || 0)}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">Price</p>
          </>
        )}
      </div>

      {/* Stock Status with Visual Indicator */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-stone-900">{product.stock}</p>
        {isOutOfStock ? (
          <Badge className="mt-1 bg-red-50 text-red-700 border-red-200 text-xs font-bold animate-pulse">
            🔴 Out of Stock
          </Badge>
        ) : isLowStock ? (
          <Badge className="mt-1 bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold">
            ⚠️ Low Stock
          </Badge>
        ) : (
          <Badge className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold">
            ✓ In Stock
          </Badge>
        )}
      </div>

      {/* Status Badge with Icon */}
      <div className="shrink-0">
        <Badge
          variant="outline"
          className={`${getStatusColor(product.status)} text-xs font-bold uppercase tracking-wider`}
        >
          {getStatusIcon(product.status)} {getStatusLabel(product.status)}
        </Badge>
      </div>

      {/* Actions - Hidden until hover */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          size="sm"
          variant="ghost"
          onClick={onPreview}
          className="h-8 w-8 rounded-lg p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-8 w-8 rounded-lg p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="Edit"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDuplicate}
          className="h-8 w-8 rounded-lg p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
          title="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onPublish}
          className={`h-8 w-8 rounded-lg p-0 transition-colors ${
            isPublished
              ? "hover:bg-amber-50 hover:text-amber-600"
              : "hover:bg-emerald-50 hover:text-emerald-600"
          }`}
          title={isPublished ? "Unpublish" : "Publish"}
        >
          {isPublished ? (
            <X className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-8 w-8 rounded-lg p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getStatusIcon(status?: string): string {
  return "";
}


export function VendorProductsContent({
  products: initialProducts,
}: VendorProductsContentProps) {
  // State Management
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.sku?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== "all") {
        if ((product.status || "draft") !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, statusFilter]);

  // Compute Stats
  const stats = useMemo(() => {
    return {
      total: products.length,
      published: products.filter((p) => p.status === "published").length,
      draft: products.filter((p) => p.status === "draft").length,
      outOfStock: products.filter((p) => p.stock <= 0).length,
      lowStock: products.filter(
        (p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 10)
      ).length,
      totalValue: products.reduce((sum, p) => sum + ((p.price || 0) * p.stock), 0),
    };
  }, [products]);

  // API Operations
  const createProduct = useCallback(
    async (data: ProductFormData) => {
      setIsSaving(true);
      try {
        const response = await fetch("/api/vendor/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            category: data.category,
            price: data.price,
            discountPercent: data.salePrice ? ((data.price - data.salePrice) / data.price) * 100 : 0,
            stock: data.stock,
            sku: data.sku,
            status: data.status,
            primaryImage: data.primaryImage,
            images: data.primaryImage ? [data.primaryImage] : [],
            lowStockThreshold: data.reorderThreshold || 10,
            tags: data.tags || [],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create product");
        }

        const newProduct = await response.json();
        toast.success("Product created successfully!");
        setDialogType(null);
        setProducts((prev) => [...prev, newProduct]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create product");
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const updateProduct = useCallback(
    async (data: ProductFormData) => {
      if (!selectedProduct) return;

      setIsSaving(true);
      try {
        const response = await fetch(`/api/vendor/products/${selectedProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            category: data.category,
            price: data.price,
            discountPercent: data.salePrice ? ((data.price - data.salePrice) / data.price) * 100 : 0,
            stock: data.stock,
            sku: data.sku,
            status: data.status,
            primaryImage: data.primaryImage,
            lowStockThreshold: data.reorderThreshold || 10,
            tags: data.tags || [],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update product");
        }

        const updatedProduct = await response.json();
        toast.success("Product updated successfully!");
        setDialogType(null);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id ? updatedProduct : p
          )
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update product");
      } finally {
        setIsSaving(false);
      }
    },
    [selectedProduct]
  );

  const deleteProduct = useCallback(async () => {
    if (!selectedProduct) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/vendor/products/${selectedProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      toast.success("Product deleted successfully!");
      setDialogType(null);
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedProduct]);

  const duplicateProduct = useCallback(async () => {
    if (!selectedProduct) return;

    const newProduct: ProductFormData = {
      name: `${selectedProduct.name} (Copy)`,
      description: selectedProduct.description,
      category: selectedProduct.category,
      price: selectedProduct.price || 0,
      stock: 0,
      sku: `${selectedProduct.sku}-copy-${Date.now()}`,
      status: "draft",
      primaryImage: selectedProduct.primaryImage || "",
      reorderThreshold: selectedProduct.lowStockThreshold || 10,
      tags: selectedProduct.tags || [],
    };

    await createProduct(newProduct);
    setDialogType(null);
  }, [selectedProduct, createProduct]);

  const publishToggle = useCallback(async () => {
    if (!selectedProduct) return;

    setIsSaving(true);
    try {
      const newStatus = selectedProduct.status === "published" ? "draft" : "published";
      const response = await fetch(`/api/vendor/products/${selectedProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product status");
      }

      toast.success(
        newStatus === "published" ? "Product published!" : "Product unpublished"
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, status: newStatus as "draft" | "published" | "archived" } : p
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsSaving(false);
    }
  }, [selectedProduct]);

  const handleSaveForm = (data: ProductFormData) => {
    if (dialogType === "add") {
      createProduct(data);
    } else if (dialogType === "edit") {
      updateProduct(data);
    }
  };

  const openAddDialog = () => {
    setSelectedProduct(null);
    setDialogType("add");
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setDialogType("edit");
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setDialogType("delete");
  };

  const openDuplicateAction = (product: Product) => {
    setSelectedProduct(product);
    duplicateProduct();
  };

  const openPreviewAction = (product: Product) => {
    setSelectedProduct(product);
    setDialogType("preview");
  };

  const openPublishAction = (product: Product) => {
    setSelectedProduct(product);
    publishToggle();
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-6 text-white shadow-lg border border-stone-700">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Products</h1>
            <p className="mt-2 text-sm text-stone-300">
              Manage your store&apos;s product catalog with full CRUD operations
            </p>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-11 rounded-xl w-full md:w-auto shadow-lg font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards with Maximalist Design */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total"
          value={stats.total}
          icon={BarChart3}
          color="from-blue-50 to-blue-100"
          textColor="text-blue-700"
          borderColor="border-blue-200"
        />
        <StatCard
          label="Published"
          value={stats.published}
          icon={TrendingUp}
          color="from-emerald-50 to-emerald-100"
          textColor="text-emerald-700"
          borderColor="border-emerald-200"
        />
        <StatCard
          label="Draft"
          value={stats.draft}
          icon={FileText}
          color="from-amber-50 to-amber-100"
          textColor="text-amber-700"
          borderColor="border-amber-200"
        />
        <StatCard
          label="Out of Stock"
          value={stats.outOfStock}
          icon={AlertCircle}
          color="from-red-50 to-red-100"
          textColor="text-red-700"
          borderColor="border-red-200"
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStock}
          icon={AlertCircle}
          color="from-yellow-50 to-yellow-100"
          textColor="text-yellow-700"
          borderColor="border-yellow-200"
        />
        <StatCard
          label="Inventory Value"
          value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
          icon={Wallet}
          color="from-purple-50 to-purple-100"
          textColor="text-purple-700"
          borderColor="border-purple-200"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              placeholder="🔍 Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-lg border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-stone-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[140px] rounded-lg border-stone-200 focus:ring-1 focus:ring-stone-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">🚀 Published</SelectItem>
                <SelectItem value="draft">📝 Draft</SelectItem>
                <SelectItem value="archived">📦 Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-xs text-stone-600">
          Showing <span className="font-bold text-stone-900">{filteredProducts.length}</span> of <span className="font-bold text-stone-900">{products.length}</span> products
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-gradient-to-br from-stone-50 to-stone-100 p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-stone-300 mb-3" />
            <p className="text-sm font-semibold text-stone-600">No products found</p>
            <p className="text-xs text-stone-500 mt-1">
              {products.length === 0
                ? "Create your first product to get started"
                : "No products match your current filters"}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              onEdit={() => openEditDialog(product)}
              onDelete={() => openDeleteDialog(product)}
              onDuplicate={() => openDuplicateAction(product)}
              onPublish={() => openPublishAction(product)}
              onPreview={() => openPreviewAction(product)}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <ProductFormDialog
        open={dialogType === "add" || dialogType === "edit"}
        product={dialogType === "edit" ? selectedProduct : null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogType(null);
            setSelectedProduct(null);
          }
        }}
        onSave={handleSaveForm}
        isSaving={isSaving}
      />

      <DeleteConfirmDialog
        open={dialogType === "delete"}
        product={selectedProduct}
        onOpenChange={(open) => {
          if (!open) {
            setDialogType(null);
            setSelectedProduct(null);
          }
        }}
        onConfirm={deleteProduct}
        isDeleting={isDeleting}
      />
    </div>
  );
}

// Helper component for stat cards with maximalist styling
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  textColor,
  borderColor,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<any>;
  color: string;
  textColor: string;
  borderColor: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} rounded-xl border ${borderColor} p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="mb-2">
        <Icon className={`h-5 w-5 ${textColor}`} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
