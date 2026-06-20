import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { RevenueByCategoryChart } from "@/components/admin/revenue-by-category-chart";
import { requireAdminPermission } from "@/lib/auth/session";
import { getEnterpriseDashboardStats } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { StatusPill } from "@/components/admin/status-pill";

export default async function AdminDashboardPage() {
  await requireAdminPermission("dashboard:view");
  const stats = await getEnterpriseDashboardStats();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={formatCurrency(stats.totalSales)} helper="Daily, weekly, monthly included" />
        <KpiCard label="Orders" value={String(stats.totalOrders)} helper="All lifecycle states" />
        <KpiCard
          label="Customers"
          value={String(stats.totalUsers)}
          helper={`${stats.newCustomers} new • ${stats.returningCustomers} returning`}
        />
        <KpiCard label="Conversion" value={`${stats.conversionRate}%`} helper="Orders / total users" />
      </div>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <RevenueChart points={stats.trendsDaily} />
        </TabsContent>
        <TabsContent value="weekly">
          <RevenueChart points={stats.trendsWeekly} />
        </TabsContent>
        <TabsContent value="monthly">
          <RevenueChart points={stats.trendsMonthly} />
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 xl:grid-cols-2">
        <RevenueByCategoryChart data={stats.revenueByCategory} />

        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topCustomers.map((customer) => (
              <div key={customer.userId} className="flex items-center justify-between rounded-md border border-slate-100 p-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">{customer.name}</p>
                  <p className="text-slate-500">{customer.orders} orders</p>
                </div>
                <p className="font-semibold text-ink">{formatCurrency(customer.spend)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Best Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.bestSellingProducts.map((product) => (
              <div key={product.productId} className="flex items-center justify-between rounded-md border border-slate-100 p-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{product.name}</p>
                  <p className="text-slate-500">{product.unitsSold} sold</p>
                </div>
                <p className="font-semibold">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-md border border-slate-100 p-3 text-sm">
                <div>
                  <p className="font-medium text-ink">#{order.id}</p>
                  <p className="text-slate-500">{order.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                  <StatusPill status={order.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
