import { requireAdminPermission } from "@/lib/auth/session";
import { VisualBuilder } from "@/components/admin/visual-builder";

export default async function AdminBuilderPage() {
  await requireAdminPermission("settings:manage");

  return <VisualBuilder />;
}
