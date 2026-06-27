"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Tag,
  Search,
  FolderPlus,
  Plus,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  Boxes,
  ArrowRight,
  Layers,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  brand?: string;
  category: string;
}

export default function BrandManagementPage() {
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Create Brand / Rename states
  const [newBrandName, setNewBrandName] = React.useState("");
  const [assigningProductId, setAssigningProductId] = React.useState("");
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Rename brand modal state
  const [renamingBrand, setRenamingBrand] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");

  const fetchProductsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        toast.error("Failed to load catalog products");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProductsData();
  }, []);

  // Compute Brand Statistics from products catalog
  const brandStats = React.useMemo(() => {
    const statsMap = new Map<
      string,
      {
        name: string;
        productCount: number;
        totalStock: number;
        avgPrice: number;
        categories: Set<string>;
        topProduct: { name: string; price: number } | null;
        productIds: string[];
      }
    >();

    products.forEach((p) => {
      const brandName = p.brand?.trim() || "Unbranded";
      if (!statsMap.has(brandName)) {
        statsMap.set(brandName, {
          name: brandName,
          productCount: 0,
          totalStock: 0,
          avgPrice: 0,
          categories: new Set<string>(),
          topProduct: null,
          productIds: [],
        });
      }

      const info = statsMap.get(brandName)!;
      info.productCount += 1;
      info.totalStock += p.stock || 0;
      info.avgPrice += p.price || 0;
      info.categories.add(p.category);
      info.productIds.push(p.id);

      if (!info.topProduct || p.price > info.topProduct.price) {
        info.topProduct = { name: p.name, price: p.price };
      }
    });

    // Compute averages and format
    const list = Array.from(statsMap.values()).map((info) => ({
      ...info,
      avgPrice: info.productCount > 0 ? Math.round(info.avgPrice / info.productCount) : 0,
      categoriesCount: info.categories.size,
    }));

    // Sort by product count descending
    list.sort((a, b) => b.productCount - a.productCount);
    return list;
  }, [products]);

  const filteredBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return brandStats;
    const q = searchQuery.toLowerCase();
    return brandStats.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandStats, searchQuery]);

  // Rename brand trigger
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingBrand || !renameValue.trim()) return;

    const brandData = brandStats.find((b) => b.name === renamingBrand);
    if (!brandData) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: brandData.productIds,
          updates: { brand: renameValue.trim() },
        }),
      });

      if (res.ok) {
        toast.success(`Successfully renamed brand to "${renameValue.trim()}"`);
        setRenamingBrand(null);
        setRenameValue("");
        fetchProductsData();
      } else {
        toast.error("Failed to rename brand in products catalog");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // Add product to brand
  const handleAddProductToBrand = async (brandName: string, productId: string) => {
    if (!productId || !brandName) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandName }),
      });

      if (res.ok) {
        toast.success("Assigned product to brand");
        setAssigningProductId("");
        fetchProductsData();
      } else {
        toast.error("Failed to assign product");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // Create new brand by creating/assigning a product
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !assigningProductId) return;

    await handleAddProductToBrand(newBrandName.trim(), assigningProductId);
    setNewBrandName("");
  };

  // Delete Brand (reverts to unbranded)
  const handleDeleteBrand = async (brandName: string) => {
    if (brandName === "Unbranded") return;
    if (!confirm(`Are you sure you want to clear brand name for all products under "${brandName}"?`)) return;

    const brandData = brandStats.find((b) => b.name === brandName);
    if (!brandData) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: brandData.productIds,
          updates: { brand: "" },
        }),
      });

      if (res.ok) {
        toast.success(`Removed brand tag "${brandName}" from products`);
        fetchProductsData();
      } else {
        toast.error("Failed to clear brand");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Brand Management</h1>
        <p className="mt-1 text-sm text-stone-500">Monitor active brands in your store catalog, check their inventory count, and rename or organize catalog assignments.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-stone-600" />
          <p className="text-sm font-medium text-stone-500">Scanning products catalog...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Creator form */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-stone-500" />
                  Define New Brand
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBrand} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Brand Name *</label>
                    <Input
                      placeholder="e.g. Polaroid"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      required
                      className="rounded-xl border-stone-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Assign Primary Product *</label>
                    <select
                      value={assigningProductId}
                      onChange={(e) => setAssigningProductId(e.target.value)}
                      required
                      className="w-full h-11 rounded-xl border border-stone-200 px-3 text-sm focus:border-stone-400 bg-white"
                    >
                      <option value="">Select a product to assign</option>
                      {products
                        .filter((p) => !p.brand) // only list unbranded
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-stone-400">To create a brand, you must assign at least one catalog product to it.</p>
                  </div>

                  <Button
                    disabled={isUpdating || !newBrandName || !assigningProductId}
                    type="submit"
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 font-bold shadow-sm"
                  >
                    {isUpdating ? "Saving..." : "Create Brand Tag"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Brands table list */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold text-stone-900">Active Brands Tagged</CardTitle>
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <Input
                    placeholder="Search brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 rounded-lg border-stone-200 focus:border-stone-400"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-stone-50 border-b border-stone-150">
                    <TableRow>
                      <TableHead className="text-stone-600 font-semibold h-10 text-xs uppercase pl-6">Brand Name</TableHead>
                      <TableHead className="text-stone-600 font-semibold h-10 text-xs uppercase">Products</TableHead>
                      <TableHead className="text-stone-600 font-semibold h-10 text-xs uppercase">Avg Price</TableHead>
                      <TableHead className="text-stone-600 font-semibold h-10 text-xs uppercase">Total Stock</TableHead>
                      <TableHead className="text-stone-600 font-semibold h-10 text-xs uppercase">Top Selling Product</TableHead>
                      <TableHead className="w-16 text-right pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.name} className="hover:bg-stone-50/50 transition">
                        <TableCell className="font-semibold text-stone-900 pl-6 text-sm">
                          {brand.name}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-stone-600">
                          {brand.productCount} item(s)
                        </TableCell>
                        <TableCell className="text-xs font-medium text-stone-850">
                          {formatCurrency(brand.avgPrice)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={`font-semibold ${brand.totalStock <= 5 ? "text-rose-600" : "text-stone-700"}`}>
                            {brand.totalStock} units
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-stone-500 truncate max-w-[150px]" title={brand.topProduct?.name}>
                          {brand.topProduct ? brand.topProduct.name : "—"}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-2">
                          <div className="flex justify-end gap-1">
                            {brand.name !== "Unbranded" && (
                              <>
                                <button
                                  onClick={() => {
                                    setRenamingBrand(brand.name);
                                    setRenameValue(brand.name);
                                  }}
                                  className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition"
                                  title="Rename brand tag"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBrand(brand.name)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                                  title="Delete brand tag"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Rename Brand Modal */}
      {renamingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Rename Brand Tag</h3>
                <p className="text-xs text-stone-500 mt-0.5">Renames &quot;{renamingBrand}&quot; across all matching products.</p>
              </div>
              <button
                onClick={() => setRenamingBrand(null)}
                className="rounded-full p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">New Brand Name</label>
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  required
                  className="rounded-xl border-stone-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setRenamingBrand(null)}
                  disabled={isUpdating}
                  className="rounded-xl border-stone-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || !renameValue.trim() || renameValue === renamingBrand}
                  className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-5 font-bold shadow-sm"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
