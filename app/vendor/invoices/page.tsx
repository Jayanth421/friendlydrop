import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorInvoicesContent } from "@/components/vendor/vendor-invoices-content";

export const dynamic = "force-dynamic";

import { getVendorOrders } from "@/lib/firebase/vendor";
import { isAdminRole } from "@/lib/rbac";
import { getAllOrders, getProducts } from "@/lib/firebase/firestore";


export default async function VendorInvoicesPage() {
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

  return <VendorInvoicesContent initialOrders={orders} vendorProducts={products} />;
}
