import { requireAdminPermission } from "@/lib/auth/session";
import { getProducts } from "@/lib/firebase/firestore";
import { getCatalogCategories } from "@/lib/enterprise";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  Layers,
  Tag,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function ProductsDashboardPage() {
  await requireAdminPermission("products:manage");
  const [products, categories] = await Promise.all([getProducts(), getCatalogCategories()]);

  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => (p.status ?? "published") === "published").length;
  const draftProducts = products.filter((p) => p.status === "draft").length;
  const outOfStockProducts = products.filter((p) => p.stock <= 0).length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const categoryCount = categories.length;
  const brandCount = new Set(products.map((p) => p.brand).filter(Boolean)).size;
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  const kpis = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Published", value: publishedProducts, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "Draft", value: draftProducts, icon: FileEdit, color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Out of Stock", value: outOfStockProducts, icon: AlertTriangle, color: "bg-rose-50 text-rose-700 border-rose-200" },
    { label: "Categories", value: categoryCount, icon: Layers, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { label: "Brands", value: brandCount, icon: Tag, color: "bg-violet-50 text-violet-700 border-violet-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Product Management</h1>
          <p className="mt-1 text-sm text-stone-500">Overview of your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            Create Product
          </Link>
          <Link
            href="/admin/products/all"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className={`border ${kpi.color}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs font-medium opacity-70">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inventory Value */}
      <Card className="border-stone-200">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500">Total Inventory Value</p>
            <p className="text-2xl font-bold text-stone-900">{formatCurrency(totalInventoryValue)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Products */}
        <Card className="border-stone-200 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Products</CardTitle>
            <Link href="/admin/products/all" className="text-xs font-medium text-stone-500 hover:text-stone-900 transition">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.primaryImage ? (
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
                            <img src={product.primaryImage} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-100 bg-stone-50">
                            <Package className="h-4 w-4 text-stone-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-stone-900">{product.name}</p>
                          <p className="text-xs text-stone-500">{product.sku ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${product.stock <= 0 ? "text-rose-600" : product.stock <= 10 ? "text-amber-600" : "text-stone-700"}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize text-xs ${
                          (product.status ?? "published") === "published"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : product.status === "draft"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-stone-200 bg-stone-50 text-stone-700"
                        }`}
                      >
                        {product.status ?? "published"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-stone-500">{formatDate(product.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-stone-500">All products have healthy stock levels.</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">{product.name}</p>
                      <p className="text-xs text-stone-500">{product.sku ?? "No SKU"}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-amber-300 bg-amber-100 text-amber-800 font-bold">
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 10 && (
                  <Link href="/admin/inventory" className="block text-center text-xs font-medium text-stone-500 hover:text-stone-900 transition">
                    +{lowStockProducts.length - 10} more →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
