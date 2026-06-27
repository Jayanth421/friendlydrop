"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Loader2,
  Package,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface InventoryTableProps {
  products: Product[];
}

// Sub-component for individual rows to isolate editing states & avoid table-wide lag
function InventoryRow({
  product,
  onSaveSuccess,
}: {
  product: Product;
  onSaveSuccess: () => void;
}) {
  const [stock, setStock] = React.useState(product.stock);
  const [threshold, setThreshold] = React.useState(product.lowStockThreshold ?? 10);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Sync state if product changes from outside
  React.useEffect(() => {
    setStock(product.stock);
    setThreshold(product.lowStockThreshold ?? 10);
    setHasChanges(false);
  }, [product]);

  const handleStockChange = (val: number) => {
    setStock(Math.max(0, val));
    setHasChanges(true);
  };

  const handleThresholdChange = (val: number) => {
    setThreshold(Math.max(0, val));
    setHasChanges(true);
  };

  const saveRow = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: Number(stock),
          lowStockThreshold: Number(threshold),
        }),
      });

      if (res.ok) {
        toast.success(`Updated stock for ${product.name}`);
        setHasChanges(false);
        onSaveSuccess();
      } else {
        toast.error("Failed to update stock");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const isLowStock = stock <= threshold;
  const isOutOfStock = stock <= 0;

  return (
    <TableRow className="hover:bg-stone-50/50 transition border-b border-stone-150">
      {/* Product column */}
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          {product.primaryImage ? (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-stone-150 bg-stone-50">
              <img src={product.primaryImage} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-150 bg-stone-50">
              <Package className="h-4.5 w-4.5 text-stone-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{product.name}</p>
            <p className="text-xs text-stone-500 font-mono">{product.category}</p>
          </div>
        </div>
      </TableCell>

      {/* SKU column */}
      <TableCell className="font-mono text-xs text-stone-600">
        {product.sku || "—"}
      </TableCell>

      {/* Inline Stock adjustment */}
      <TableCell>
        <div className="flex items-center gap-1.5 max-w-[150px]">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleStockChange(stock - 1)}
            disabled={isSaving}
            className="h-8 w-8 rounded-lg shrink-0 border-stone-200"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Input
            type="number"
            value={stock}
            onChange={(e) => handleStockChange(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === "Enter" && saveRow()}
            onBlur={saveRow}
            disabled={isSaving}
            className="h-8 w-16 text-center rounded-lg border-stone-200 focus:border-stone-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleStockChange(stock + 1)}
            disabled={isSaving}
            className="h-8 w-8 rounded-lg shrink-0 border-stone-200"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>

      {/* Inline Low Stock Threshold adjustment */}
      <TableCell>
        <Input
          type="number"
          value={threshold}
          onChange={(e) => handleThresholdChange(parseInt(e.target.value) || 0)}
          onKeyDown={(e) => e.key === "Enter" && saveRow()}
          onBlur={saveRow}
          disabled={isSaving}
          className="h-8 w-16 text-center rounded-lg border-stone-200 focus:border-stone-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium text-sm"
        />
      </TableCell>

      {/* Status Indicators */}
      <TableCell>
        {isOutOfStock ? (
          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-bold uppercase text-[10px]">
            Out of Stock
          </Badge>
        ) : isLowStock ? (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-bold uppercase text-[10px]">
            Low Stock
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-bold uppercase text-[10px]">
            Healthy
          </Badge>
        )}
      </TableCell>

      {/* Inline saving status indicator */}
      <TableCell className="w-16 text-right">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-stone-500 inline" />
        ) : hasChanges ? (
          <Button
            size="sm"
            onClick={saveRow}
            className="h-7 px-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs"
          >
            Save
          </Button>
        ) : (
          <Check className="h-4 w-4 text-emerald-500 inline opacity-0 group-hover:opacity-100 transition" />
        )}
      </TableCell>
    </TableRow>
  );
}

