import { requireAdminPermission } from "@/lib/auth/session";
import { getControlTowerSnapshot } from "@/lib/control-tower";
import { getMarketingInsights, getVendors } from "@/lib/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  await requireAdminPermission("analytics:view");
  const [tower, marketing, vendors] = await Promise.all([getControlTowerSnapshot(), getMarketingInsights(), getVendors()]);

  const topVendor = [...vendors].sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))[0];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Customer & Revenue Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Revenue (24h): {formatCurrency(tower.kpis.revenue24h)}</p>
          <p>Orders (24h): {tower.kpis.orders24h}</p>
          <p>On-time delivery rate: {tower.kpis.onTimeDeliveryRate}%</p>
          <p>Low stock products: {tower.kpis.lowStockProducts}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Total vendors: {vendors.length}</p>
          <p>Approved vendors: {vendors.filter((vendor) => vendor.status === "approved").length}</p>
          <p>Top vendor: {topVendor?.businessName ?? "-"}</p>
          <p>Top vendor sales: {formatCurrency(topVendor?.totalSales ?? 0)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Total campaigns: {marketing.campaignCount}</p>
          <p>Active campaigns: {marketing.activeCampaigns.length}</p>
          <p>Campaign-driven revenue: {formatCurrency(marketing.campaignDrivenRevenue)}</p>
          <p>Active linked banners: {marketing.activeBanners.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gateway Success Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {tower.gatewayMetrics.map((metric) => (
            <p key={metric.provider}>
              {metric.provider}: {metric.successRate}% ({metric.successful}/{metric.totalAttempts})
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
