import { requireAdminPermission } from "@/lib/auth/session";
import { getPluginApps } from "@/lib/firebase/firestore";
import { PluginManager } from "@/components/admin/plugin-manager";

export default async function AdminPluginsPage() {
  await requireAdminPermission("settings:manage");
  const plugins = await getPluginApps();

  return <PluginManager initialPlugins={plugins} />;
}

