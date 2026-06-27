import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getCmsPages, upsertCmsPage, deleteCmsPage } from "@/lib/firebase/firestore";
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = cmsPageSchema.safeParse(body);
    if (!parsed.success) {
      console.error("[CMS POST] Validation error:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const payload = parsed.data;
    const page = await upsertCmsPage({
      ...payload,
      slug: payload.slug.trim().toLowerCase(),
      heroImageUrl: normalizeMediaReference(payload.heroImageUrl) ?? undefined,
    });
    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Please log in again" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN" || error.message === "2FA_REQUIRED") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("[CMS POST] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save CMS page" },
      { status: 500 },
    );
  }
}


export async function DELETE(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id?.trim()) {
      return NextResponse.json({ error: "Missing page id" }, { status: 400 });
    }

    await deleteCmsPage(id.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Please log in again" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN" || error.message === "2FA_REQUIRED") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("[CMS DELETE] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete CMS page" },
      { status: 500 },
    );
  }
}
