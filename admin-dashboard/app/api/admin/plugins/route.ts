import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getPluginApps, upsertPluginApp } from "@/lib/firebase/firestore";
import { pluginAppSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const plugins = await getPluginApps();
  return NextResponse.json({ plugins });
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");
    const payload = pluginAppSchema.parse(await request.json());
    const plugin = await upsertPluginApp({
      ...payload,
      status: payload.status ?? "installed",
    });
    return NextResponse.json({ plugin });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not install plugin" }, { status: 400 });
  }
}

