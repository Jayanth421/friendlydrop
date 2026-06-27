import { requireAdminPermission } from "@/lib/auth/session";
import { getAllOrders, getStoreSettings } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminShippingPage() {
  await requireAdminPermission("orders:manage");
  const [orders, settings] = await Promise.all([getAllOrders(), getStoreSettings()]);
  const delayed = orders.filter((order) => order.shipping?.eta && new Date(order.shipping.eta).getTime() < Date.now() && order.status !== "delivered").length;
  const withTracking = orders.filter((order) => Boolean(order.shipping?.trackingId)).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Total Shipments</CardTitle></CardHeader><CardContent>{orders.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>With Tracking</CardTitle></CardHeader><CardContent>{withTracking}</CardContent></Card>
        <Card><CardHeader><CardTitle>Potential Delays</CardTitle></CardHeader><CardContent>{delayed}</CardContent></Card>
        <Card><CardHeader><CardTitle>Delivery Mode</CardTitle></CardHeader><CardContent>{settings.delivery.enabled ? "Enabled" : "Disabled"}</CardContent></Card>
      </div>

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

      <Card>
        <CardHeader><CardTitle>Delivery Rules Snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Express enabled: {settings.delivery.expressEnabled ? "yes" : "no"}</p>
          <p>Same-day enabled: {settings.delivery.sameDayEnabled ? "yes" : "no"}</p>
          <p>Zones configured: {settings.delivery.zones.length}</p>
          <p>Pricing rules: {settings.delivery.pricingRules.length}</p>
          <p>Free-delivery rules: {settings.delivery.freeDeliveryRules.length}</p>
          <p>Blocked pincodes: {settings.delivery.blockedPincodes.length}</p>
        </CardContent>
      </Card>
    </div>
  );
}

