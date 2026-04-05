import { requireAdminPermission } from "@/lib/auth/session";
import { getMarketingCampaigns } from "@/lib/firebase/firestore";
import { MarketingCampaignForm } from "@/components/admin/marketing-campaign-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketingInsights } from "@/lib/enterprise";
import { formatCurrency } from "@/lib/utils";

export default async function AdminMarketingPage() {
  await requireAdminPermission("marketing:manage");
  const [campaigns, insights] = await Promise.all([getMarketingCampaigns(), getMarketingInsights()]);

  return (
    <div className="space-y-4">
      <MarketingCampaignForm />

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Total campaigns</p>
            <p className="text-xl font-semibold text-ink">{insights.campaignCount}</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Active campaigns</p>
            <p className="text-xl font-semibold text-ink">{insights.activeCampaigns.length}</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-slate-500">Campaign revenue</p>
            <p className="text-xl font-semibold text-ink">{formatCurrency(insights.campaignDrivenRevenue)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-ink">{campaign.title}</p>
              <p className="text-slate-500">{campaign.channel} • {campaign.audience} • {campaign.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email & Push Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Template presets: Welcome Coupon, Festival Sale, Flash Sale, Abandoned Cart Reminder.</p>
          <p>Channels: Email (Resend), Push (Firebase), WhatsApp/SMS (Twilio integration-ready).</p>
        </CardContent>
      </Card>
    </div>
  );
}
