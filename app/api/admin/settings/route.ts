import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getStoreSettings, updateStoreSettings } from "@/lib/firebase/firestore";
import { normalizeStoreSettings, withIntegrationHealth } from "@/lib/settings-engine";
import { storeSettingsSchema } from "@/lib/validators";
import { StoreSettings } from "@/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const settings = await getStoreSettings();
  return NextResponse.json({ settings: withIntegrationHealth(settings) });
}

export async function PUT(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");
    const incoming = (await request.json()) as Partial<StoreSettings>;
    const parsed = storeSettingsSchema.partial().safeParse(incoming);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const path = firstIssue?.path?.join(".") || "settings";
      const message = firstIssue?.message || "Invalid settings payload";
      return NextResponse.json({ error: `Invalid ${path}: ${message}` }, { status: 400 });
    }

    await updateStoreSettings(normalizeStoreSettings(incoming));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Please login again" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "You do not have permission to change settings" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "2FA_REQUIRED") {
      return NextResponse.json({ error: "Complete 2FA verification and retry" }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Could not update settings: ${message}` }, { status: 400 });
  }
}
