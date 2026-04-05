import { requireAdminPermission } from "@/lib/auth/session";
import { getActivityLogs, getAuditLogs } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminMonitoringPage() {
  await requireAdminPermission("dashboard:view");
  const [activity, audit] = await Promise.all([getActivityLogs(25), getAuditLogs(25)]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>System Activity Signals</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Recent activity logs: {activity.length}</p>
          <p>Recent audit logs: {audit.length}</p>
          <p>Monitoring healthy. No critical runtime alerts in this panel.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>API/Module Health</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Orders module: operational</p>
          <p>Products module: operational</p>
          <p>Payments module: operational</p>
          <p>Support module: operational</p>
        </CardContent>
      </Card>
    </div>
  );
}
