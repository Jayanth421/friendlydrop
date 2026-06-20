import { notFound } from "next/navigation";
import { requireVendorOrAdmin } from "@/lib/auth/session";
import { getUserById } from "@/lib/firebase/firestore";
import { getVendorDashboardSnapshot } from "@/lib/enterprise";
import { VendorDashboard } from "@/components/vendor/vendor-dashboard";

export default async function VendorDashboardPage() {
  const user = await requireVendorOrAdmin();
  const profile = await getUserById(user.uid);

  if (!profile) {
    notFound();
  }

  const snapshot = await getVendorDashboardSnapshot(profile);

  return <VendorDashboard snapshot={snapshot} />;
}

