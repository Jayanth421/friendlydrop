import { requireAdminPermission } from "@/lib/auth/session";
import { getAllOrders } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdersDataTable } from "./orders-data-table";

export default async function AdminOrdersPage() {
  await requireAdminPermission("orders:manage");
  const orders = await getAllOrders();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
      </CardHeader>
      <CardContent>
        <OrdersDataTable data={orders} />
      </CardContent>
    </Card>
  );
}
