import { requireAdminPermission } from "@/lib/auth/session";
import { getMobileAppControls } from "@/lib/firebase/firestore";
import { MobileControlsForm } from "@/components/admin/mobile-controls-form";

export default async function AdminMobileControlsPage() {
  await requireAdminPermission("settings:manage");
  const controls = await getMobileAppControls();

  return <MobileControlsForm initialControls={controls} />;
}

