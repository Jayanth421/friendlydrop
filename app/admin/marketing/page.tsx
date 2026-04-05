import { requireAdminPermission } from "@/lib/auth/session";
import { getMarketingCampaigns } from "@/lib/firebase/firestore";
import { MarketingCampaignForm } from "@/components/admin/marketing-campaign-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminMarketingPage() {
  await requireAdminPermission("marketing:manage");
  const campaigns = await getMarketingCampaigns();

  return (
    <div className="space-y-4">
      <MarketingCampaignForm />
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-semibold text-ink">{campaign.title}</p>
              <p className="text-slate-500">{campaign.channel} � {campaign.audience} � {campaign.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
