import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getCmsPages, upsertCmsPage } from "@/lib/firebase/firestore";
import { cmsPageSchema } from "@/lib/validators";
import { normalizeMediaReference } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const pages = await getCmsPages();
  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");
    const payload = cmsPageSchema.parse(await request.json());
    const page = await upsertCmsPage({
      ...payload,
      slug: payload.slug.trim().toLowerCase(),
      heroImageUrl: normalizeMediaReference(payload.heroImageUrl),
    });
    return NextResponse.json({ page });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save CMS page" }, { status: 400 });
  }
}

