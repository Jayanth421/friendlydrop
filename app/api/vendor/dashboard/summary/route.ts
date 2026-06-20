import { NextRequest, NextResponse } from "next/server";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { getUserById } from "@/lib/firebase/firestore";
import { getVendorDashboardSnapshot } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiVendorOrAdmin(request);
    const profile = await getUserById(user.uid);

    if (!profile) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    const snapshot = await getVendorDashboardSnapshot(profile);
    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not fetch vendor dashboard" }, { status: 400 });
  }
}

