import { requireAdminPermission } from "@/lib/auth/session";
import { getAllOrders } from "@/lib/firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/admin/status-pill";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";
import { ShippingUpdater } from "@/components/admin/shipping-updater";
import { OrderRefundButton } from "@/components/admin/order-refund-button";

export default async function AdminOrdersPage() {
  await requireAdminPermission("orders:manage");
  const orders = await getAllOrders();

  return (
    <Card>
      <CardHeader><CardTitle>Order Management</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell><StatusPill status={order.status} /></TableCell>
                <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                <TableCell><OrderStatusUpdater orderId={order.id} currentStatus={order.status} /></TableCell>
                <TableCell><ShippingUpdater orderId={order.id} shipping={order.shipping} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <a href={`/api/admin/orders/${order.id}/invoice`} className="rounded bg-slate-100 px-2 py-1 text-xs">Invoice</a>
                    <OrderRefundButton orderId={order.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
