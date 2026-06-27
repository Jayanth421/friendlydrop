import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorShippingContent } from "@/components/vendor/vendor-shipping-content";

import { getUserById } from "@/lib/firebase/firestore";
import { isAdminRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function VendorShippingPage() {
  const user = await requireVendorOrAdmin();
  const profile = await getUserById(user.uid);
  return <VendorShippingContent vendorProfile={profile} />;
}
