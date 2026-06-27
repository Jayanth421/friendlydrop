import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorOrdersContent } from "@/components/vendor/vendor-orders-content";

import { getVendorOrders } from "@/lib/firebase/vendor";
import { isAdminRole } from "@/lib/rbac";
import { getAllOrders, getProducts } from "@/lib/firebase/firestore";

export default async function VendorOrdersPage() {
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

  return <VendorOrdersContent initialOrders={orders} vendorProducts={products} />;
}

