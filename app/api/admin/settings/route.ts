import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getStoreSettings, updateStoreSettings } from "@/lib/firebase/firestore";
import { normalizeStoreSettings, withIntegrationHealth } from "@/lib/settings-engine";
import { storeSettingsSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const settings = await getStoreSettings();
  return NextResponse.json({ settings: withIntegrationHealth(settings) });
}

export async function PUT(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");
    const payload = storeSettingsSchema.parse(await request.json());
    await updateStoreSettings(normalizeStoreSettings(payload));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update settings" }, { status: 400 });
  }
}
