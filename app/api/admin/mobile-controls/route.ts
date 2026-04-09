import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getMobileAppControls, updateMobileAppControls } from "@/lib/firebase/firestore";
import { mobileAppControlSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const controls = await getMobileAppControls();
  return NextResponse.json({ controls });
}

export async function PUT(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");
    const payload = mobileAppControlSchema.parse(await request.json());
    await updateMobileAppControls(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update mobile controls" }, { status: 400 });
  }
}
