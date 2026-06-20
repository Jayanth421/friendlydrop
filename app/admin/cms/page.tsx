import { requireAdminPermission } from "@/lib/auth/session";
import { getCmsPages } from "@/lib/firebase/firestore";
import { CmsManager } from "@/components/admin/cms-manager";

export default async function AdminCmsPage() {
  await requireAdminPermission("settings:manage");
  const pages = await getCmsPages();

  return <CmsManager initialPages={pages} />;
}

