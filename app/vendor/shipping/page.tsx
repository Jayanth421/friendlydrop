import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorShippingContent } from "@/components/vendor/vendor-shipping-content";
import { VendorProfile } from "@/types";

import { getUserById } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export default async function VendorShippingPage() {
  const user = await requireVendorOrAdmin();
  const profile = await getUserById(user.uid);
  // Cast UserProfile to VendorProfile for shipping settings
  return <VendorShippingContent vendorProfile={profile as unknown as VendorProfile | null} />;
}
