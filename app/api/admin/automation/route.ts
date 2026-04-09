import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getAutomationCenterConfig, updateAutomationCenterConfig } from "@/lib/firebase/firestore";
import { automationCenterSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const config = await getAutomationCenterConfig();
  return NextResponse.json({ config });
}

export async function PUT(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");
    const payload = automationCenterSchema.parse(await request.json());
    await updateAutomationCenterConfig(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update automation config" }, { status: 400 });
  }
}
