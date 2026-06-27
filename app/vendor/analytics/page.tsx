import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorAnalyticsContent } from "@/components/vendor/vendor-analytics-content";

import { getVendorOrders } from "@/lib/firebase/vendor";
import { isAdminRole } from "@/lib/rbac";
import { getAllOrders, getProducts } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export default async function VendorAnalyticsPage() {
  const user = await requireVendorOrAdmin();
  const isInternalAdmin = isAdminRole(user.role);
  
  let orders = [];
  let products = [];
  
  if (isInternalAdmin) {
    orders = await getAllOrders();
    products = await getProducts();
  } else {
    const data = await getVendorOrders(user.uid);
    orders = data.vendorOrders;
    products = data.vendorProducts;
  }

  return <VendorAnalyticsContent initialOrders={orders} vendorProducts={products} />;
}
