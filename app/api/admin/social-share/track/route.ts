import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { recordSocialShareClick } from "@/lib/firebase/firestore";
import { trackSocialShareClickSchema } from "@/lib/validators";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "marketing:manage");
    const payload = trackSocialShareClickSchema.parse(await request.json());
    await recordSocialShareClick(payload.shareId, { converted: payload.converted, revenue: payload.revenue });

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "marketing",
      source: "api:social-share-track",
      actorId: admin.uid,
      payload: {
        shareId: payload.shareId,
        converted: payload.converted ?? false,
        revenue: payload.revenue ?? 0,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not record share click" }, { status: 400 });
  }
}

