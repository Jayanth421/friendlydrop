import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorCustomersContent } from "@/components/vendor/vendor-customers-content";

import { getVendorCustomers } from "@/lib/firebase/vendor";
import { isAdminRole } from "@/lib/rbac";
import { getAllUsers } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export default async function VendorCustomersPage() {
  const user = await requireVendorOrAdmin();
  const isInternalAdmin = isAdminRole(user.role);
  
  let customers = [];
  if (isInternalAdmin) {
    customers = await getAllUsers();
  } else {
    customers = await getVendorCustomers(user.uid);
  }

  return <VendorCustomersContent initialCustomers={customers} />;
}
