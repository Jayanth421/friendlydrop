import { requireAdminPermission } from "@/lib/auth/session";
import { getAutomationCenterConfig } from "@/lib/firebase/firestore";
import { AutomationCenterForm } from "@/components/admin/automation-center-form";

export default async function AdminAutomationPage() {
  await requireAdminPermission("settings:manage");
  const config = await getAutomationCenterConfig();

  return <AutomationCenterForm initialConfig={config} />;
}

