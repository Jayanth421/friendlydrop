import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { createMetaAdsCampaign, getMetaAdsCampaigns } from "@/lib/firebase/firestore";
import { metaAdsCampaignSchema } from "@/lib/validators";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "marketing:manage");
  const campaigns = await getMetaAdsCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "marketing:manage");
    const payload = metaAdsCampaignSchema.parse(await request.json());

    const campaign = await createMetaAdsCampaign({
      name: payload.name,
      type: payload.type,
      status: payload.status ?? "draft",
      productIds: payload.productIds,
      dailyBudget: payload.dailyBudget,
    });

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "marketing",
      source: "api:meta-ads-campaign",
      actorId: admin.uid,
      payload: {
        campaignId: campaign.id,
        campaignType: campaign.type,
        productCount: campaign.productIds.length,
        dailyBudget: campaign.dailyBudget,
      },
    });

    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create Meta Ads campaign" }, { status: 400 });
  }
}
