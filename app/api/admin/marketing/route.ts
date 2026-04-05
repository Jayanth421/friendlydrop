import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { campaignSchema } from "@/lib/validators";
import { createMarketingCampaign, getMarketingCampaigns } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "marketing:manage");
  const campaigns = await getMarketingCampaigns();
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(request, "marketing:manage");
    const payload = campaignSchema.parse(await request.json());
    const campaign = await createMarketingCampaign(payload);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create campaign" }, { status: 400 });
  }
}
