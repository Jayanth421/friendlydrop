import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { updatePluginApp } from "@/lib/firebase/firestore";
import { pluginAppUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: { pluginId: string } }) {
  try {
    await requireApiPermission(request, "settings:manage");
    const payload = pluginAppUpdateSchema.parse(await request.json());
    await updatePluginApp(context.params.pluginId, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update plugin" }, { status: 400 });
  }
}
