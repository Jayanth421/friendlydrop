import { notFound } from "next/navigation";
import { requireVendorOrAdmin } from "@/lib/auth/session";
import { getUserById } from "@/lib/firebase/firestore";
import { getVendorDashboardSnapshot } from "@/lib/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function VendorDashboardPage() {
  const user = await requireVendorOrAdmin();
  const profile = await getUserById(user.uid);

  if (!profile) {
    notFound();
  }

  const snapshot = await getVendorDashboardSnapshot(profile);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-ink">{snapshot.productCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-ink">{snapshot.orderCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-ink">{formatCurrency(snapshot.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-ink">{snapshot.payouts.filter((payout) => payout.status === "pending").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Vendor Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {snapshot.recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
              <div>
                <p className="font-semibold text-ink">#{order.id}</p>
                <p className="text-slate-500">{formatDate(order.createdAt)}</p>
              </div>
              <p className="font-semibold text-ink">{formatCurrency(order.totalAmount)}</p>
            </div>
          ))}
          {!snapshot.recentOrders.length ? <p className="text-slate-500">No vendor orders yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
