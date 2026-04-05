import { requireAdminPermission } from "@/lib/auth/session";
import { getReturnRequests } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReturnRequestUpdater } from "@/components/admin/return-request-updater";

export default async function AdminReturnsPage() {
  await requireAdminPermission("returns:manage");
  const returns = await getReturnRequests();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Returns & Refunds</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.id}</TableCell>
                <TableCell>{request.orderId}</TableCell>
                <TableCell>{request.userId}</TableCell>
                <TableCell>{request.reason}</TableCell>
                <TableCell>{request.status}</TableCell>
                <TableCell>
                  <ReturnRequestUpdater request={request} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
