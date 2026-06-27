import { requireVendorOrAdmin } from "@/lib/auth/session";
import { getUserById } from "@/lib/firebase/firestore";
import { VendorSettingsContent } from "@/components/vendor/vendor-settings-content";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const user = await requireVendorOrAdmin();
  const profile = await getUserById(user.uid);

  return (
    <VendorSettingsContent
      userId={user.uid}
      initialName={profile?.name ?? ""}
      initialEmail={profile?.email ?? ""}
      initialPhone={profile?.phone ?? ""}
    />
  );
}
