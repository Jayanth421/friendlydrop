import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getStoreSettings } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeMediaReference } from "@/lib/media";

export const runtime = "nodejs";

// ─── GET — read current website identity fields ───────────────────────────────

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const s = await getStoreSettings();
  const extra = s as unknown as Record<string, unknown>;

  return NextResponse.json({
    storeName:        s.storeName ?? "",
    brandPrefix:      s.brandPrefix ?? "",
    brandTagline:     s.brandTagline ?? "",
    brandDescription: (extra.brandDescription as string) ?? "",
    logoUrl:          s.logoUrl ?? "",
    faviconUrl:       (extra.faviconUrl as string) ?? "",
    supportEmail:     s.supportEmail ?? "",
    supportPhone:     s.supportPhone ?? "",
    orgName:          (extra.orgName as string) ?? s.storeName ?? "",
    address:          (extra.address as string) ?? "",
    landingPage:      (extra.landingPage as string) ?? "home",
  });
}

// ─── PUT — save website identity fields directly (merge) ─────────────────────

export async function PUT(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");

    const body = (await request.json()) as {
      storeName?: string;
      brandPrefix?: string;
      brandTagline?: string;
      brandDescription?: string;
      logoUrl?: string;
      faviconUrl?: string;
      supportEmail?: string;
      supportPhone?: string;
      orgName?: string;
      address?: string;
      landingPage?: string;
    };

    // Build only the fields we are allowed to touch — use merge so we
    // never overwrite delivery / payment / integration settings.
    const patch: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.storeName?.trim())         patch.storeName        = body.storeName.trim();
    if (body.brandPrefix  !== undefined) patch.brandPrefix      = body.brandPrefix.trim();
    if (body.brandTagline !== undefined) patch.brandTagline     = body.brandTagline.trim();
    if (body.brandDescription !== undefined) patch.brandDescription = body.brandDescription.trim();
    if (body.supportEmail?.trim())      patch.supportEmail     = body.supportEmail.trim();
    if (body.supportPhone !== undefined) patch.supportPhone     = body.supportPhone.trim();
    if (body.orgName      !== undefined) patch.orgName          = body.orgName.trim();
    if (body.address      !== undefined) patch.address          = body.address.trim();
    if (body.landingPage  !== undefined) patch.landingPage      = body.landingPage;

    // Normalise media references (handles Supabase paths, absolute URLs, etc.)
    if (body.logoUrl !== undefined) {
      patch.logoUrl = normalizeMediaReference(body.logoUrl.trim()) ?? body.logoUrl.trim();
    }
    if (body.faviconUrl !== undefined) {
      patch.faviconUrl = normalizeMediaReference(body.faviconUrl.trim()) ?? body.faviconUrl.trim();
    }

    // Write with merge — this ONLY updates the fields listed above
    await getAdminDb()
      .collection("settings")
      .doc("default")
      .set(patch, { merge: true });

    // Bust the 60-second Next.js settings cache
    try {
      const { revalidateTag } = await import("next/cache");
      revalidateTag("store-settings");
    } catch {
      // cache revalidation is best-effort in non-Next contexts
    }

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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
