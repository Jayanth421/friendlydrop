import { requireAdminPermission } from "@/lib/auth/session";
import { getAllOrders } from "@/lib/firebase/firestore";
import { ReportExporter } from "@/components/admin/report-exporter";

export default async function AdminReportsPage() {
  await requireAdminPermission("reports:export");
  const orders = await getAllOrders();

  return <ReportExporter orders={orders} />;
}

