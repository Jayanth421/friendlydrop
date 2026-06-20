import { requireAdminPermission } from "@/lib/auth/session";
import { getProducts } from "@/lib/firebase/firestore";
import { ProductsDataTable } from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AllProductsPage() {
  await requireAdminPermission("products:manage");
  const products = await getProducts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">All Products</h1>
          <p className="mt-1 text-sm text-stone-500">Manage, filter, import/export, and perform bulk operations on your product catalog.</p>
        </div>
        <div>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
          >
            <Plus className="h-4 w-4" />
            Create Product
          </Link>
        </div>
      </div>

      {/* Main Table Container */}
      <Card className="border-stone-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-stone-900">Product Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsDataTable data={products} />
        </CardContent>
      </Card>
    </div>
  );
}
