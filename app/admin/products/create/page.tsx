import { requireAdminPermission } from "@/lib/auth/session";
import { ProductForm } from "@/components/admin/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CreateProductPage() {
  await requireAdminPermission("products:manage");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button and title */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/products/all"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-900 transition w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all products
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Create New Product</h1>
          <p className="text-sm text-stone-500 mt-0.5">Fill in the fields across tabs to configure your new product.</p>
        </div>
      </div>

      {/* Main Form container */}
      <Card className="border-stone-200">
        <CardContent className="p-6">
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  );
}
