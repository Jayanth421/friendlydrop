import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorInventoryContent } from "@/components/vendor/vendor-inventory-content";

import { getProducts } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function VendorInventoryPage() {
  const user = await requireVendorOrAdmin();
  const isInternalAdmin = isAdminRole(user.role);
  const products = await getProducts(isInternalAdmin ? undefined : { vendorId: user.uid });
  const vendorProducts = isInternalAdmin
    ? products.filter((product) => product.vendorId || product.status !== "archived")
    : products;

  return <VendorInventoryContent initialProducts={vendorProducts} />;
}
