import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getMetaAdsConfig, updateMetaAdsConfig } from "@/lib/firebase/firestore";
import { metaAdsConfigSchema } from "@/lib/validators";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "marketing:manage");
  const config = await getMetaAdsConfig();
  return NextResponse.json({ config });
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "marketing:manage");
    const payload = metaAdsConfigSchema.partial().parse(await request.json());

    await updateMetaAdsConfig(payload);
    const config = await getMetaAdsConfig();

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "marketing",
      source: "api:meta-ads-config",
      actorId: admin.uid,
      payload: {
        connected: config.connected,
        syncEnabled: config.syncEnabled,
        testMode: config.testMode,
      },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update Meta Ads configuration" }, { status: 400 });
  }
}
