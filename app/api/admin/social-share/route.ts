import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getSocialShareConfig, getSocialShareLinks, updateSocialShareConfig } from "@/lib/firebase/firestore";
import { socialShareConfigSchema } from "@/lib/validators";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "marketing:manage");
  const [config, links] = await Promise.all([getSocialShareConfig(), getSocialShareLinks(100)]);

  return NextResponse.json({
    config,
    links,
    summary: {
      totalLinks: links.length,
      clicks: links.reduce((sum, link) => sum + link.clicks, 0),
      conversions: links.reduce((sum, link) => sum + link.conversions, 0),
      revenue: links.reduce((sum, link) => sum + link.revenue, 0),
    },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "marketing:manage");
    const payload = socialShareConfigSchema.partial().parse(await request.json());

    await updateSocialShareConfig(payload);
    const config = await getSocialShareConfig();

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "marketing",
      source: "api:social-share-config",
      actorId: admin.uid,
      payload: {
        referralRewardsEnabled: config.referralRewardsEnabled,
        rewardPointsPerReferral: config.rewardPointsPerReferral,
      },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update social sharing settings" }, { status: 400 });
  }
}
