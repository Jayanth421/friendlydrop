import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { bannerSchema } from "@/lib/validators";
import { createBanner, getBanners } from "@/lib/enterprise";
import { publishSystemEvent } from "@/lib/system-events";
import { normalizeMediaReference } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(request, "banners:manage");
    const banners = await getBanners();
    return NextResponse.json({ banners });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch banners" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "banners:manage");
    const payload = bannerSchema.parse(await request.json());
    const banner = await createBanner({
      ...payload,
      imageDesktop: normalizeMediaReference(payload.imageDesktop) ?? payload.imageDesktop,
      imageMobile: normalizeMediaReference(payload.imageMobile),
    });

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "marketing",
      source: "api:admin-banners",
      actorId: admin.uid,
      payload: {
        action: "banner_upserted",
        bannerId: banner.id,
        linkedCampaignId: banner.linkedCampaignId,
      },
    });

    return NextResponse.json({ ok: true, banner });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save banner" }, { status: 400 });
  }
}
