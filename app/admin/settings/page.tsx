import { requireAdminPermission } from "@/lib/auth/session";
import { getStoreSettings } from "@/lib/firebase/firestore";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";

export default async function AdminSettingsPage() {
  await requireAdminPermission("settings:manage");
  const settings = await getStoreSettings();

  return <StoreSettingsForm settings={settings} />;
}