export function InventoryTable({ products }: InventoryTableProps) {
  const router = useRouter();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [stockLevelFilter, setStockLevelFilter] = React.useState<string>("all");

  // Bulk Operations State
  const [bulkStockVal, setBulkStockVal] = React.useState("");
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Record<string, boolean>>({});

  // Filter products locally for instantaneous speed
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesSku = product.sku?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku) return false;
      }

      // Status Filter
      if (statusFilter !== "all") {
        if ((product.status ?? "published") !== statusFilter) return false;
      }

      // Stock level Filter
      if (stockLevelFilter !== "all") {
        const stock = product.stock ?? 0;
        const threshold = product.lowStockThreshold ?? 10;
        if (stockLevelFilter === "out" && stock > 0) return false;
        if (stockLevelFilter === "low" && (stock <= 0 || stock > threshold)) return false;
        if (stockLevelFilter === "healthy" && stock <= threshold) return false;
      }

      return true;
    });
  }, [products, searchQuery, statusFilter, stockLevelFilter]);

  const selectedCount = Object.keys(selectedIds).filter((k) => selectedIds[k]).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids: Record<string, boolean> = {};
      filteredProducts.forEach((p) => {
        ids[p.id] = true;
      });
      setSelectedIds(ids);
    } else {
      setSelectedIds({});
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: checked,
    }));
  };

  const handleBulkUpdate = async (type: "set" | "add" | "subtract") => {
    const ids = Object.keys(selectedIds).filter((k) => selectedIds[k]);
    if (!ids.length) return;
    const valueNum = Number(bulkStockVal);
    if (isNaN(valueNum)) {
      toast.error("Please enter a valid numeric stock value");
      return;
    }

    setIsBulkUpdating(true);
    try {
      // Since stock updates logic depends on current values, we update items
      // We can patch bulk using our batch update API!
      // If setting directly:
      let updates: any = {};
      if (type === "set") {
        updates = { stock: valueNum };
      }

      // If incrementing/decrementing, we fetch the current values and push updates.
      // Wait, since we are doing it on client-side, we can map over target products, compute new values,
      // and send a PATCH to `/api/admin/products/bulk` containing `{ ids, updates: { stock: ... } }` if it's set directly.
      // If it's increment/decrement: we can send requests or execute updates individually in a loop,
      // or patch multiple products by sending distinct batch records. Wait! Since our PATCH `/api/admin/products/bulk`
      // applies the SAME updates object to ALL IDs, setting stock to a absolute value fits perfectly.
      // For incrementing, let's run individual parallel fetch requests, or update them. Since it's quick and reliable,
      // we can update them in client code.
      if (type === "set") {
        const res = await fetch("/api/admin/products/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, updates }),
        });
        if (res.ok) {
          toast.success(`Bulk updated stock for ${ids.length} products to ${valueNum}`);
          setSelectedIds({});
          setBulkStockVal("");
          router.refresh();
        } else {
          toast.error("Failed to batch update stock levels");
        }
      } else {
        // Increment or Decrement: loop through selected products and save
        const promises = ids.map(async (id) => {
          const prod = products.find((p) => p.id === id);
          if (!prod) return;
          const currentStock = prod.stock ?? 0;
          const newStock = type === "add" ? currentStock + valueNum : Math.max(0, currentStock - valueNum);
          return fetch(`/api/admin/products/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stock: newStock }),
          });
        });

        await Promise.all(promises);
        toast.success(`Adjusted stock for ${ids.length} products`);
        setSelectedIds({});
        setBulkStockVal("");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during bulk stock adjustments");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const stats = React.useMemo(() => {
    const outCount = products.filter((p) => p.stock <= 0).length;
    const lowCount = products.filter((p) => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 10)).length;
    const totalInventoryCount = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);

    return {
      outCount,
      lowCount,
      totalInventoryCount,
    };
  }, [products]);

  return (
    <div className="space-y-6">
      {/* KPI Cards for Inventory */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-stone-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.totalInventoryCount}</p>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Items in Stock</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.outCount}</p>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Out of Stock Alerts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{stats.lowCount}</p>
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Low Stock Warnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filtering Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-stone-200 focus:border-stone-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:inline">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-stone-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:inline">Stock Level:</span>
            <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
              <SelectTrigger className="h-10 w-[150px] rounded-xl border-stone-200">
                <SelectValue placeholder="All Stock Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="healthy">Healthy Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900 text-white px-5 py-3.5 rounded-xl shadow-lg border border-stone-850 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-stone-950">
              {selectedCount}
            </div>
            <span className="text-sm font-medium text-stone-200">products selected for adjustment</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Stock value"
              value={bulkStockVal}
              onChange={(e) => setBulkStockVal(e.target.value)}
              className="h-9 w-28 bg-stone-800 border-stone-700 text-white rounded-lg placeholder:text-stone-500 text-xs font-semibold"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkUpdate("set")}
              disabled={isBulkUpdating || !bulkStockVal}
              className="rounded-lg h-9 text-xs font-semibold bg-white hover:bg-stone-100 text-stone-900 border-none px-3.5"
            >
              Set Stock
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkUpdate("add")}
              disabled={isBulkUpdating || !bulkStockVal}
              className="text-white hover:bg-stone-800 rounded-lg h-9 text-xs font-semibold px-3.5 border border-stone-700"
            >
              + Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkUpdate("subtract")}
              disabled={isBulkUpdating || !bulkStockVal}
              className="text-white hover:bg-stone-800 rounded-lg h-9 text-xs font-semibold px-3.5 border border-stone-700"
            >
              - Subtract
            </Button>
          </div>
        </div>
      )}

      {/* Inventory Catalog Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-stone-50/70 border-b border-stone-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 py-3 pl-4">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedCount === filteredProducts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Product</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">SKU</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Current Stock</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Low Stock Threshold</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Stock Status</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-stone-500 font-medium">
                    No products found matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <React.Fragment key={product.id}>
                    <TableRow className="hover:bg-transparent border-b border-stone-150">
                      <TableCell className="py-3 pl-4">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedIds[product.id])}
                          onChange={(e) => handleSelectRow(product.id, e.target.checked)}
                          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                        />
                      </TableCell>
                      {/* We use a subcomponent row to insulate editing states and avoid sluggish full renders */}
                      <InventoryRow
                        product={product}
                        onSaveSuccess={() => router.refresh()}
                      />
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
