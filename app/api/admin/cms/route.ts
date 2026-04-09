import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getCmsPages, upsertCmsPage } from "@/lib/firebase/firestore";
import { cmsPageSchema } from "@/lib/validators";

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
    const page = await upsertCmsPage(payload);
    return NextResponse.json({ page });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save CMS page" }, { status: 400 });
  }
}
