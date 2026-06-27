import { requireAdminPermission } from "@/lib/auth/session";
import { getAllUsers } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRoleUpdater } from "@/components/admin/user-role-updater";
import { UserStatusUpdater } from "@/components/admin/user-status-updater";
import { CustomerNoteForm } from "@/components/admin/customer-note-form";
import { CustomerNotifyForm } from "@/components/admin/customer-notify-form";
import { getCustomerCrmSnapshot } from "@/lib/enterprise";

export default async function AdminCustomersPage() {
  await requireAdminPermission("users:manage");
  const users = await getAllUsers();
  const crm = await getCustomerCrmSnapshot();
  const customers = crm.customers.length ? crm.customers : users;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management (CRM)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          To give vendor dashboard access, find the user below and change Role to vendor. The user must log out and log in again after the role change.
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Total customers</p>
            <p className="text-xl font-semibold text-ink">{customers.length}</p>
          </div>
          <div className="rounded border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">VIP customers</p>
            <p className="text-xl font-semibold text-ink">{customers.filter((user) => user.segment === "vip").length}</p>
          </div>
          <div className="rounded border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Open support tickets</p>
            <p className="text-xl font-semibold text-ink">{crm.openTickets}</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Loyalty</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Notify</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone ?? "-"}</TableCell>
                <TableCell>{user.segment ?? "new"}</TableCell>
                <TableCell>{user.totalSpend ?? 0}</TableCell>
                <TableCell>{user.loyaltyPoints ?? 0}</TableCell>
                <TableCell>{user.walletBalance ?? 0}</TableCell>
                <TableCell>
                  <UserStatusUpdater userId={user.id} currentStatus={user.status ?? "active"} />
                </TableCell>
                <TableCell>
                  <UserRoleUpdater userId={user.id} currentRole={user.role} />
                </TableCell>
                <TableCell>
                  <CustomerNoteForm userId={user.id} />
                </TableCell>
                <TableCell>
                  <CustomerNotifyForm userId={user.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

