import { requireAdminPermission } from "@/lib/auth/session";
import { getSupportTickets } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupportTicketUpdater } from "@/components/admin/support-ticket-updater";

export default async function AdminSupportPage() {
  await requireAdminPermission("support:manage");
  const tickets = await getSupportTickets();

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRM & Support Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>{ticket.userId}</TableCell>
                <TableCell>{ticket.category}</TableCell>
                <TableCell>{ticket.status}</TableCell>
                <TableCell>
                  <SupportTicketUpdater ticket={ticket} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
