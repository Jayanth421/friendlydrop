import { ProductForm } from "@/components/admin/product-form";
import { ProductDeleteButton } from "@/components/admin/product-delete-button";
import { BulkProductUploader } from "@/components/admin/bulk-product-uploader";
import { QikinkImporter } from "@/components/admin/qikink-importer";
import { requireAdminPermission } from "@/lib/auth/session";
import { getProducts } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default async function AdminProductsPage({ searchParams }: { searchParams: { edit?: string } }) {
  await requireAdminPermission("products:manage");
  const products = await getProducts();
  const editingProduct = searchParams.edit ? products.find((product) => product.id === searchParams.edit) : undefined;

  return (
    <div className="space-y-4">
      <ProductForm
        defaultValues={editingProduct ? {
          id: editingProduct.id,
          name: editingProduct.name,
          description: editingProduct.description,
          price: editingProduct.price,
          images: editingProduct.images,
          category: editingProduct.category,
          subcategory: editingProduct.subcategory,
          stock: editingProduct.stock,
          sku: editingProduct.sku,
          featured: editingProduct.featured,
          popularity: editingProduct.popularity,
          tags: editingProduct.tags,
          status: editingProduct.status,
          visibility: editingProduct.visibility,
          seo: editingProduct.seo,
        } : undefined}
      />

      <QikinkImporter />

      <BulkProductUploader initialProducts={products} />

      <Card>
        <CardHeader><CardTitle>Catalog</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sku ?? "-"}</TableCell>
                  <TableCell>{product.status ?? "published"}</TableCell>
                  <TableCell>{product.visibility ?? "public"}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <a href={`/admin/products?edit=${product.id}`} className="rounded border border-slate-200 px-2 py-1 text-xs">Edit</a>
                      <ProductDeleteButton productId={product.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
