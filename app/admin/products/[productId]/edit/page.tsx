import { requireAdminPermission } from "@/lib/auth/session";
import { getProductById } from "@/lib/firebase/firestore";
import { ProductForm } from "@/components/admin/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

interface EditProductPageProps {
  params: {
    productId: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  await requireAdminPermission("products:manage");
  
  const product = await getProductById(params.productId);
  if (!product) {
    notFound();
  }

  // Map database Product into format matching ProductFormValues (cast string enum fields if needed)
  const formValues = {
    ...product,
    status: product.status as "draft" | "published" | "archived" | undefined,
    visibility: product.visibility as "public" | "private" | undefined,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button and title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Link
            href="/admin/products/all"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-900 transition w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all products
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Edit Product</h1>
            <p className="text-sm text-stone-500 mt-0.5">Modify properties, prices, variants, images, and SEO configuration.</p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <a
            href={`/products/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            View Live Store Page
            <ExternalLink className="h-4 w-4 text-stone-500" />
          </a>
        </div>
      </div>

      {/* Main Form container */}
      <Card className="border-stone-200">
        <CardContent className="p-6">
          <ProductForm defaultValues={formValues} />
        </CardContent>
      </Card>
    </div>
  );
}
