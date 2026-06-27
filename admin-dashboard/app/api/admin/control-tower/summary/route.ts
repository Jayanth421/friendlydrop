import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getControlTowerSnapshot } from "@/lib/control-tower";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiPermission(request, "dashboard:view");
    const snapshot = await getControlTowerSnapshot();
    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch control tower data" }, { status: 400 });
  }
}
