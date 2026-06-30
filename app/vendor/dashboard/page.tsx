import { requireVendorOrAdmin } from "@/lib/auth/session";
import { getUserById } from "@/lib/firebase/firestore";
import { getVendorDashboardSnapshot } from "@/lib/enterprise";
import { VendorDashboardContent } from "@/components/vendor/vendor-dashboard-content";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const user = await requireVendorOrAdmin();
  const profile = await getUserById(user.uid);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        <p>Vendor profile not found.</p>
      </div>
    );
  }

  const snapshot = await getVendorDashboardSnapshot(profile);

  return <VendorDashboardContent snapshot={snapshot} />;
}
