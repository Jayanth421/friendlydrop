import { requireAdminPermission } from "@/lib/auth/session";
import { getProducts, getUploadsForAdmin } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminMediaPage() {
  await requireAdminPermission("products:manage");
  const [products, uploads] = await Promise.all([getProducts(), getUploadsForAdmin()]);

  const productImages = products.reduce((count, product) => count + product.images.length, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Total product images: {productImages}</p>
        <p>Total custom uploads: {uploads.length}</p>
        <p>Estimated media files: {productImages + uploads.length}</p>
      </CardContent>
    </Card>
  );
}

