import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireApiPermission } from "@/lib/auth/api";
import { createSocialShareLink, getSocialShareLinks } from "@/lib/firebase/firestore";
import { createSocialShareLinkSchema } from "@/lib/validators";
import { publishSystemEvent } from "@/lib/system-events";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "marketing:manage");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100");
  const links = await getSocialShareLinks(Number.isFinite(limit) ? limit : 100);
  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "marketing:manage");
    const payload = createSocialShareLinkSchema.parse(await request.json());
    const refCode = `FD${nanoid(8).toUpperCase()}`;

    const link = await createSocialShareLink({
      productId: payload.productId,
      platform: payload.platform,
      refCode,
    });

    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "marketing",
      source: "api:social-share-links",
      actorId: admin.uid,
      payload: {
        linkId: link.id,
        platform: link.platform,
        productId: link.productId ?? null,
      },
    });

    return NextResponse.json({ ok: true, link });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create share link" }, { status: 400 });
  }
}

