import { requireAdminPermission } from "@/lib/auth/session";
import { getAllOrders } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminShippingPage() {
  await requireAdminPermission("orders:manage");
  const orders = await getAllOrders();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping & Delivery</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Tracking ID</TableHead>
              <TableHead>ETA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{order.shipping?.courier ?? "-"}</TableCell>
                <TableCell>{order.shipping?.trackingId ?? "-"}</TableCell>
                <TableCell>{order.shipping?.eta ? new Date(order.shipping.eta).toLocaleDateString("en-IN") : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
