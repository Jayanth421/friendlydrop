import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { bannerSchema } from "@/lib/validators";
import { deleteBanner, updateBanner } from "@/lib/enterprise";
import { normalizeMediaReference } from "@/lib/media";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { bannerId: string } }) {
  try {
    await requireApiPermission(request, "banners:manage");
    const payload = bannerSchema.partial().parse(await request.json());
    await updateBanner(params.bannerId, {
      ...payload,
      ...(payload.imageDesktop ? { imageDesktop: normalizeMediaReference(payload.imageDesktop) ?? payload.imageDesktop } : {}),
      ...(payload.imageMobile !== undefined ? { imageMobile: normalizeMediaReference(payload.imageMobile) } : {}),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update banner" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { bannerId: string } }) {
  try {
    await requireApiPermission(request, "banners:manage");
    await deleteBanner(params.bannerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not delete banner" }, { status: 400 });
  }
}
