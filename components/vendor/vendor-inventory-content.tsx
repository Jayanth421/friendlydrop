"use client";

import { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  Search,
  Edit2,
  Check,
  X,
  RefreshCw,
  TrendingDown,
  Archive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Product } from "@/types";

type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  status: StockStatus;
  image?: string;
}



function statusBadge(status: StockStatus) {
  switch (status) {
    case "in_stock": return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">In Stock</Badge>;
    case "low_stock": return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">Low Stock</Badge>;
    case "out_of_stock": return <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">Out of Stock</Badge>;
  }
}

function getStatus(stock: number, threshold: number): StockStatus {
  if (stock === 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
}

export function VendorInventoryContent({ initialProducts }: { initialProducts: Product[] }) {
  const [items, setItems] = useState<InventoryItem[]>(
    initialProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || "N/A",
      category: p.category || "Uncategorized",
      price: p.price,
      stock: p.stock,
      threshold: p.lowStockThreshold || 10,
      status: getStatus(p.stock, p.lowStockThreshold || 10),
      image: p.primaryImage || p.images?.[0]
    }))
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | StockStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || item.status === filter;
    return matchSearch && matchFilter;
  });

  const totalValue = items.reduce((sum, i) => sum + i.price * i.stock, 0);
  const lowStockCount = items.filter((i) => i.status === "low_stock").length;
  const outOfStockCount = items.filter((i) => i.status === "out_of_stock").length;

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditStock(item.stock);
  }

  async function saveStock(item: InventoryItem) {
    setSaving(true);
    try {
      await fetch(`/api/vendor/products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: editStock }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, stock: editStock, status: getStatus(editStock, i.threshold) }
            : i
        )
      );
      toast.success("Stock updated");
    } catch {
      toast.error("Failed to update stock");
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-stone-900">Inventory</h1>
        <p className="mt-0.5 text-sm text-stone-500">Monitor and update your product stock levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-stone-50">
              <Package className="h-5 w-5 text-stone-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Inventory Value</p>
              <p className="text-xl font-bold text-stone-900">₹{totalValue.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-white">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Low Stock</p>
              <p className="text-xl font-bold text-amber-900">{lowStockCount} products</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 bg-white">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-700">Out of Stock</p>
              <p className="text-xl font-bold text-red-900">{outOfStockCount} products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-stone-200"
            placeholder="Search products or SKU..."
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
          {(["all", "in_stock", "low_stock", "out_of_stock"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {f === "all" ? "All" : f === "in_stock" ? "In Stock" : f === "low_stock" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Product</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">SKU</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Category</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Price</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Stock</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50 transition">
                <td className="px-4 py-3 font-medium text-stone-900">{item.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{item.sku}</td>
                <td className="px-4 py-3 text-stone-600">{item.category}</td>
                <td className="px-4 py-3 font-semibold text-stone-900">₹{item.price}</td>
                <td className="px-4 py-3">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={editStock}
                        onChange={(e) => setEditStock(Number(e.target.value))}
                        className="w-20 rounded-lg border border-stone-300 px-2 py-1 text-sm focus:border-stone-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveStock(item)}
                        disabled={saving}
                        className="rounded-lg border border-emerald-600 bg-emerald-600 p-1 text-white hover:bg-emerald-700 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-stone-200 bg-white p-1 text-stone-600 hover:bg-stone-100 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className={`font-semibold ${item.stock === 0 ? "text-red-600" : item.stock <= item.threshold ? "text-amber-600" : "text-stone-900"}`}>
                      {item.stock}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{statusBadge(item.status)}</td>
                <td className="px-4 py-3">
                  {editingId !== item.id && (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition"
                    >
                      <Edit2 className="h-3 w-3" />
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-stone-400">
                  <Archive className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
