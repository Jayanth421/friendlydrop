import { requireAdminPermission } from "@/lib/auth/session";
import { getAllUsers } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRoleUpdater } from "@/components/admin/user-role-updater";
import { UserStatusUpdater } from "@/components/admin/user-status-updater";
import { CustomerNoteForm } from "@/components/admin/customer-note-form";

export default async function AdminCustomersPage() {
  await requireAdminPermission("users:manage");
  const users = await getAllUsers();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.segment ?? "new"}</TableCell>
                <TableCell>{user.totalSpend ?? 0}</TableCell>
                <TableCell>
                  <UserStatusUpdater userId={user.id} currentStatus={user.status ?? "active"} />
                </TableCell>
                <TableCell>
                  <UserRoleUpdater userId={user.id} currentRole={user.role} />
                </TableCell>
                <TableCell>
                  <CustomerNoteForm userId={user.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
