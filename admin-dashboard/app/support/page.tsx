import { requireAdminPermission } from "@/lib/auth/session";
import { getSupportTickets } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportChatDashboard } from "@/components/admin/support-chat-dashboard";

export default async function AdminSupportPage() {
  await requireAdminPermission("support:manage");
  const tickets = await getSupportTickets();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Support Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <SupportChatDashboard initialTickets={tickets} />
      </CardContent>
    </Card>
  );
}

