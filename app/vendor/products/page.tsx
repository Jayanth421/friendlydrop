import { requireVendorOrAdmin } from "@/lib/auth/session";
import { getProducts } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";
import { VendorProductsContent } from "@/components/vendor/vendor-products-content";

export default async function VendorProductsPage() {
  const user = await requireVendorOrAdmin();

  const isInternalAdmin = isAdminRole(user.role);
  const products = await getProducts(isInternalAdmin ? undefined : { vendorId: user.uid });
  const vendorProducts = isInternalAdmin
    ? products.filter((product) => product.vendorId || product.status !== "archived")
    : products;

  return <VendorProductsContent products={vendorProducts} />;
}

