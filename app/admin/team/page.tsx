import { requireAdminPermission } from "@/lib/auth/session";
import { getAllUsers } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRoleUpdater } from "@/components/admin/user-role-updater";
import { UserTwoFactorToggle } from "@/components/admin/user-2fa-toggle";

export default async function AdminTeamPage() {
  await requireAdminPermission("team:manage");
  const users = (await getAllUsers()).filter((user) => user.role !== "user");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team & Staff Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <UserRoleUpdater userId={user.id} currentRole={user.role} />
                </TableCell>
                <TableCell>
                  <UserTwoFactorToggle userId={user.id} enabled={Boolean(user.twoFactorEnabled)} />
                </TableCell>
                <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-IN") : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

