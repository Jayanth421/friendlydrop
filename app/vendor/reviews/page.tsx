import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorReviewsContent } from "@/components/vendor/vendor-reviews-content";

import { getVendorReviews } from "@/lib/firebase/vendor";
import { isAdminRole } from "@/lib/rbac";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export default async function VendorReviewsPage() {
  const user = await requireVendorOrAdmin();
  const isInternalAdmin = isAdminRole(user.role);
  
  let reviews = [];
  if (isInternalAdmin) {
    const db = getAdminDb();
    const snap = await db.collection("reviews").get();
    reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } else {
    reviews = await getVendorReviews(user.uid);
  }

  return <VendorReviewsContent initialReviews={reviews} />;
}
