import { requireAdminPermission } from "@/lib/auth/session";
import { getControlTowerSnapshot } from "@/lib/control-tower";
import { ControlTowerLive } from "@/components/admin/control-tower-live";

export default async function AdminControlTowerPage() {
  await requireAdminPermission("dashboard:view");
  const snapshot = await getControlTowerSnapshot();

  return <ControlTowerLive initialSnapshot={snapshot} />;
}
