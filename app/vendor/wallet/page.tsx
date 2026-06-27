import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorWalletContent } from "@/components/vendor/vendor-wallet-content";

import { getVendorPayouts, getVendorOrders } from "@/lib/firebase/vendor";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function VendorWalletPage() {
  const user = await requireVendorOrAdmin();
  const isInternalAdmin = isAdminRole(user.role);
  
  let payouts = [];
  let orders = [];
  
  if (!isInternalAdmin) {
    payouts = await getVendorPayouts(user.uid);
    const data = await getVendorOrders(user.uid);
    orders = data.vendorOrders;
  }

  return <VendorWalletContent initialPayouts={payouts} initialOrders={orders} />;
}
